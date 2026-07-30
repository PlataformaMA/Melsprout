"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRetoUnificado } from "@/lib/retos-db";

export type Post = {
  userId: string;
  retoId: string;
  nombre: string;
  avatar: string | null;
  retoTitulo: string;
  retoEmoji: string;
  respuestas: Record<string, string>;
  archivoUrl: string | null;
  fecha: string;
  numComentarios: number;
};

export type Comentario = {
  id: string;
  autorNombre: string;
  autorAvatar: string | null;
  texto: string;
  fecha: string;
};

// Feed público: retos publicados (no rechazados), con autor y # de comentarios.
export async function getFeed(): Promise<Post[]> {
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("reto_submissions")
    .select("user_id, reto_id, respuestas, archivo_url, updated_at, revision")
    .eq("estado", "publicado")
    .neq("revision", "rechazado")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (!subs || subs.length === 0) return [];

  const ids = [...new Set(subs.map((s) => s.user_id as string))];
  const { data: perfiles } = await admin.from("profiles").select("id, full_name, avatar_url").in("id", ids);
  const perfilMap = new Map((perfiles || []).map((p) => [p.id as string, p]));

  const { data: coments } = await admin.from("comentarios").select("reto_user_id, reto_id").eq("oculto", false);
  const countMap = new Map<string, number>();
  for (const c of coments || []) {
    const k = `${c.reto_user_id}|${c.reto_id}`;
    countMap.set(k, (countMap.get(k) || 0) + 1);
  }

  const retoCache = new Map<string, { titulo: string; emoji: string }>();
  const out: Post[] = [];
  for (const s of subs) {
    const rid = s.reto_id as string;
    if (!retoCache.has(rid)) {
      const r = await getRetoUnificado(rid);
      retoCache.set(rid, { titulo: r?.titulo || rid, emoji: r?.emoji || "🎯" });
    }
    const info = retoCache.get(rid)!;
    const p = perfilMap.get(s.user_id as string);
    out.push({
      userId: s.user_id as string,
      retoId: rid,
      nombre: (p?.full_name as string) || "Creador",
      avatar: (p?.avatar_url as string) || null,
      retoTitulo: info.titulo,
      retoEmoji: info.emoji,
      respuestas: (s.respuestas as Record<string, string>) || {},
      archivoUrl: (s.archivo_url as string) || null,
      fecha: s.updated_at as string,
      numComentarios: countMap.get(`${s.user_id}|${rid}`) || 0,
    });
  }
  return out;
}

export async function getComentarios(retoUserId: string, retoId: string): Promise<Comentario[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("comentarios")
    .select("id, autor_id, texto, created_at")
    .eq("reto_user_id", retoUserId)
    .eq("reto_id", retoId)
    .eq("oculto", false)
    .order("created_at", { ascending: true });
  if (!data || data.length === 0) return [];
  const autorIds = [...new Set(data.map((c) => c.autor_id as string))];
  const { data: perfiles } = await admin.from("profiles").select("id, full_name, avatar_url").in("id", autorIds);
  const pMap = new Map((perfiles || []).map((p) => [p.id as string, p]));
  return data.map((c) => {
    const p = pMap.get(c.autor_id as string);
    return {
      id: c.id as string,
      autorNombre: (p?.full_name as string) || "Creador",
      autorAvatar: (p?.avatar_url as string) || null,
      texto: c.texto as string,
      fecha: c.created_at as string,
    };
  });
}

export async function crearComentario(
  retoUserId: string,
  retoId: string,
  texto: string
): Promise<{ ok: true } | { error: string }> {
  const t = texto.trim();
  if (!t) return { error: "Escribe un comentario." };
  if (t.length > 500) return { error: "Máximo 500 caracteres." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const admin = createAdminClient();
  const { error } = await admin.from("comentarios").insert({
    reto_user_id: retoUserId,
    reto_id: retoId,
    autor_id: user.id,
    texto: t,
  });
  if (error) return { error: "No se pudo publicar el comentario." };
  return { ok: true };
}

// ————— Actividad reciente (datos REALES: retos completados + nuevos miembros) —————
export type Actividad = {
  id: string;
  nombre: string;
  avatar: string | null;
  texto: string;   // "completó el reto «X»" | "se unió a Melsprout"
  xp?: number;
  hace: string;
};

function haceCorto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d}d`;
}

export async function getActividadReciente(): Promise<Actividad[]> {
  const admin = createAdminClient();
  const items: (Actividad & { ts: number })[] = [];

  const { data: subs } = await admin
    .from("reto_submissions")
    .select("user_id, reto_id, updated_at, revision")
    .eq("estado", "publicado")
    .order("updated_at", { ascending: false })
    .limit(10);
  const uids = [...new Set((subs || []).filter((s) => s.revision !== "rechazado").map((s) => s.user_id as string))];

  const { data: nuevos } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, created_at")
    .eq("onboarding_completo", true)
    .order("created_at", { ascending: false })
    .limit(5);
  const nuevosIds = (nuevos || []).map((n) => n.id as string);

  const { data: perfiles } = await admin.from("profiles").select("id, full_name, avatar_url").in("id", [...uids, ...nuevosIds].length ? [...uids, ...nuevosIds] : ["_"]);
  const pMap = new Map((perfiles || []).map((p) => [p.id as string, p]));

  const retoCache = new Map<string, { titulo: string; xp: number }>();
  for (const s of subs || []) {
    if (s.revision === "rechazado") continue;
    const rid = s.reto_id as string;
    if (!retoCache.has(rid)) {
      const r = await getRetoUnificado(rid);
      retoCache.set(rid, { titulo: r?.titulo || rid, xp: r?.xp || 50 });
    }
    const info = retoCache.get(rid)!;
    const p = pMap.get(s.user_id as string);
    const ts = new Date(s.updated_at as string).getTime();
    items.push({ id: `r-${s.user_id}-${rid}`, nombre: (p?.full_name as string) || "Creador", avatar: (p?.avatar_url as string) || null, texto: `completó el reto «${info.titulo}»`, xp: info.xp, hace: haceCorto(s.updated_at as string), ts });
  }
  for (const n of nuevos || []) {
    const ts = new Date(n.created_at as string).getTime();
    items.push({ id: `n-${n.id}`, nombre: (n.full_name as string) || "Creador", avatar: (n.avatar_url as string) || null, texto: "se unió a Melsprout", hace: haceCorto(n.created_at as string), ts });
  }

  items.sort((a, b) => b.ts - a.ts);
  return items.slice(0, 6).map((a) => ({ id: a.id, nombre: a.nombre, avatar: a.avatar, texto: a.texto, xp: a.xp, hace: a.hace }));
}
