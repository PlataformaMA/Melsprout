"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificar } from "@/lib/notificaciones-actions";
import { espejarRetoEnComunidad, ocultarRetoEnComunidad } from "@/lib/reto-publicacion";
import { esAdmin, esAdminUsuario } from "@/lib/admin";
import { getRetoUnificado, type RetoRow, type RetoTipo } from "@/lib/retos-db";

// Verifica que quien llama sea admin. Devuelve el admin client o null.
async function comoAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return null;
  return createAdminClient();
}

export type RetoInput = {
  tipo: RetoTipo;
  clase_id?: string | null;
  titulo: string;
  emoji?: string;
  descripcion?: string;
  intro?: string;
  accion?: string;
  xp?: number;
  pasos?: RetoRow["pasos"];
  tips?: RetoRow["tips"];
  consejo?: string;
  activo?: boolean;
  orden?: number;
};

// ————— Retos —————
export async function listarRetosAdmin(): Promise<RetoRow[]> {
  const admin = await comoAdmin();
  if (!admin) return [];
  const { data } = await admin.from("retos").select("*").order("created_at", { ascending: false });
  return (data || []) as RetoRow[];
}

export async function crearReto(input: RetoInput): Promise<{ ok: true; id: string } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!input.titulo?.trim()) return { error: "El título es obligatorio." };
  const { data, error } = await admin
    .from("retos")
    .insert({
      tipo: input.tipo,
      clase_id: input.tipo === "curso" ? input.clase_id || null : null,
      titulo: input.titulo.trim(),
      emoji: input.emoji || "🎯",
      descripcion: input.descripcion || "",
      intro: input.intro || "",
      accion: input.accion || "compartirlo",
      xp: input.xp ?? 50,
      pasos: input.pasos || [],
      tips: input.tips || null,
      consejo: input.consejo || "",
      activo: input.activo ?? true,
      orden: input.orden ?? 0,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No se pudo crear el reto." };
  return { ok: true, id: data.id as string };
}

export async function actualizarReto(id: string, input: RetoInput): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin
    .from("retos")
    .update({
      tipo: input.tipo,
      clase_id: input.tipo === "curso" ? input.clase_id || null : null,
      titulo: input.titulo.trim(),
      emoji: input.emoji || "🎯",
      descripcion: input.descripcion || "",
      intro: input.intro || "",
      accion: input.accion || "compartirlo",
      xp: input.xp ?? 50,
      pasos: input.pasos || [],
      tips: input.tips || null,
      consejo: input.consejo || "",
      activo: input.activo ?? true,
      orden: input.orden ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar el reto." };
  return { ok: true };
}

export async function borrarReto(id: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("retos").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar el reto." };
  return { ok: true };
}

// ————— Usuarios —————
export type UsuarioAdmin = { id: string; email: string | null; nombre: string | null; creado: string; esAdmin: boolean; esRaiz: boolean };

export async function listarUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  const admin = await comoAdmin();
  if (!admin) return [];
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: perfiles } = await admin.from("profiles").select("id, is_admin");
  const adminMap = new Map((perfiles || []).map((p) => [p.id as string, p.is_admin === true]));
  return (data?.users || []).map((u) => {
    const raiz = esAdmin(u.email); // admins por ADMIN_EMAILS (no se pueden quitar)
    return {
      id: u.id,
      email: u.email ?? null,
      nombre: (u.user_metadata?.full_name as string) || null,
      creado: u.created_at,
      esAdmin: raiz || adminMap.get(u.id) === true,
      esRaiz: raiz,
    };
  });
}

// Promueve o quita admin a un usuario (los admins de ADMIN_EMAILS no se pueden quitar).
export async function marcarAdmin(userId: string, valor: boolean): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("profiles").update({ is_admin: valor }).eq("id", userId);
  if (error) return { error: "No se pudo cambiar el rol." };
  return { ok: true };
}

// ————— Comentarios (moderación) —————
export type ComentarioAdmin = {
  id: string;
  autorNombre: string;
  texto: string;
  oculto: boolean;
  fecha: string;
  retoTitulo: string;
};

export async function listarComentariosAdmin(): Promise<ComentarioAdmin[]> {
  const admin = await comoAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("comentarios")
    .select("id, autor_id, reto_id, texto, oculto, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (!data || data.length === 0) return [];
  const autorIds = [...new Set(data.map((c) => c.autor_id as string))];
  const { data: perfiles } = await admin.from("profiles").select("id, full_name").in("id", autorIds);
  const pMap = new Map((perfiles || []).map((p) => [p.id as string, (p.full_name as string) || "Creador"]));
  const retoCache = new Map<string, string>();
  const out: ComentarioAdmin[] = [];
  for (const c of data) {
    const rid = c.reto_id as string;
    if (!retoCache.has(rid)) {
      const r = await getRetoUnificado(rid);
      retoCache.set(rid, r?.titulo || rid);
    }
    out.push({
      id: c.id as string,
      autorNombre: pMap.get(c.autor_id as string) || "Creador",
      texto: c.texto as string,
      oculto: c.oculto as boolean,
      fecha: c.created_at as string,
      retoTitulo: retoCache.get(rid)!,
    });
  }
  return out;
}

export async function moderarComentario(id: string, oculto: boolean): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("comentarios").update({ oculto }).eq("id", id);
  if (error) return { error: "No se pudo moderar." };
  return { ok: true };
}

