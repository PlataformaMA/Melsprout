"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

export type ClaseVivo = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  instructor: string | null;
  inicia_at: string;
  duracion_min: number;
  thumbnail_url: string | null;
  stream_url: string | null;
  grabacion_url: string | null;
  xp: number;
  activo?: boolean;
};

async function comoAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return null;
  return createAdminClient();
}

// ————— Usuario —————
export async function listarClasesVivo(): Promise<ClaseVivo[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("clases_vivo")
    .select("*")
    .eq("activo", true)
    .order("inicia_at", { ascending: true });
  const filas = (data || []) as ClaseVivo[];
  // Si aún no hay clases en la BD, mostramos ejemplos (para no ver la pantalla vacía).
  return filas.length > 0 ? filas : clasesVivoEjemplo();
}

// Clases en vivo de EJEMPLO (solo se muestran mientras no haya ninguna en la BD).
// No llevan enlaces: los reales se cargan desde el panel admin. Las grabaciones
// sin video se ven como "Próximamente" en vez de mandar a otro sitio.
function clasesVivoEjemplo(): ClaseVivo[] {
  const ahora = Date.now();
  const enH = (h: number) => new Date(ahora + h * 3600_000).toISOString();
  const ZOOM = null; // ← el enlace real de la sesión se pone desde el panel admin
  const REC = null;  // ← la grabación real se sube desde el panel admin
  return [
    { id: "ej-live", titulo: "Cómo generar ideas de contenido que conectan", descripcion: "En vivo con Melissa.", categoria: "Marketing de contenido", instructor: "Melissa Arria", inicia_at: enH(-0.1), duracion_min: 60, thumbnail_url: null, stream_url: ZOOM, grabacion_url: null, xp: 50, activo: true },
    { id: "ej-2", titulo: "Edición rápida para redes sociales (CapCut)", descripcion: "Aprende a editar rápido y con impacto.", categoria: "Edición y video", instructor: "Diego Avilés", inicia_at: enH(2), duracion_min: 75, thumbnail_url: null, stream_url: ZOOM, grabacion_url: null, xp: 50, activo: true },
    { id: "ej-3", titulo: "Estrategias para crecer en TikTok en 2024", descripcion: "Tácticas para crecer en TikTok.", categoria: "TikTok", instructor: "Valentina R.", inicia_at: enH(24), duracion_min: 60, thumbnail_url: null, stream_url: ZOOM, grabacion_url: null, xp: 50, activo: true },
    { id: "ej-4", titulo: "Branding personal: construye tu marca", descripcion: "Define y potencia tu marca personal.", categoria: "Branding personal", instructor: "Andrés García", inicia_at: enH(24 * 3), duracion_min: 60, thumbnail_url: null, stream_url: ZOOM, grabacion_url: null, xp: 50, activo: true },
    { id: "ej-g1", titulo: "Guiones que venden (Parte 1)", descripcion: null, categoria: "Copywriting", instructor: "Melissa Arria", inicia_at: enH(-48), duracion_min: 65, thumbnail_url: null, stream_url: null, grabacion_url: REC, xp: 50, activo: true },
    { id: "ej-g2", titulo: "Optimiza tu perfil de IG para crecer", descripcion: null, categoria: "Instagram", instructor: "Alexia", inicia_at: enH(-96), duracion_min: 68, thumbnail_url: null, stream_url: null, grabacion_url: REC, xp: 50, activo: true },
    { id: "ej-g3", titulo: "Hooks que sí funcionan", descripcion: null, categoria: "Contenido", instructor: "George", inicia_at: enH(-144), duracion_min: 47, thumbnail_url: null, stream_url: null, grabacion_url: REC, xp: 50, activo: true },
  ];
}

// Registra asistencia y da +50 XP una sola vez.
export async function asistirClaseVivo(id: string): Promise<{ ok: true; xpDado: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const admin = createAdminClient();

  const { data: clase } = await admin.from("clases_vivo").select("xp").eq("id", id).maybeSingle();
  if (!clase) return { error: "Clase no encontrada." };

  const { data: prev } = await admin
    .from("asistencias_vivo")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("clase_vivo_id", id)
    .maybeSingle();
  if (prev) return { ok: true, xpDado: false };

  await admin.from("asistencias_vivo").insert({ user_id: user.id, clase_vivo_id: id });
  const { data: p } = await admin.from("profiles").select("xp").eq("id", user.id).single();
  await admin.from("profiles").update({ xp: (p?.xp ?? 0) + ((clase.xp as number) || 50) }).eq("id", user.id);
  return { ok: true, xpDado: true };
}

// ————— Admin —————
export type ClaseVivoInput = {
  titulo: string;
  descripcion?: string;
  categoria?: string;
  instructor?: string;
  inicia_at: string; // ISO
  duracion_min?: number;
  thumbnail_url?: string;
  stream_url?: string;
  grabacion_url?: string;
  xp?: number;
  activo?: boolean;
};

export async function listarClasesVivoAdmin(): Promise<ClaseVivo[]> {
  const admin = await comoAdmin();
  if (!admin) return [];
  const { data } = await admin.from("clases_vivo").select("*").order("inicia_at", { ascending: false });
  return (data || []) as ClaseVivo[];
}

export async function crearClaseVivo(input: ClaseVivoInput): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!input.titulo?.trim() || !input.inicia_at) return { error: "Título y fecha/hora son obligatorios." };
  const { error } = await admin.from("clases_vivo").insert({
    titulo: input.titulo.trim(),
    descripcion: input.descripcion || "",
    categoria: input.categoria || "",
    instructor: input.instructor || "",
    inicia_at: input.inicia_at,
    duracion_min: input.duracion_min ?? 60,
    thumbnail_url: input.thumbnail_url || null,
    stream_url: input.stream_url || null,
    grabacion_url: input.grabacion_url || null,
    xp: input.xp ?? 50,
    activo: input.activo ?? true,
  });
  if (error) return { error: "No se pudo crear la clase." };
  return { ok: true };
}

export async function actualizarClaseVivo(id: string, input: ClaseVivoInput): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("clases_vivo").update({
    titulo: input.titulo.trim(),
    descripcion: input.descripcion || "",
    categoria: input.categoria || "",
    instructor: input.instructor || "",
    inicia_at: input.inicia_at,
    duracion_min: input.duracion_min ?? 60,
    thumbnail_url: input.thumbnail_url || null,
    stream_url: input.stream_url || null,
    grabacion_url: input.grabacion_url || null,
    xp: input.xp ?? 50,
    activo: input.activo ?? true,
  }).eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  return { ok: true };
}

export async function borrarClaseVivo(id: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("clases_vivo").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar." };
  return { ok: true };
}
