"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificar } from "@/lib/notificaciones-actions";
import { nivelPorXP } from "@/lib/data";

export type ForoPost = {
  id: string;
  autorId: string;
  autorNombre: string;
  autorAvatar: string | null;
  autorNivel: number;
  categoria: string;
  texto: string;
  imagenUrl: string | null;
  videoUrl: string | null;
  enlaceUrl: string | null;
  likes: number;
  meGusta: boolean;
  respuestas: number;
  fecha: string;
  esNuevo: boolean;     // publicado en las últimas 24 h
};

export type ForoRespuesta = { id: string; autorId: string; autorNombre: string; autorAvatar: string | null; texto: string; fecha: string; likes: number; meGusta: boolean };

async function perfilMap(admin: ReturnType<typeof createAdminClient>, ids: string[]) {
  const { data } = await admin.from("profiles").select("id, full_name, avatar_url, xp").in("id", ids.length ? ids : ["_"]);
  return new Map((data || []).map((p) => [p.id as string, p]));
}

export async function getForoPosts(categoria: string, grupoId?: string): Promise<ForoPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  let q = admin.from("foros_posts").select("*").eq("oculto", false).order("created_at", { ascending: false }).limit(50);
  // El muro de un grupo trae solo lo suyo; el foro general excluye lo de grupos.
  q = grupoId ? q.eq("grupo_id", grupoId) : q.is("grupo_id", null);
  if (!grupoId && categoria && categoria !== "General") q = q.eq("categoria", categoria);
  const { data: posts } = await q;
  if (!posts || posts.length === 0) return [];

  const ids = posts.map((p) => p.id as string);
  const autorIds = [...new Set(posts.map((p) => p.autor_id as string))];
  const pMap = await perfilMap(admin, autorIds);
  const { data: likes } = await admin.from("foros_likes").select("post_id, user_id").in("post_id", ids);
  const { data: resp } = await admin.from("foros_respuestas").select("post_id").in("post_id", ids).eq("oculto", false);

  const likeCount = new Map<string, number>(); const misLikes = new Set<string>();
  for (const l of likes || []) { likeCount.set(l.post_id as string, (likeCount.get(l.post_id as string) || 0) + 1); if (user && l.user_id === user.id) misLikes.add(l.post_id as string); }
  const respCount = new Map<string, number>();
  for (const r of resp || []) respCount.set(r.post_id as string, (respCount.get(r.post_id as string) || 0) + 1);

  return posts.map((p) => {
    const per = pMap.get(p.autor_id as string);
    return {
      id: p.id as string,
      autorId: p.autor_id as string,
      autorNombre: (per?.full_name as string) || "Creador",
      autorAvatar: (per?.avatar_url as string) || null,
      autorNivel: nivelPorXP((per?.xp as number) || 0).actual.nivel,
      categoria: p.categoria as string,
      texto: p.texto as string,
      imagenUrl: (p.imagen_url as string) || null,
      videoUrl: (p.video_url as string) || null,
      enlaceUrl: (p.enlace_url as string) || null,
      likes: likeCount.get(p.id as string) || 0,
      meGusta: misLikes.has(p.id as string),
      respuestas: respCount.get(p.id as string) || 0,
      fecha: p.created_at as string,
      esNuevo: Date.now() - new Date(p.created_at as string).getTime() < 864e5,
    };
  });
}

