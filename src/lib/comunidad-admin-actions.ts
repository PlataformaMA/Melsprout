"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

export type PublicacionAdmin = {
  id: string;
  autorId: string;
  autor: string;
  avatar: string | null;
  titulo: string | null;
  texto: string;
  categoria: string;
  grupo: string | null;
  esReto: boolean;
  likes: number;
  respuestas: number;
  fecha: string;
  visible: boolean;
};

export type GrupoAdmin = {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  estado: string;
  publico: boolean;
  apoyos: number;
  meta: number;
  miembros: number;
  publicaciones: number;
  creador: string;
  fecha: string;
};

export type ComentarioReto = {
  id: string;
  autor: string;
  texto: string;
  fecha: string;
  visible: boolean;
};

async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

// Todo lo que hay hoy en la comunidad, tal como lo ven las alumnas.
export async function getComunidadAdmin(): Promise<{
  publicaciones: PublicacionAdmin[];
  grupos: GrupoAdmin[];
  comentariosReto: ComentarioReto[];
  totales: { publicaciones: number; grupos: number; retos: number; respuestas: number };
}> {
  const vacio = {
    publicaciones: [], grupos: [], comentariosReto: [],
    totales: { publicaciones: 0, grupos: 0, retos: 0, respuestas: 0 },
  };
  if (!(await soyAdmin())) return vacio;
  const admin = createAdminClient();

  const [
    { data: posts }, { data: likes }, { data: resp },
    { data: grupos }, { data: miembros }, { data: apoyos },
    { data: coments }, { data: retosCom },
  ] = await Promise.all([
    admin.from("foros_posts").select("*").order("created_at", { ascending: false }).limit(300),
    admin.from("foros_likes").select("post_id"),
    admin.from("foros_respuestas").select("post_id, id"),
    admin.from("grupos").select("*").order("created_at", { ascending: false }),
    admin.from("grupo_miembros").select("grupo_id"),
    admin.from("grupo_apoyos").select("grupo_id"),
    admin.from("comentarios").select("id, autor_id, texto, oculto, created_at")
      .order("created_at", { ascending: false }).limit(200),
    admin.from("comunidad_retos").select("id"),
  ]);

  const ids = [
    ...new Set([
      ...(posts || []).map((p) => p.autor_id as string),
      ...(grupos || []).map((g) => g.creador_id as string),
      ...(coments || []).map((c) => c.autor_id as string),
    ]),
  ].filter(Boolean);
  const { data: perfiles } = await admin.from("profiles")
    .select("id, full_name, avatar_url").in("id", ids.length ? ids : ["_"]);
  const pm = new Map((perfiles || []).map((p) => [p.id as string, p]));
  const nombre = (id: string) => (pm.get(id)?.full_name as string) || "Creador";

  const cuenta = (filas: { [k: string]: unknown }[] | null, campo: string) => {
    const m = new Map<string, number>();
    for (const f of filas || []) {
      const k = f[campo] as string;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  };
  const likesPor = cuenta(likes, "post_id");
  const respPor = cuenta(resp, "post_id");
  const miembrosPor = cuenta(miembros, "grupo_id");
  const apoyosPor = cuenta(apoyos, "grupo_id");
  const postsPorGrupo = cuenta(posts, "grupo_id");
  const nombreGrupo = new Map((grupos || []).map((g) => [g.id as string, g.nombre as string]));

  return {
    publicaciones: (posts || []).map((p) => ({
      id: p.id as string,
      autorId: p.autor_id as string,
      autor: nombre(p.autor_id as string),
      avatar: (pm.get(p.autor_id as string)?.avatar_url as string) || null,
      titulo: (p.titulo as string) || null,
      texto: p.texto as string,
      categoria: (p.categoria as string) || "General",
      grupo: p.grupo_id ? nombreGrupo.get(p.grupo_id as string) || "Grupo" : null,
      esReto: !!p.reto_id,
      likes: likesPor.get(p.id as string) || 0,
      respuestas: respPor.get(p.id as string) || 0,
      fecha: p.created_at as string,
      visible: p.oculto !== true,
    })),
    grupos: (grupos || []).map((g) => ({
      id: g.id as string,
      nombre: g.nombre as string,
      descripcion: (g.descripcion as string) || "",
      emoji: (g.emoji as string) || "👥",
      estado: (g.estado as string) || "propuesto",
      publico: g.publico !== false,
      apoyos: apoyosPor.get(g.id as string) || 0,
      meta: (g.meta_apoyos as number) || 10,
      miembros: miembrosPor.get(g.id as string) || 0,
      publicaciones: postsPorGrupo.get(g.id as string) || 0,
      creador: nombre(g.creador_id as string),
      fecha: g.created_at as string,
    })),
    comentariosReto: (coments || []).map((c) => ({
      id: c.id as string,
      autor: nombre(c.autor_id as string),
      texto: c.texto as string,
      fecha: c.created_at as string,
      visible: c.oculto !== true,
    })),
    totales: {
      publicaciones: (posts || []).length,
      grupos: (grupos || []).length,
      retos: (retosCom || []).length,
      respuestas: (resp || []).length,
    },
  };
}

// Mostrar u ocultar una publicación, respuesta o comentario.
export async function alternarVisible(
  tipo: "post" | "comentario", id: string, visible: boolean
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const tabla = tipo === "post" ? "foros_posts" : "comentarios";
  const patch: Record<string, unknown> = { oculto: !visible };
  if (tipo === "post") patch.estado = visible ? "aprobado" : "oculto";
  const { error } = await admin.from(tabla).update(patch).eq("id", id);
  if (error) return { error: "No se pudo cambiar." };
  return { ok: true };
}

// Activar un grupo propuesto sin esperar a que junte los apoyos.
export async function activarGrupo(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { data: apoyos } = await admin.from("grupo_apoyos").select("user_id").eq("grupo_id", id);
  const { data: g } = await admin.from("grupos").select("creador_id").eq("id", id).maybeSingle();

  const { error } = await admin.from("grupos")
    .update({ estado: "activo", activado_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "No se pudo activar." };

  // Quienes lo apoyaron pasan a ser sus miembros.
  if (apoyos?.length) {
    await admin.from("grupo_miembros").upsert(
      apoyos.map((a) => ({
        grupo_id: id,
        user_id: a.user_id as string,
        rol: a.user_id === g?.creador_id ? "admin" : "miembro",
      })),
      { onConflict: "grupo_id,user_id" },
    );
  }
  return { ok: true };
}

export async function borrarGrupoAdmin(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("grupos").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar." };
  return { ok: true };
}
