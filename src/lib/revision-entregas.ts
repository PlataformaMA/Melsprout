"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { puedeVerAplicacion, soyDelEquipo } from "@/lib/acceso-campania";
import { notificar } from "@/lib/notificaciones-actions";

// La revisión de lo que entrega la creadora: ver el video, aprobarlo o
// devolverlo con comentarios y capturas.
//
// Los archivos ya los sube la creadora (ver creador-campanias.ts). Aquí vive
// el otro lado: el de quien los revisa, que es la marca o el equipo.

// Quién puede revisar esta colaboración. Se parte de la colaboración porque es
// lo que tiene a la mano la tabla de Colaboraciones.
async function puedeRevisar(colaboracionId: string): Promise<boolean> {
  try {
    const { data } = await createAdminClient()
      .from("campania_colaboraciones").select("aplicacion_id").eq("id", colaboracionId).maybeSingle();
    return data ? puedeVerAplicacion(data.aplicacion_id as string) : false;
  } catch {
    return false;
  }
}

export type Entrega = {
  id: string;
  tipo: string;
  ruta: string;
  nombre: string;
  peso: number | null;
  estado: string;
  fecha: string;
};

export async function entregasDe(colaboracionId: string): Promise<Entrega[]> {
  if (!(await puedeRevisar(colaboracionId))) return [];
  try {
    const { data } = await createAdminClient()
      .from("colaboracion_entregas")
      .select("id, tipo, ruta, nombre, peso, estado, created_at")
      .eq("colaboracion_id", colaboracionId)
      .order("created_at", { ascending: false });
    return (data || []).map((e) => ({
      id: e.id as string,
      tipo: (e.tipo as string) || "video",
      ruta: e.ruta as string,
      nombre: (e.nombre as string) || "archivo",
      peso: (e.peso as number) ?? null,
      estado: (e.estado as string) || "en_revision",
      fecha: e.created_at as string,
    }));
  } catch {
    return [];
  }
}

