"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { registrarRacha } from "@/lib/racha-actions";

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
  modulo_id?: string | null;   // si apunta a un curso especial, es solo para quien lo compró
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
  // Solo lo real: si no hay clases cargadas, la pantalla lo dice y ya.
  // Antes se mostraban ejemplos que no existían en el panel.
  const clases = (data || []) as ClaseVivo[];

  // Una clase en vivo atada a un curso especial (Boost Your Web, por ejemplo)
  // es parte de lo que se pagó: solo la ven quienes compraron ese curso. Las
  // demás siguen abiertas para todos, como hasta ahora.
  const deCurso = [...new Set(clases.map((c) => c.modulo_id).filter(Boolean) as string[])];
  if (deCurso.length === 0) return clases;

  const { data: especiales } = await admin
    .from("cursos_modulos")
    .select("id")
    .in("id", deCurso)
    .eq("especial", true);
  const conLlave = new Set((especiales || []).map((m) => m.id as string));
  if (conLlave.size === 0) return clases;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return clases.filter((c) => !c.modulo_id || !conLlave.has(c.modulo_id));

  // El equipo las ve todas, para poder revisarlas.
  if (await esAdminUsuario(user.id, user.email)) return clases;

  const { data: accesos } = await admin
    .from("curso_accesos")
    .select("modulo_id")
    .eq("user_id", user.id)
    .in("modulo_id", [...conLlave]);
  const mios = new Set((accesos || []).map((a) => a.modulo_id as string));
  return clases.filter((c) => !c.modulo_id || !conLlave.has(c.modulo_id) || mios.has(c.modulo_id));
}


// Registra asistencia y da +50 XP una sola vez.
export async function asistirClaseVivo(id: string): Promise<{ ok: true; xpDado: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const admin = createAdminClient();

  const { data: clase } = await admin.from("clases_vivo")
    .select("xp, inicia_at, duracion_min, activo").eq("id", id).maybeSingle();
  if (!clase || clase.activo === false) return { error: "Clase no encontrada." };

  // El XP es por ASISTIR: se paga cuando la clase ya empezó, no al apuntarse.
  const empieza = new Date(clase.inicia_at as string).getTime();
  const termina = empieza + (((clase.duracion_min as number) || 60) + 120) * 60000;
  const ahora = Date.now();
  const enCurso = ahora >= empieza - 10 * 60000 && ahora <= termina;

  const { data: prev } = await admin
    .from("asistencias_vivo")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("clase_vivo_id", id)
    .maybeSingle();
  if (prev) return { ok: true, xpDado: false };

  await admin.from("asistencias_vivo").insert({ user_id: user.id, clase_vivo_id: id });
  await registrarRacha();                            // asistir también es actividad del día
  if (!enCurso) return { ok: true, xpDado: false };   // apuntada, pero sin XP todavía

  await admin.rpc("sumar_xp", { p_user: user.id, p_xp: Math.min(Math.max((clase.xp as number) || 50, 0), 200) });
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
