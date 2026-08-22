"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificar } from "@/lib/notificaciones-actions";
import { nivelPorXP } from "@/lib/data";

export type Grupo = {
  id: string;
  nombre: string;
  descripcion: string;
  portada: string | null;
  emoji: string;
  estado: "propuesto" | "activo";
  publico: boolean;
  creadoEn: string;
  // Propuesta
  apoyos: number;
  meta: number;
  yoApoye: boolean;
  proponente: { id: string; nombre: string; avatar: string | null; nivel: number } | null;
  // Grupo activo
  miembros: number;
  soyMiembro: boolean;
};

// Meta de apoyos para que una propuesta se convierta en grupo. Con la comunidad
// pequeña, 50 era inalcanzable; se sube cuando haya más gente.
export const META_APOYOS = 10;

async function yo(): Promise<string | null> {
  const s = await createClient();
  const { data } = await s.auth.getUser();
  return data.user?.id ?? null;
}

function mapGrupo(
  g: Record<string, unknown>,
  apoyos: number, yoApoye: boolean,
  miembros: number, soyMiembro: boolean,
  proponente: Grupo["proponente"],
): Grupo {
  return {
    id: g.id as string,
    nombre: g.nombre as string,
    descripcion: (g.descripcion as string) || "",
    portada: (g.portada as string) || null,
    emoji: (g.emoji as string) || "👥",
    estado: (g.estado as Grupo["estado"]) || "propuesto",
    publico: g.publico !== false,
    creadoEn: g.created_at as string,
    apoyos, meta: (g.meta_apoyos as number) || 50, yoApoye,
    miembros, soyMiembro, proponente,
  };
}

// Todo lo que necesita la pestaña Grupos, en una sola pasada.
export async function listarGrupos(): Promise<{
  propuestas: Grupo[]; mios: Grupo[]; otros: Grupo[];
}> {
  const admin = createAdminClient();
  const me = await yo();

  const [{ data: grupos }, { data: apoyos }, { data: miembros }] = await Promise.all([
    admin.from("grupos").select("*").order("created_at", { ascending: false }),
    admin.from("grupo_apoyos").select("grupo_id, user_id"),
    admin.from("grupo_miembros").select("grupo_id, user_id"),
  ]);
  if (!grupos?.length) return { propuestas: [], mios: [], otros: [] };

  const ids = [...new Set(grupos.map((g) => g.creador_id as string))];
  const { data: perfiles } = await admin
    .from("profiles").select("id, full_name, avatar_url, xp").in("id", ids.length ? ids : ["_"]);
  const pMap = new Map((perfiles || []).map((p) => [p.id as string, p]));

  const armados = grupos.map((g) => {
    const ap = (apoyos || []).filter((a) => a.grupo_id === g.id);
    const mi = (miembros || []).filter((m) => m.grupo_id === g.id);
    const p = pMap.get(g.creador_id as string);
    return mapGrupo(
      g, ap.length, !!me && ap.some((a) => a.user_id === me),
      mi.length, !!me && mi.some((m) => m.user_id === me),
      p ? {
        id: p.id as string,
        nombre: (p.full_name as string) || "Creador",
        avatar: (p.avatar_url as string) || null,
        nivel: nivelPorXP((p.xp as number) || 0).actual.nivel,
      } : null,
    );
  });

  return {
    propuestas: armados.filter((g) => g.estado === "propuesto"),
    mios: armados.filter((g) => g.estado === "activo" && g.soyMiembro),
    otros: armados.filter((g) => g.estado === "activo" && !g.soyMiembro),
  };
}

export async function getGrupo(id: string): Promise<Grupo | null> {
  const admin = createAdminClient();
  const me = await yo();
  const { data: g } = await admin.from("grupos").select("*").eq("id", id).maybeSingle();
  if (!g) return null;

  const [{ data: ap }, { data: mi }, { data: p }] = await Promise.all([
    admin.from("grupo_apoyos").select("user_id").eq("grupo_id", id),
    admin.from("grupo_miembros").select("user_id").eq("grupo_id", id),
    admin.from("profiles").select("id, full_name, avatar_url, xp").eq("id", g.creador_id).maybeSingle(),
  ]);

  return mapGrupo(
    g, (ap || []).length, !!me && (ap || []).some((a) => a.user_id === me),
    (mi || []).length, !!me && (mi || []).some((m) => m.user_id === me),
    p ? {
      id: p.id as string,
      nombre: (p.full_name as string) || "Creador",
      avatar: (p.avatar_url as string) || null,
      nivel: nivelPorXP((p.xp as number) || 0).actual.nivel,
    } : null,
  );
}

