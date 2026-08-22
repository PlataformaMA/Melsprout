"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarRacha } from "@/lib/racha-actions";
import { NIVELES_XP as NIVELES } from "@/lib/data";

function nivelDeXp(xp: number): number {
  let n = 1;
  for (const lv of NIVELES) if (xp >= lv.xp) n = lv.nivel;
  return n;
}

export type RecursoReto = { titulo: string; tipo?: string; url: string };
export type RetoComunidad = {
  id: string; titulo: string; descripcion: string; info: string;
  dias: number; xp_dia: number; xp_bonus: number; emoji: string;
  inscritos: number; miInscrito: boolean; misDias: number;
  portada: string | null;
  iniciaAt: string | null;      // null = disponible desde ya
  disponible: boolean;          // ya arrancó (o no tiene fecha)
  recursos: RecursoReto[];
};
export type PostReto = {
  id: string; dia: number; texto: string; media_url: string | null; created_at: string;
  autorNombre: string; autorAvatar: string | null; autorNivel: number; likes: number; yoDiLike: boolean;
};
// OJO: xp aquí es el XP ganado EN ESTE RETO (días publicados × xp_dia, más el
// bonus si lo completó), no el XP global del perfil.
export type Participante = { id: string; nombre: string; avatar: string | null; xp: number; nivel: number; dias: number };
export type RetoComunidadDetalle = RetoComunidad & { publicaciones: PostReto[]; participantes: Participante[] };

async function miId(): Promise<string | null> {
  const s = await createClient();
  const { data } = await s.auth.getUser();
  return data.user?.id ?? null;
}

// Mapea una fila de reto + agregados a RetoComunidad.
function mapReto(r: Record<string, unknown>, inscritos: number, miInscrito: boolean, misDias: number): RetoComunidad {
  return {
    id: r.id as string, titulo: r.titulo as string, descripcion: (r.descripcion as string) || "",
    info: (r.info as string) || "", dias: r.dias as number, xp_dia: r.xp_dia as number,
    xp_bonus: r.xp_bonus as number, emoji: (r.emoji as string) || "💡",
    inscritos, miInscrito, misDias,
    portada: (r.portada as string) || null,
    iniciaAt: (r.inicia_at as string) || null,
    // Sin fecha se considera disponible; con fecha futura, "Próximamente".
    disponible: !r.inicia_at || new Date(r.inicia_at as string).getTime() <= Date.now(),
    recursos: Array.isArray(r.recursos) ? (r.recursos as RecursoReto[]) : [],
  };
}

export async function listarRetosComunidad(): Promise<RetoComunidad[]> {
  const admin = createAdminClient();
  const me = await miId();
  const [{ data: retos }, { data: ins }, { data: posts }] = await Promise.all([
    admin.from("comunidad_retos").select("*").eq("activo", true).order("orden", { ascending: true }),
    admin.from("comunidad_reto_inscritos").select("reto_id, user_id"),
    admin.from("comunidad_reto_posts").select("reto_id, user_id, dia"),
  ]);
  return (retos || []).map((r) => {
    const insR = (ins || []).filter((i) => i.reto_id === r.id);
    const misDias = new Set((posts || []).filter((p) => p.reto_id === r.id && p.user_id === me).map((p) => p.dia)).size;
    return mapReto(r, insR.length, insR.some((i) => i.user_id === me), misDias);
  });
}