export async function crearPost(categoria: string, texto: string, extra?: { enlaceUrl?: string; imagenUrl?: string; videoUrl?: string; grupoId?: string }): Promise<{ ok: true } | { error: string }> {
  const t = texto.trim();
  if (!t) return { error: "Escribe algo para publicar." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const admin = createAdminClient();
  const { error } = await admin.from("foros_posts").insert({
    autor_id: user.id, categoria: categoria || "General", texto: t, grupo_id: extra?.grupoId || null,
    enlace_url: extra?.enlaceUrl || null, imagen_url: extra?.imagenUrl || null, video_url: extra?.videoUrl || null,
  });
  if (error) return { error: "No se pudo publicar." };
  // +10 XP por publicar.
  const { data: p } = await admin.from("profiles").select("xp").eq("id", user.id).single();
  await admin.from("profiles").update({ xp: (p?.xp ?? 0) + 10 }).eq("id", user.id);
  return { ok: true };
}

export async function toggleLike(postId: string): Promise<{ ok: true; meGusta: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const admin = createAdminClient();
  const { data: ya } = await admin.from("foros_likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  if (ya) { await admin.from("foros_likes").delete().eq("post_id", postId).eq("user_id", user.id); return { ok: true, meGusta: false }; }
  await admin.from("foros_likes").insert({ post_id: postId, user_id: user.id });
  return { ok: true, meGusta: true };
}

export async function getRespuestas(postId: string): Promise<ForoRespuesta[]> {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await admin.from("foros_respuestas").select("id, autor_id, texto, created_at").eq("post_id", postId).eq("oculto", false).order("created_at", { ascending: true });
  if (!data || data.length === 0) return [];
  const pMap = await perfilMap(admin, [...new Set(data.map((r) => r.autor_id as string))]);
  const { data: likes } = await admin
    .from("foros_respuesta_likes")
    .select("respuesta_id, user_id")
    .in("respuesta_id", data.map((r) => r.id as string));
  const conteo = new Map<string, number>();
  const mios = new Set<string>();
  for (const l of likes || []) {
    const rid = l.respuesta_id as string;
    conteo.set(rid, (conteo.get(rid) || 0) + 1);
    if (user && l.user_id === user.id) mios.add(rid);
  }
  return data.map((r) => {
    const p = pMap.get(r.autor_id as string);
    const id = r.id as string;
    return {
      id,
      autorId: r.autor_id as string,
      autorNombre: (p?.full_name as string) || "Creador",
      autorAvatar: (p?.avatar_url as string) || null,
      texto: r.texto as string,
      fecha: r.created_at as string,
      likes: conteo.get(id) || 0,
      meGusta: mios.has(id),
    };
  });
}

export async function crearRespuesta(postId: string, texto: string): Promise<{ ok: true } | { error: string }> {
  const t = texto.trim();
  if (!t) return { error: "Escribe una respuesta." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const admin = createAdminClient();
  const { error } = await admin.from("foros_respuestas").insert({ post_id: postId, autor_id: user.id, texto: t });
  if (error) return { error: "No se pudo responder." };

  const { data: post } = await admin.from("foros_posts").select("autor_id").eq("id", postId).maybeSingle();
  const dueno = post?.autor_id as string | undefined;
  if (dueno && dueno !== user.id) {
    const { data: yo } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    await notificar(dueno, "comentario",
      `${(yo?.full_name as string) || "Alguien"} respondió tu publicación`,
      t.length > 90 ? t.slice(0, 90) + "…" : t, "/app/comunidad");
  }
  return { ok: true };
}

export async function getTopColaboradores(): Promise<{ id: string; nombre: string; avatar: string | null; xp: number }[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, full_name, avatar_url, xp").eq("onboarding_completo", true).eq("email_verificado", true).order("xp", { ascending: false }).order("created_at", { ascending: true }).limit(3);
  return (data || []).map((p) => ({ id: p.id as string, nombre: (p.full_name as string) || "Creador", avatar: (p.avatar_url as string) || null, xp: (p.xp as number) || 0 }));
}

// Like / quitar like a una respuesta del foro.
export async function toggleLikeRespuesta(
  respuestaId: string
): Promise<{ meGusta: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const admin = createAdminClient();

  const { data: ya } = await admin
    .from("foros_respuesta_likes")
    .select("user_id")
    .eq("respuesta_id", respuestaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ya) {
    await admin.from("foros_respuesta_likes").delete()
      .eq("respuesta_id", respuestaId).eq("user_id", user.id);
    return { meGusta: false };
  }

  await admin.from("foros_respuesta_likes").insert({ respuesta_id: respuestaId, user_id: user.id });

  const { data: r } = await admin.from("foros_respuestas").select("autor_id").eq("id", respuestaId).maybeSingle();
  const autor = r?.autor_id as string | undefined;
  if (autor && autor !== user.id) {
    const { data: yo } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    await notificar(autor, "like",
      `A ${(yo?.full_name as string) || "alguien"} le gustó tu respuesta`, "", "/app/comunidad");
  }
  return { meGusta: true };
}
