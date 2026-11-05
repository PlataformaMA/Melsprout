"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// El portafolio del alumno: sus mejores videos, para que una marca los vea.
//
// Es lo primero que mira una marca antes de elegir a alguien, y hasta hoy no
// existía: el perfil enseñaba seguidores, no trabajo. Vive en el perfil (lo
// sube su dueña) y se asoma, en solo lectura, en la ficha que ven la marca y
// el equipo.
//
// El archivo NO pasa por el servidor: medio giga no cabe en una server action.
// Se firma una URL de subida y el navegador sube directo al bucket, igual que
// las entregas de campaña.

export type VideoPortafolio = {
  id: string;
  nombre: string | null;
  duracion: number | null;
  // Enlaces firmados, listos para <video> y <img>. Caducan; la página se
  // vuelve a pintar en cada visita, así que siempre llegan frescos.
  url: string;
  portada: string | null;
};

const MAX_VIDEOS = 12;
const MAX_MB = 500;
const TIPOS = ["mp4", "mov"];
// Suficiente para ver el portafolio con calma sin dejar enlaces vivos un día.
const VIGENCIA = 60 * 60 * 3;

export async function limitesPortafolio(): Promise<{ maxVideos: number; maxMb: number; tipos: string[] }> {
  return { maxVideos: MAX_VIDEOS, maxMb: MAX_MB, tipos: TIPOS };
}

async function yo() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  return user;
}

// Los videos de una persona, con los enlaces ya firmados.
//
// Lo ve cualquiera con sesión: es un portafolio, está hecho para enseñarse.
// Lo que no es público es el archivo en sí — el bucket es privado y el enlace
// se firma aquí, al momento.
export async function videosDe(userId: string): Promise<VideoPortafolio[]> {
  if (!(await yo())) return [];
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("portafolio_videos")
      .select("id, ruta, portada, nombre, duracion")
      .eq("user_id", userId)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(MAX_VIDEOS);
    if (!data?.length) return [];

    // Una sola llamada para todo: firmar de uno en uno serían 24 viajes.
    const rutas = data.flatMap((v) => [v.ruta as string, (v.portada as string) || null])
      .filter(Boolean) as string[];
    const { data: firmas } = await admin.storage.from("portafolio")
      .createSignedUrls(rutas, VIGENCIA);
    const url = new Map(
      (firmas || []).filter((f) => f.signedUrl).map((f) => [f.path as string, f.signedUrl])
    );

    return data
      .map((v) => ({
        id: v.id as string,
        nombre: (v.nombre as string) || null,
        duracion: (v.duracion as number) ?? null,
        url: url.get(v.ruta as string) || "",
        portada: v.portada ? url.get(v.portada as string) || null : null,
      }))
      // Si el archivo ya no está en el bucket, no se pinta una tarjeta rota.
      .filter((v) => v.url);
  } catch {
    return [];
  }
}

export async function misVideos(): Promise<VideoPortafolio[]> {
  const user = await yo();
  return user ? videosDe(user.id) : [];
}

// ————————————————— Subir —————————————————

export async function urlParaSubirVideo(
  nombre: string, peso: number
): Promise<{ ruta: string; token: string } | { error: string }> {
  const user = await yo();
  if (!user) return { error: "Inicia sesión." };

  const ext = (nombre.split(".").pop() || "").toLowerCase();
  if (!TIPOS.includes(ext)) return { error: `Se aceptan videos ${TIPOS.join(" y ").toUpperCase()}.` };
  if (peso > MAX_MB * 1024 * 1024) return { error: `El video pasa de ${MAX_MB} MB.` };

  const { count } = await createAdminClient().from("portafolio_videos")
    .select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count || 0) >= MAX_VIDEOS) {
    return { error: `Tu portafolio ya tiene ${MAX_VIDEOS} videos. Borra uno para subir otro.` };
  }

  // El nombre lo escribe el servidor: uno del usuario podría salirse de su
  // carpeta o pisar el video de alguien más.
  const ruta = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from("portafolio").createSignedUploadUrl(ruta);
  if (error || !data) return { error: "No se pudo preparar la subida." };
  return { ruta, token: data.token };
}

