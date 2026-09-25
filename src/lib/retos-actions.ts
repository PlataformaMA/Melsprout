"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { espejarRetoEnComunidad } from "@/lib/reto-publicacion";
import { registrarRacha } from "@/lib/racha-actions";

export type RetoGuardado = {
  respuestas: Record<string, string>;
  archivo_url: string | null;
  estado: "borrador" | "publicado";
  revision: "aprobado" | "rechazado" | null;
  revision_comentario: string | null;
} | null;

// Lee la respuesta guardada del usuario para un reto.
export async function getRetoSubmission(retoId: string): Promise<RetoGuardado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Nota: NO seleccionamos 'revision_comentario' aquí para no depender del SQL 19.
  // El comentario de rechazo se lee aparte de forma resiliente más abajo.
  const { data } = await supabase
    .from("reto_submissions")
    .select("respuestas, archivo_url, estado, revision")
    .eq("user_id", user.id)
    .eq("reto_id", retoId)
    .maybeSingle();
  if (!data) return null;

  // Comentario de rechazo (opcional; solo si existe la columna del SQL 19).
  let comentario: string | null = null;
  const cm = await supabase
    .from("reto_submissions")
    .select("revision_comentario")
    .eq("user_id", user.id)
    .eq("reto_id", retoId)
    .maybeSingle();
  if (!cm.error) comentario = (cm.data?.revision_comentario as string) ?? null;

  return {
    respuestas: (data.respuestas as Record<string, string>) || {},
    archivo_url: data.archivo_url ?? null,
    estado: (data.estado as "borrador" | "publicado") || "borrador",
    revision: (data.revision as "aprobado" | "rechazado" | null) ?? null,
    revision_comentario: comentario,
  };
}

// Guarda (borrador) o publica un reto. Suma XP la primera vez que se publica.
export async function guardarReto(
  retoId: string,
  respuestas: Record<string, string>,
  estado: "borrador" | "publicado",
  archivoUrl: string | null,
  _xpCliente?: number,          // se ignora: el XP lo decide el servidor
  _revisaCliente?: "sola" | "equipo",
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  // El XP y quién revisa salen del reto guardado, NUNCA de lo que mande el
  // navegador: antes se podían pedir un millón de XP auto-aprobados.
  const { getRetoUnificado } = await import("@/lib/retos-db");
  const def = await getRetoUnificado(retoId);
  if (!def) return { error: "Ese reto ya no existe." };
  const xp = Math.min(Math.max(def.xp ?? 0, 0), 500);
  const revisa = def.revisa ?? "equipo";

  const admin = createAdminClient();
  // Lo ya pagado por este reto (rechazar y volver a publicar no vuelve a pagar).
  const { data: prev } = await admin
    .from("reto_submissions")
    .select("estado, xp_otorgado")
    .eq("user_id", user.id)
    .eq("reto_id", retoId)
    .maybeSingle();
  const yaCobrado = ((prev?.xp_otorgado as number) ?? 0) > 0;

  // Al PUBLICAR: si es 'sola' se auto-aprueba (va directo a la comunidad);
  // si es 'equipo' queda 'pendiente' (revisión 48h). Borrador → pendiente.
  const revision = estado === "publicado" ? (revisa === "sola" ? "aprobado" : "pendiente") : "pendiente";
  const pagaAhora = estado === "publicado" && !yaCobrado && xp > 0;

  const { error } = await admin.from("reto_submissions").upsert({
    user_id: user.id,
    reto_id: retoId,
    respuestas,
    archivo_url: archivoUrl,
    estado,
    revision,
    xp_otorgado: pagaAhora ? xp : ((prev?.xp_otorgado as number) ?? 0),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "No se pudo guardar el reto." };

  // Sumar XP la primera vez que se publica (suma atómica).
  if (pagaAhora) {
    await admin.rpc("sumar_xp", { p_user: user.id, p_xp: xp });
  }
  if (estado === "publicado") await registrarRacha(); // cuenta actividad de hoy

  // Si se aprueba solo (revisión "sola"), ya puede verse en la comunidad y
  // recibir me gusta y comentarios. Lo que va a revisión se espeja al aprobarse.
  if (estado === "publicado" && revision === "aprobado") {
    await espejarRetoEnComunidad({ userId: user.id, retoId, respuestas, archivoUrl });
  }
  return { ok: true };
}

// Sube una imagen (captura de perfil) del reto y devuelve su URL pública.
export async function subirImagenReto(
  retoId: string,
  dataUrl: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return { error: "Formato de imagen no válido." };
  const contentType = m[1];
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > 3_000_000) return { error: "La imagen es muy grande (máx. 3 MB)." };

  const ext = contentType.split("/")[1];
  const path = `${user.id}/reto-${retoId}.${ext}`;
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType, upsert: true });
  if (upErr) return { error: "No se pudo subir la imagen." };
  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  return { url: `${pub.publicUrl}?v=${Date.now()}` };
}