export async function proponerGrupo(datos: {
  nombre: string; descripcion: string; portada?: string; emoji?: string;
}): Promise<{ ok: true; id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const nombre = datos.nombre.trim().slice(0, 60);
  const descripcion = datos.descripcion.trim().slice(0, 250);
  if (nombre.length < 3) return { error: "Ponle un nombre al grupo (mínimo 3 letras)." };
  if (descripcion.length < 10) return { error: "Cuéntanos de qué trata el grupo." };

  const admin = createAdminClient();
  const { data: ya } = await admin.from("grupos").select("id").ilike("nombre", nombre).maybeSingle();
  if (ya) return { error: "Ya existe un grupo con ese nombre." };

  const { data: creado, error } = await admin.from("grupos")
    .insert({
      nombre, descripcion, creador_id: user.id, meta_apoyos: META_APOYOS,
      portada: datos.portada || null, emoji: datos.emoji || "👥",
    })
    .select("id").single();
  if (error || !creado) return { error: "No se pudo crear la propuesta." };

  // Quien propone, apoya: su grupo arranca con 1.
  await admin.from("grupo_apoyos").insert({ grupo_id: creado.id, user_id: user.id });
  return { ok: true, id: creado.id as string };
}

// Apoyar o quitar el apoyo. Al llegar a la meta, el grupo se activa solo.
export async function apoyarGrupo(
  grupoId: string
): Promise<{ ok: true; apoyos: number; yoApoye: boolean; activado: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const admin = createAdminClient();
  const { data: g } = await admin.from("grupos").select("id, nombre, estado, meta_apoyos, creador_id").eq("id", grupoId).maybeSingle();
  if (!g) return { error: "Ese grupo ya no existe." };
  if (g.estado === "activo") return { error: "Este grupo ya está activo." };

  const { data: mio } = await admin.from("grupo_apoyos")
    .select("user_id").eq("grupo_id", grupoId).eq("user_id", user.id).maybeSingle();

  if (mio) {
    await admin.from("grupo_apoyos").delete().eq("grupo_id", grupoId).eq("user_id", user.id);
  } else {
    await admin.from("grupo_apoyos").insert({ grupo_id: grupoId, user_id: user.id });
  }

  const { data: todos } = await admin.from("grupo_apoyos").select("user_id").eq("grupo_id", grupoId);
  const apoyos = (todos || []).length;
  const meta = (g.meta_apoyos as number) || 50;
  let activado = false;

  if (!mio && apoyos >= meta) {
    // Meta alcanzada: el grupo nace y quienes lo apoyaron son sus miembros.
    await admin.from("grupos").update({ estado: "activo", activado_at: new Date().toISOString() }).eq("id", grupoId);
    await admin.from("grupo_miembros").upsert(
      (todos || []).map((t) => ({
        grupo_id: grupoId,
        user_id: t.user_id as string,
        rol: t.user_id === g.creador_id ? "admin" : "miembro",
      })),
      { onConflict: "grupo_id,user_id" },
    );
    for (const t of todos || []) {
      await notificar(t.user_id as string, "general",
        `¡El grupo «${g.nombre}» ya existe!`,
        "Alcanzó los apoyos necesarios y ya eres miembro.", `/app/comunidad/grupo/${grupoId}`);
    }
    activado = true;
  }

  return { ok: true, apoyos, yoApoye: !mio, activado };
}

// Entrar o salir de un grupo activo y público.
export async function alternarMembresia(
  grupoId: string
): Promise<{ ok: true; soyMiembro: boolean; miembros: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const admin = createAdminClient();
  const { data: g } = await admin.from("grupos").select("id, estado, publico").eq("id", grupoId).maybeSingle();
  if (!g || g.estado !== "activo") return { error: "Ese grupo todavía no está activo." };
  if (!g.publico) return { error: "Este grupo es privado." };

  const { data: mio } = await admin.from("grupo_miembros")
    .select("user_id").eq("grupo_id", grupoId).eq("user_id", user.id).maybeSingle();

  if (mio) await admin.from("grupo_miembros").delete().eq("grupo_id", grupoId).eq("user_id", user.id);
  else await admin.from("grupo_miembros").insert({ grupo_id: grupoId, user_id: user.id });

  const { count } = await admin.from("grupo_miembros")
    .select("user_id", { count: "exact", head: true }).eq("grupo_id", grupoId);

  return { ok: true, soyMiembro: !mio, miembros: count ?? 0 };
}