// La portada es un cuadro del propio video, sacado en el navegador al subirlo.
// Sin ella la rejilla serían seis videos cargando a la vez solo para pintarse.
export async function urlParaSubirPortada(): Promise<{ ruta: string; token: string } | { error: string }> {
  const user = await yo();
  if (!user) return { error: "Inicia sesión." };

  const ruta = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { data, error } = await createAdminClient()
    .storage.from("portafolio").createSignedUploadUrl(ruta);
  if (error || !data) return { error: "No se pudo preparar la portada." };
  return { ruta, token: data.token };
}

export async function registrarVideo(
  ruta: string, nombre: string, peso: number,
  duracion: number | null, portada: string | null
): Promise<{ ok: true } | { error: string }> {
  const user = await yo();
  if (!user) return { error: "Inicia sesión." };
  // Las rutas las firmó el servidor con este prefijo; si no coinciden, no se
  // anotan: si no, se podría colgar del portafolio un archivo de otra carpeta.
  if (!ruta.startsWith(`${user.id}/`)) return { error: "Archivo inválido." };
  if (portada && !portada.startsWith(`${user.id}/`)) portada = null;

  try {
    const admin = createAdminClient();
    // El último en subir queda primero: es lo que acaba de elegir enseñar.
    const { data: tope } = await admin.from("portafolio_videos")
      .select("orden").eq("user_id", user.id)
      .order("orden", { ascending: true }).limit(1).maybeSingle();

    const { error } = await admin.from("portafolio_videos").insert({
      user_id: user.id,
      ruta,
      portada,
      nombre: nombre.slice(0, 180),
      peso,
      duracion,
      orden: ((tope?.orden as number) ?? 0) - 1,
    });
    if (error) return { error: "No se pudo guardar el video." };
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar el video." };
  }
}

// ————————————————— Ordenar y borrar —————————————————

// "Poner al inicio": el orden del portafolio es el mensaje. El mejor video va
// primero porque casi nadie baja más allá de la primera fila.
export async function fijarPrimero(id: string): Promise<{ ok: true } | { error: string }> {
  const user = await yo();
  if (!user) return { error: "Inicia sesión." };
  try {
    const admin = createAdminClient();
    const { data: tope } = await admin.from("portafolio_videos")
      .select("orden").eq("user_id", user.id)
      .order("orden", { ascending: true }).limit(1).maybeSingle();

    const { error } = await admin.from("portafolio_videos")
      .update({ orden: ((tope?.orden as number) ?? 0) - 1 })
      .eq("id", id).eq("user_id", user.id);
    if (error) return { error: "No se pudo mover." };
    return { ok: true };
  } catch {
    return { error: "No se pudo mover." };
  }
}

export async function borrarVideo(id: string): Promise<{ ok: true } | { error: string }> {
  const user = await yo();
  if (!user) return { error: "Inicia sesión." };
  try {
    const admin = createAdminClient();
    // El .eq("user_id") es el candado: sin él, un id ajeno borraría ajeno.
    const { data: v } = await admin.from("portafolio_videos")
      .select("ruta, portada").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!v) return { error: "Ese video no es tuyo." };

    const { error } = await admin.from("portafolio_videos")
      .delete().eq("id", id).eq("user_id", user.id);
    if (error) return { error: "No se pudo borrar." };

    // El archivo se va detrás de la fila. Si esto falla, queda un huérfano en
    // el bucket: molesto, no grave, y la fila —que es lo que se ve— ya no está.
    const rutas = [v.ruta as string, (v.portada as string) || null].filter(Boolean) as string[];
    await admin.storage.from("portafolio").remove(rutas);
    return { ok: true };
  } catch {
    return { error: "No se pudo borrar." };
  }
}
