"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Recurso = {
  id: string;
  claseId: string | null;
  titulo: string;
  descripcion: string;
  tipo: "pdf" | "plantillas" | "canva" | "links";
  etiqueta: string | null;
  emoji: string;
  peso: string | null;
  url: string | null;      // recurso externo (Canva, link)
  esArchivo: boolean;      // vive en el bucket y se descarga
  descargado: boolean;     // este alumno ya lo bajó
  bloqueado: boolean;      // su clase (o su XP) todavía no lo desbloquea
  xp: number | null;       // recompensa del cofre: XP necesario
};

// Una recompensa del cofre (recurso con XP). `pronto` = todavía no hay archivo.
export type Recompensa = {
  id: string;
  xp: number;
  titulo: string;
  descripcion: string;
  tipo: Recurso["tipo"];
  emoji: string;
  peso: string | null;
  pronto: boolean;
  desbloqueado: boolean;
  descargado: boolean;
};

// Lista los recursos con el estado REAL de este alumno: cuáles ya descargó y
// cuáles siguen bloqueados porque su clase aún no llega.
export async function getRecursos(clasesDesbloqueadas: string[]): Promise<Recurso[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: filas }, { data: mias }, { data: perfil }] = await Promise.all([
    supabase.from("recursos").select("*").eq("activo", true).order("orden"),
    supabase.from("recurso_descargas").select("recurso_id").eq("user_id", user.id),
    supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle(),
  ]);
  const miXp = (perfil?.xp as number) || 0;

  const yaBajados = new Set((mias || []).map((d) => d.recurso_id as string));
  const abiertas = new Set(clasesDesbloqueadas);

  return (filas || []).map((r) => ({
    id: r.id as string,
    claseId: (r.clase_id as string) ?? null,
    titulo: r.titulo as string,
    descripcion: (r.descripcion as string) || "",
    tipo: (r.tipo as Recurso["tipo"]) || "pdf",
    etiqueta: (r.etiqueta as string) ?? null,
    emoji: (r.emoji as string) || "📄",
    peso: (r.peso as string) ?? null,
    url: (r.url as string) ?? null,
    esArchivo: !!r.archivo,
    descargado: yaBajados.has(r.id as string),
    xp: (r.xp as number) ?? null,
    // Sin clase asociada = disponible siempre, salvo que sea recompensa del cofre.
    bloqueado: (!!r.clase_id && !abiertas.has(r.clase_id as string))
      || (typeof r.xp === "number" && miXp < (r.xp as number)),
  }));
}

// Devuelve un enlace temporal para bajar el archivo y anota la descarga.
// El bucket es privado: sin esta firma el archivo no se puede alcanzar.
export async function descargarRecurso(
  recursoId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const admin = createAdminClient();
  const { data: r } = await admin
    .from("recursos")
    .select("archivo, url, activo, xp")
    .eq("id", recursoId)
    .maybeSingle();
  if (!r || !r.activo) return { error: "Ese recurso ya no está disponible." };

  // Recompensa del cofre: se comprueba el XP en el servidor, no solo en pantalla.
  if (typeof r.xp === "number") {
    const { data: perfil } = await admin.from("profiles").select("xp").eq("id", user.id).maybeSingle();
    if (((perfil?.xp as number) || 0) < (r.xp as number))
      return { error: `Necesitas ${(r.xp as number).toLocaleString("es-MX")} XP para desbloquear esta recompensa.` };
  }

  // Recurso externo (Canva, link): no hay archivo que firmar.
  if (!r.archivo) {
    if (!r.url) return { error: "Ese recurso no tiene archivo." };
    await anotar(user.id, recursoId);
    return { url: r.url as string };
  }

  const { data: firma, error } = await admin.storage
    .from("recursos")
    .createSignedUrl(r.archivo as string, 60 * 5, { download: true });
  if (error || !firma?.signedUrl) return { error: "No se pudo preparar la descarga." };

  await anotar(user.id, recursoId);
  return { url: firma.signedUrl };
}

async function anotar(userId: string, recursoId: string) {
  const admin = createAdminClient();
  await admin
    .from("recurso_descargas")
    .upsert({ user_id: userId, recurso_id: recursoId }, { onConflict: "user_id,recurso_id" });
}

// Las recompensas del cofre de este alumno, en orden de XP.
export async function getRecompensas(): Promise<Recompensa[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: filas }, { data: mias }, { data: perfil }] = await Promise.all([
    supabase.from("recursos").select("*").eq("activo", true).not("xp", "is", null).order("xp"),
    supabase.from("recurso_descargas").select("recurso_id").eq("user_id", user.id),
    supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle(),
  ]);
  const miXp = (perfil?.xp as number) || 0;
  const yaBajados = new Set((mias || []).map((d) => d.recurso_id as string));

  return (filas || []).map((r) => ({
    id: r.id as string,
    xp: r.xp as number,
    titulo: r.titulo as string,
    descripcion: (r.descripcion as string) || "",
    tipo: (r.tipo as Recurso["tipo"]) || "pdf",
    emoji: (r.emoji as string) || "🎁",
    peso: (r.peso as string) ?? null,
    pronto: !r.archivo && !r.url,
    desbloqueado: miXp >= (r.xp as number),
    descargado: yaBajados.has(r.id as string),
  }));
}
