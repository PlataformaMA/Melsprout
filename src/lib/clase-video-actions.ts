"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

// Video de una clase (para el reproductor).
export async function getVideoClase(claseId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("clase_videos").select("video_url").eq("clase_id", claseId).maybeSingle();
  return (data?.video_url as string) || null;
}

// Todos los videos (para el panel admin).
export async function getVideosClases(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return {};
  const admin = createAdminClient();
  const { data } = await admin.from("clase_videos").select("clase_id, video_url");
  const out: Record<string, string> = {};
  for (const r of data || []) if (r.video_url) out[r.clase_id as string] = r.video_url as string;
  return out;
}

// Guarda/actualiza el video de una clase (admin).
export async function setVideoClase(claseId: string, videoUrl: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("clase_videos").upsert({
    clase_id: claseId,
    video_url: videoUrl || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "No se pudo guardar el video." };
  return { ok: true };
}