export async function borrarComentario(id: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("comentarios").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar." };
  return { ok: true };
}

// ————— Avances / envíos de retos —————
export type Avance = {
  userId: string;
  nombre: string;
  retoId: string;
  retoTitulo: string;
  retoEmoji: string;
  estado: string;
  revision: "pendiente" | "aprobado" | "rechazado";
  respuestas: Record<string, string>;
  archivoUrl: string | null;
  actualizado: string;
};

export async function listarAvances(): Promise<Avance[]> {
  const admin = await comoAdmin();
  if (!admin) return [];
  const { data: subs } = await admin
    .from("reto_submissions")
    .select("user_id, reto_id, respuestas, archivo_url, estado, revision, updated_at")
    .order("updated_at", { ascending: false });
  if (!subs || subs.length === 0) return [];

  // Nombres de usuarios.
  const ids = [...new Set(subs.map((s) => s.user_id as string))];
  const { data: perfiles } = await admin.from("profiles").select("id, full_name").in("id", ids);
  const nombreMap = new Map((perfiles || []).map((p) => [p.id as string, (p.full_name as string) || "Creador"]));

  // Títulos de retos (cache por reto_id).
  const retoCache = new Map<string, { titulo: string; emoji: string }>();
  const out: Avance[] = [];
  for (const s of subs) {
    const rid = s.reto_id as string;
    if (!retoCache.has(rid)) {
      const r = await getRetoUnificado(rid);
      retoCache.set(rid, { titulo: r?.titulo || rid, emoji: r?.emoji || "🎯" });
    }
    const info = retoCache.get(rid)!;
    out.push({
      userId: s.user_id as string,
      nombre: nombreMap.get(s.user_id as string) || "Creador",
      retoId: rid,
      retoTitulo: info.titulo,
      retoEmoji: info.emoji,
      estado: (s.estado as string) || "borrador",
      revision: (s.revision as Avance["revision"]) || "pendiente",
      respuestas: (s.respuestas as Record<string, string>) || {},
      archivoUrl: (s.archivo_url as string) || null,
      actualizado: s.updated_at as string,
    });
  }
  return out;
}

export async function revisarReto(
  userId: string,
  retoId: string,
  revision: "aprobado" | "rechazado" | "pendiente"
): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin
    .from("reto_submissions")
    .update({ revision })
    .eq("user_id", userId)
    .eq("reto_id", retoId);
  if (error) return { error: "No se pudo actualizar la revisión." };

  // Aprobado → su respuesta aparece en la comunidad; si no, se oculta.
  if (revision === "aprobado") {
    const { data: sub } = await admin
      .from("reto_submissions")
      .select("respuestas, archivo_url, estado")
      .eq("user_id", userId).eq("reto_id", retoId).maybeSingle();
    if (sub?.estado === "publicado") {
      await espejarRetoEnComunidad({
        userId, retoId,
        respuestas: (sub.respuestas as Record<string, string>) || null,
        archivoUrl: (sub.archivo_url as string) || null,
      });
    }
  } else {
    await ocultarRetoEnComunidad(userId, retoId);
  }

  // El alumno se entera del veredicto sin tener que ir a buscarlo.
  if (revision === "aprobado") {
    await notificar(userId, "reto", "¡Tu reto fue aprobado! 🎉",
      "Ya puedes seguir con la siguiente clase.", `/app/reto/${retoId}`);
  } else if (revision === "rechazado") {
    await notificar(userId, "reto", "Tu reto necesita ajustes",
      "Entra para ver los comentarios del equipo y vuelve a enviarlo.", `/app/reto/${retoId}`);
  }
  return { ok: true };
}

export async function crearUsuarioAdmin(
  email: string,
  nombre: string,
  password: string,
  comoAdminNuevo: boolean = false
): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!email?.trim() || !password || password.length < 6)
    return { error: "Correo y contraseña (mín. 6) son obligatorios." };

  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: nombre?.trim() || "" },
  });
  if (error || !data.user) return { error: error?.message || "No se pudo crear el usuario." };

  // Asegura el perfil con el nombre y el rol elegido (admin o normal).
  await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: nombre?.trim() || "",
    is_admin: comoAdminNuevo,
  });
  return { ok: true };
}
