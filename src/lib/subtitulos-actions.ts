"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

// Subtítulos automáticos con AssemblyAI. El flujo es asíncrono: se manda la URL
// del video, ellos transcriben y nosotros guardamos el .vtt en Storage.
const API = "https://api.assemblyai.com/v2/transcript";

// Nombres propios que el modelo no conoce y siempre escribe mal.
const TERMINOS = ["Melsprout", "Octi", "UGC", "reel", "reels", "engagement", "TikTok", "Instagram"];

export type EstadoSubs =
  | { estado: "listo"; url: string }
  | { estado: "procesando" }
  | { estado: "sin-video" }
  | { estado: "sin-llave" }
  | { error: string };

async function soloAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return null;
  return user.id;
}

function llave(): string {
  return process.env.ASSEMBLYAI_API_KEY || "";
}

// Guarda el .vtt en Storage y deja la URL en la clase.
async function guardarVtt(claseId: string, vtt: string): Promise<string | null> {
  const admin = createAdminClient();
  const ruta = `subtitulos/${claseId}.vtt`;
  const { error } = await admin.storage.from("retos").upload(ruta, new Blob([vtt], { type: "text/vtt" }), {
    upsert: true,
    contentType: "text/vtt",
  });
  if (error) return null;
  const { data } = admin.storage.from("retos").getPublicUrl(ruta);
  // cache-busting: si se regenera, el navegador no debe servir el viejo.
  const url = `${data.publicUrl}?v=${Date.now()}`;
  await admin.from("cursos_clases").update({ subtitulos_url: url, subtitulos_job: null }).eq("id", claseId);
  return url;
}

// ¿Ya terminó el trabajo? Si sí, guarda el .vtt.
async function revisarTrabajo(claseId: string, jobId: string): Promise<EstadoSubs> {
  const key = llave();
  const r = await fetch(`${API}/${jobId}`, { headers: { authorization: key }, cache: "no-store" });
  if (!r.ok) return { error: `AssemblyAI respondió ${r.status}` };
  const j = await r.json();

  if (j.status === "error") return { error: j.error || "La transcripción falló." };
  if (j.status !== "completed") return { estado: "procesando" };

  const v = await fetch(`${API}/${jobId}/vtt`, { headers: { authorization: key }, cache: "no-store" });
  if (!v.ok) return { error: "No se pudo bajar el .vtt." };
  const url = await guardarVtt(claseId, await v.text());
  return url ? { estado: "listo", url } : { error: "No se pudo guardar el archivo." };
}

// Arranca la transcripción de una clase (o continúa la que ya estaba en curso).
export async function generarSubtitulos(claseId: string): Promise<EstadoSubs> {
  if (!(await soloAdmin())) return { error: "Solo administradores." };
  const key = llave();
  if (!key) return { estado: "sin-llave" };

  const admin = createAdminClient();
  const { data: clase } = await admin
    .from("cursos_clases")
    .select("video_url, subtitulos_job")
    .eq("id", claseId)
    .maybeSingle();

  const video = (clase?.video_url as string) || "";
  if (!video) return { estado: "sin-video" };
  // YouTube y Vimeo no se pueden transcribir así: no dan el archivo.
  if (/youtu|vimeo/.test(video)) return { error: "Solo videos propios (.mp4). YouTube ya trae sus propios subtítulos." };

  // Si ya había un trabajo en curso, lo revisamos en vez de pagar otro.
  const previo = (clase?.subtitulos_job as string) || "";
  if (previo) return revisarTrabajo(claseId, previo);

  const r = await fetch(API, {
    method: "POST",
    headers: { authorization: key, "content-type": "application/json" },
    body: JSON.stringify({
      audio_url: video,
      language_code: "es",
      punctuate: true,
      format_text: true,
      word_boost: TERMINOS,
    }),
  });
  if (!r.ok) return { error: `AssemblyAI respondió ${r.status}` };
  const j = await r.json();
  if (!j.id) return { error: "AssemblyAI no devolvió un trabajo." };

  await admin.from("cursos_clases").update({ subtitulos_job: j.id as string }).eq("id", claseId);

  // Damos una espera corta: los videos cortos suelen terminar aquí mismo.
  for (let i = 0; i < 6; i++) {
    await new Promise((res) => setTimeout(res, 5000));
    const estado = await revisarTrabajo(claseId, j.id as string);
    if (!("estado" in estado) || estado.estado !== "procesando") return estado;
  }
  return { estado: "procesando" };
}

// Botón "Actualizar" para cuando el video es largo y no terminó en la primera espera.
export async function revisarSubtitulos(claseId: string): Promise<EstadoSubs> {
  if (!(await soloAdmin())) return { error: "Solo administradores." };
  if (!llave()) return { estado: "sin-llave" };

  const admin = createAdminClient();
  const { data } = await admin
    .from("cursos_clases").select("subtitulos_job, subtitulos_url").eq("id", claseId).maybeSingle();

  const url = (data?.subtitulos_url as string) || "";
  if (url) return { estado: "listo", url };
  const job = (data?.subtitulos_job as string) || "";
  if (!job) return { error: "Esta clase no tiene una transcripción en curso." };
  return revisarTrabajo(claseId, job);
}

// Quitar los subtítulos de una clase.
export async function borrarSubtitulos(claseId: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soloAdmin())) return { error: "Solo administradores." };
  const admin = createAdminClient();
  await admin.storage.from("retos").remove([`subtitulos/${claseId}.vtt`]);
  await admin.from("cursos_clases").update({ subtitulos_url: null, subtitulos_job: null }).eq("id", claseId);
  return { ok: true };
}