export async function getRetoComunidad(id: string): Promise<RetoComunidadDetalle | null> {
  const admin = createAdminClient();
  const me = await miId();
  const { data: r } = await admin.from("comunidad_retos").select("*").eq("id", id).maybeSingle();
  if (!r) return null;

  const [{ data: ins }, { data: posts }, { data: likes }] = await Promise.all([
    admin.from("comunidad_reto_inscritos").select("user_id").eq("reto_id", id),
    admin.from("comunidad_reto_posts").select("id, user_id, dia, texto, media_url, created_at").eq("reto_id", id).order("created_at", { ascending: false }),
    admin.from("comunidad_reto_likes").select("post_id, user_id"),
  ]);

  // Perfiles de inscritos + autores de posts
  const ids = new Set<string>();
  (ins || []).forEach((i) => ids.add(i.user_id as string));
  (posts || []).forEach((p) => ids.add(p.user_id as string));
  const { data: perfiles } = await admin.from("profiles").select("id, full_name, avatar_url, xp").in("id", [...ids]);
  const pMap = new Map((perfiles || []).map((p) => [p.id as string, p]));

  const publicaciones: PostReto[] = (posts || []).map((p) => {
    const pr = pMap.get(p.user_id as string);
    const xp = (pr?.xp as number) ?? 0;
    const ls = (likes || []).filter((l) => l.post_id === p.id);
    return {
      id: p.id as string, dia: p.dia as number, texto: (p.texto as string) || "", media_url: (p.media_url as string) ?? null,
      created_at: p.created_at as string,
      autorNombre: (pr?.full_name as string) || "Creador", autorAvatar: (pr?.avatar_url as string) ?? null, autorNivel: nivelDeXp(xp),
      likes: ls.length, yoDiLike: ls.some((l) => l.user_id === me),
    };
  });

  const totalDias = (r.dias as number) || 0;
  const xpDia = (r.xp_dia as number) || 0;
  const xpBonus = (r.xp_bonus as number) || 0;
  const participantes: Participante[] = (ins || [])
    .map((i) => {
      const uid = i.user_id as string;
      const pr = pMap.get(uid);
      // Días distintos publicados por esa persona dentro de este reto.
      const dias = new Set((posts || []).filter((p) => p.user_id === uid).map((p) => p.dia)).size;
      const xp = dias * xpDia + (totalDias > 0 && dias >= totalDias ? xpBonus : 0);
      return {
        id: uid,
        nombre: (pr?.full_name as string) || "Creador",
        avatar: (pr?.avatar_url as string) ?? null,
        xp, dias,
        nivel: nivelDeXp((pr?.xp as number) ?? 0),
      };
    })
    // Manda quien más días lleva; a igualdad de días, quien más XP juntó.
    .sort((a, b) => b.dias - a.dias || b.xp - a.xp);

  const misDias = new Set((posts || []).filter((p) => p.user_id === me).map((p) => p.dia)).size;
  const base = mapReto(r, (ins || []).length, (ins || []).some((i) => i.user_id === me), misDias);
  return { ...base, publicaciones, participantes };
}

export async function inscribirseReto(retoId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };
  const { error } = await supabase.from("comunidad_reto_inscritos").upsert({ reto_id: retoId, user_id: user.id });
  if (error) return { error: "No se pudo inscribir." };
  return { ok: true };
}

// Publica el día que toca (el siguiente al último publicado). Da XP y cuenta racha.
export async function publicarDiaReto(
  retoId: string, texto: string, mediaUrl: string | null
): Promise<{ ok: true; dia: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };
  if (!texto.trim() && !mediaUrl) return { error: "Escribe algo o sube un archivo." };

  const admin = createAdminClient();
  const { data: reto } = await admin.from("comunidad_retos").select("dias, xp_dia").eq("id", retoId).maybeSingle();
  if (!reto) return { error: "Reto no encontrado." };

  // Asegura inscripción
  await supabase.from("comunidad_reto_inscritos").upsert({ reto_id: retoId, user_id: user.id });

  const { data: mios } = await admin.from("comunidad_reto_posts").select("dia").eq("reto_id", retoId).eq("user_id", user.id);
  const hechos = mios?.length ?? 0;
  if (hechos >= (reto.dias as number)) return { error: "¡Ya completaste todos los días de este reto! 🎉" };
  const dia = hechos + 1;

  const { error } = await supabase.from("comunidad_reto_posts").insert({ reto_id: retoId, user_id: user.id, dia, texto, media_url: mediaUrl });
  if (error) return { error: "No se pudo publicar (¿ya publicaste hoy?)." };

  // +XP del día
  const { data: p } = await admin.from("profiles").select("xp").eq("id", user.id).single();
  await admin.from("profiles").update({ xp: (p?.xp ?? 0) + (reto.xp_dia as number) }).eq("id", user.id);
  await registrarRacha();
  return { ok: true, dia };
}

export async function toggleLikeReto(postId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };
  const { data: existe } = await supabase.from("comunidad_reto_likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  if (existe) await supabase.from("comunidad_reto_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  else await supabase.from("comunidad_reto_likes").insert({ post_id: postId, user_id: user.id });
  return { ok: true };
}
