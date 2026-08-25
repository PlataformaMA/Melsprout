// Espejo de un reto publicado hacia la comunidad.
// No es un "use server": es un módulo de servidor normal que usan
// retos-actions (al publicar) y admin-actions (al aprobar la revisión).
import { createAdminClient } from "@/lib/supabase/admin";

// Junta las respuestas del reto en el texto de la publicación.
function armarTexto(respuestas: Record<string, string> | null): string {
  const partes = Object.values(respuestas || {})
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  const texto = partes.join("\n\n").trim();
  return texto.length > 1500 ? texto.slice(0, 1500) + "…" : texto;
}

// Publica (o actualiza) la respuesta de un reto en el foro. Solo se llama con
// retos ya aprobados: lo pendiente de revisión no se muestra a la comunidad.
export async function espejarRetoEnComunidad(datos: {
  userId: string;
  retoId: string;
  respuestas: Record<string, string> | null;
  archivoUrl: string | null;
}): Promise<void> {
  const texto = armarTexto(datos.respuestas);
  if (!texto && !datos.archivoUrl) return; // nada que mostrar

  const admin = createAdminClient();
  const esImagen = !!datos.archivoUrl && !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(datos.archivoUrl);

  const fila = {
    autor_id: datos.userId,
    reto_id: datos.retoId,
    categoria: "Retos",
    texto: texto || "Compartí mi reto 💜",
    imagen_url: esImagen ? datos.archivoUrl : null,
    video_url: esImagen ? null : datos.archivoUrl,
    oculto: false,
  };

  const { data: ya } = await admin
    .from("foros_posts")
    .select("id")
    .eq("reto_id", datos.retoId)
    .eq("autor_id", datos.userId)
    .maybeSingle();

  if (ya) await admin.from("foros_posts").update(fila).eq("id", ya.id);
  else await admin.from("foros_posts").insert(fila);
}

// Si un reto se rechaza o se regresa a pendiente, su publicación se oculta.
export async function ocultarRetoEnComunidad(userId: string, retoId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("foros_posts").update({ oculto: true })
    .eq("reto_id", retoId).eq("autor_id", userId);
}
