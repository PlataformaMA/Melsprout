"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCursos } from "@/lib/cursos-db";
import { getRetoUnificado } from "@/lib/retos-db";

// Actividad de TUS amigos, con datos reales: retos publicados, clases
// completadas y rachas. Nada inventado: si no hay movimiento, la lista va vacía.
export type ActividadAmigo = {
  id: string;
  userId: string;
  nombre: string;
  avatar: string | null;
  texto: string;
  icono: string;         // el emoji grande de la derecha
  valor: string | null;  // el número grande (30 días, +100 XP…)
  hace: string;
};

export type PersonaLista = {
  id: string;
  nombre: string;
  avatar: string | null;
};

function hace(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return min < 1 ? "Ahora" : `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Hace 1 día" : `Hace ${d} días`;
}

// Ids de mis amigos = solicitudes aceptadas en cualquier dirección.
async function idsAmigos(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const [{ data: sigo }, { data: meSiguen }] = await Promise.all([
    admin.from("seguidores").select("seguido_id").eq("seguidor_id", userId).eq("estado", "aceptado"),
    admin.from("seguidores").select("seguidor_id").eq("seguido_id", userId).eq("estado", "aceptado"),
  ]);
  const ids = new Set<string>();
  for (const r of sigo || []) ids.add(r.seguido_id as string);
  for (const r of meSiguen || []) ids.add(r.seguidor_id as string);
  return [...ids];
}

export async function getActividadAmigos(): Promise<ActividadAmigo[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const ids = await idsAmigos(user.id);
  if (ids.length === 0) return [];

  const admin = createAdminClient();
  const [{ data: perfiles }, { data: subs }, { data: clases }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url, racha, racha_fecha").in("id", ids),
    admin.from("reto_submissions").select("user_id, reto_id, updated_at, revision")
      .in("user_id", ids).eq("estado", "publicado").order("updated_at", { ascending: false }).limit(12),
    admin.from("clase_progreso").select("user_id, clase_id, completada_at")
      .in("user_id", ids).eq("completada", true).not("completada_at", "is", null)
      .order("completada_at", { ascending: false }).limit(12),
  ]);

  const pMap = new Map((perfiles || []).map((p) => [p.id as string, p]));
  const quien = (uid: string) => ({
    nombre: (pMap.get(uid)?.full_name as string) || "Creador",
    avatar: (pMap.get(uid)?.avatar_url as string) || null,
  });

  const items: (ActividadAmigo & { ts: number })[] = [];

  // Retos publicados (los rechazados no cuentan como logro).
  const retoCache = new Map<string, { titulo: string; xp: number }>();
  for (const s of subs || []) {
    if (s.revision === "rechazado") continue;
    const rid = s.reto_id as string;
    if (!retoCache.has(rid)) {
      const r = await getRetoUnificado(rid);
      retoCache.set(rid, { titulo: r?.titulo || rid, xp: r?.xp || 50 });
    }
    const info = retoCache.get(rid)!;
    const uid = s.user_id as string;
    items.push({
      id: `r-${uid}-${rid}`, userId: uid, ...quien(uid),
      texto: `¡Completó el reto «${info.titulo}»!`,
      icono: "💎", valor: `+${info.xp}`,
      hace: hace(s.updated_at as string), ts: new Date(s.updated_at as string).getTime(),
    });
  }

  // Clases completadas: si con esa clase cerró un módulo, se anuncia el mundo.
  if ((clases || []).length) {
    const cursos = await getCursos();
    const tituloDe = new Map<string, string>();
    const moduloDe = new Map<string, { n: number; ultima: string }>();
    cursos.forEach((m, i) => {
      m.clases.forEach((c) => tituloDe.set(c.id, c.titulo));
      const ultima = m.clases[m.clases.length - 1];
      if (ultima) moduloDe.set(ultima.id, { n: i + 1, ultima: ultima.id });
    });
    for (const c of clases || []) {
      const uid = c.user_id as string;
      const cid = c.clase_id as string;
      const cierra = moduloDe.get(cid);
      items.push({
        id: `c-${uid}-${cid}`, userId: uid, ...quien(uid),
        texto: cierra ? `¡Completó el mundo ${cierra.n}!` : `¡Completó la clase «${tituloDe.get(cid) || cid}»!`,
        icono: cierra ? "🌊" : "📖", valor: null,
        hace: hace(c.completada_at as string), ts: new Date(c.completada_at as string).getTime(),
      });
    }
  }

  // Rachas vivas (a partir de 3 días para que no sea ruido).
  for (const p of perfiles || []) {
    const racha = (p.racha as number) || 0;
    const fecha = p.racha_fecha as string | null;
    if (racha < 3 || !fecha) continue;
    const ts = new Date(`${fecha}T12:00:00`).getTime();
    if (Number.isNaN(ts)) continue;
    const uid = p.id as string;
    items.push({
      id: `f-${uid}-${racha}`, userId: uid, ...quien(uid),
      texto: `¡Alcanzó una racha de ${racha} días!`,
      icono: "🔥", valor: `${racha}`,
      hace: hace(new Date(ts).toISOString()), ts,
    });
  }

  items.sort((a, b) => b.ts - a.ts);
  return items.slice(0, 8).map(({ ...a }) => a);
}

// Quiénes me siguen / a quiénes sigo (solo aceptados), para la columna derecha.
export async function getSeguidoresYSeguidos(): Promise<{ seguidores: PersonaLista[]; seguidos: PersonaLista[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { seguidores: [], seguidos: [] };

  const admin = createAdminClient();
  const [{ data: meSiguen }, { data: sigo }] = await Promise.all([
    admin.from("seguidores").select("seguidor_id").eq("seguido_id", user.id).eq("estado", "aceptado"),
    admin.from("seguidores").select("seguido_id").eq("seguidor_id", user.id).eq("estado", "aceptado"),
  ]);

  const idsA = (meSiguen || []).map((r) => r.seguidor_id as string);
  const idsB = (sigo || []).map((r) => r.seguido_id as string);
  const todos = [...new Set([...idsA, ...idsB])];
  if (todos.length === 0) return { seguidores: [], seguidos: [] };

  const { data: perfiles } = await admin
    .from("profiles").select("id, full_name, avatar_url").in("id", todos);
  const pMap = new Map((perfiles || []).map((p) => [p.id as string, p]));
  const arma = (ids: string[]): PersonaLista[] =>
    ids.map((id) => ({
      id,
      nombre: (pMap.get(id)?.full_name as string) || "Creador",
      avatar: (pMap.get(id)?.avatar_url as string) || null,
    }));

  return { seguidores: arma(idsA), seguidos: arma(idsB) };
}