// La URL firmada para ver o bajar el archivo. Dura una hora: lo suficiente
// para revisar un video sin dejar un enlace vivo para siempre.
export async function urlDeEntrega(colaboracionId: string, ruta: string): Promise<string | null> {
  if (!(await puedeRevisar(colaboracionId))) return null;
  if (!ruta.startsWith(`${colaboracionId}/`)) return null;
  try {
    const { data } = await createAdminClient()
      .storage.from("entregas").createSignedUrl(ruta, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export type ComentarioEntrega = {
  id: string;
  autorTipo: string;
  autorNombre: string;
  sobre: string;
  texto: string | null;
  adjuntos: { ruta: string; nombre: string; peso: number | null }[];
  fecha: string;
};

export async function comentariosDe(
  colaboracionId: string, sobre = "video",
): Promise<ComentarioEntrega[]> {
  if (!(await puedeRevisar(colaboracionId))) return [];
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("colaboracion_comentarios")
      .select("id, autor_tipo, autor_id, sobre, texto, adjuntos, created_at")
      .eq("colaboracion_id", colaboracionId)
      .eq("sobre", sobre)
      .order("created_at", { ascending: true });
    if (!data?.length) return [];

    const { data: perfiles } = await db
      .from("profiles").select("id, full_name")
      .in("id", data.map((c) => c.autor_id as string).filter(Boolean));
    const nombre = new Map((perfiles || []).map((p) => [p.id as string, p.full_name as string]));

    return data.map((c) => ({
      id: c.id as string,
      autorTipo: (c.autor_tipo as string) || "marca",
      autorNombre: nombre.get(c.autor_id as string)
        || ((c.autor_tipo as string) === "creador" ? "La creadora"
          : (c.autor_tipo as string) === "equipo" ? "Boost Academy" : "La marca"),
      sobre: (c.sobre as string) || "video",
      texto: (c.texto as string) || null,
      adjuntos: ((c.adjuntos as { ruta: string; nombre: string; peso: number | null }[]) || []),
      fecha: c.created_at as string,
    }));
  } catch {
    return [];
  }
}

// Aprobar la entrega, o devolverla para corregir. Mover el estatus de la
// colaboración va aparte, a propósito: aprobar el archivo no siempre quiere
// decir que la colaboración esté cerrada.
export async function revisarEntrega(
  colaboracionId: string, entregaId: string, aprobada: boolean,
): Promise<{ ok: true } | { error: string }> {
  if (!(await puedeRevisar(colaboracionId))) return { error: "No puedes revisar esta entrega." };

  const db = createAdminClient();
  const { error } = await db
    .from("colaboracion_entregas")
    .update({ estado: aprobada ? "aprobado" : "por_corregir" })
    .eq("id", entregaId)
    .eq("colaboracion_id", colaboracionId);
  if (error) return { error: "No se pudo guardar." };

  if (aprobada) {
    // Al aprobar el video, la entrega final de la colaboración queda aprobada.
    await db.from("campania_colaboraciones")
      .update({ entrega_final: "aprobado", updated_at: new Date().toISOString() })
      .eq("id", colaboracionId);
  }

  await avisarALaCreadora(colaboracionId,
    aprobada ? "¡Aprobaron tu video! 🎉" : "Tu video tiene comentarios",
    aprobada
      ? "Tu entrega quedó aprobada. Ya puedes ver el detalle de tu campaña."
      : "La marca te pidió un par de ajustes. Entra a ver los comentarios.");
  return { ok: true };
}

export async function comentarEntrega(
  colaboracionId: string,
  sobre: string,
  texto: string,
  adjuntos: { ruta: string; nombre: string; peso: number | null }[] = [],
): Promise<{ ok: true } | { error: string }> {
  if (!(await puedeRevisar(colaboracionId))) return { error: "No puedes comentar aquí." };
  if (!texto.trim() && adjuntos.length === 0) return { error: "Escribe el comentario antes de mandarlo." };
  if (adjuntos.some((a) => !a.ruta.startsWith(`${colaboracionId}/`))) {
    return { error: "Adjunto inválido." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const esEquipo = await soyDelEquipo();

  const { error } = await createAdminClient().from("colaboracion_comentarios").insert({
    colaboracion_id: colaboracionId,
    autor_tipo: esEquipo ? "equipo" : "marca",
    autor_id: user?.id ?? null,
    sobre,
    texto: texto.trim() || null,
    adjuntos,
  });
  if (error) return { error: "No se pudo guardar el comentario." };

  await avisarALaCreadora(colaboracionId, "Tienes un comentario nuevo 💬",
    texto.trim().slice(0, 120) || "Te mandaron capturas con correcciones.");
  return { ok: true };
}

// Subir una captura con correcciones. Va al mismo bucket que las entregas,
// bajo la carpeta de esta colaboración, para que se borre con ella.
const CAPTURA_MB = 10;
const CAPTURA_TIPOS = ["png", "jpg", "jpeg", "webp"];

export async function urlParaCaptura(
  colaboracionId: string, nombre: string, peso: number,
): Promise<{ ruta: string; token: string } | { error: string }> {
  if (!(await puedeRevisar(colaboracionId))) return { error: "No autorizado." };

  const ext = (nombre.split(".").pop() || "").toLowerCase();
  if (!CAPTURA_TIPOS.includes(ext)) {
    return { error: `Solo imágenes: ${CAPTURA_TIPOS.join(", ").toUpperCase()}.` };
  }
  if (peso > CAPTURA_MB * 1024 * 1024) return { error: `La imagen pasa de ${CAPTURA_MB} MB.` };

  const ruta = `${colaboracionId}/correcciones/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from("entregas").createSignedUploadUrl(ruta);
  if (error || !data) return { error: "No se pudo preparar la subida." };
  return { ruta, token: data.token };
}

async function avisarALaCreadora(colaboracionId: string, titulo: string, texto: string) {
  try {
    const db = createAdminClient();
    const { data: col } = await db
      .from("campania_colaboraciones").select("aplicacion_id").eq("id", colaboracionId).maybeSingle();
    if (!col) return;
    const { data: app } = await db
      .from("campania_aplicaciones").select("user_id").eq("id", col.aplicacion_id as string).maybeSingle();
    if (!app) return;
    await notificar(app.user_id as string, "general", titulo, texto, "/app/campanias");
  } catch {
    // Un aviso que no sale no debe tumbar lo que ya quedó guardado.
  }
}
