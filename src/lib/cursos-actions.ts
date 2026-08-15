"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

async function comoAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return null;
  return createAdminClient();
}

// ————— Módulos —————
export async function crearModulo(nombre: string, descripcion: string, color: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!nombre.trim()) return { error: "El nombre es obligatorio." };
  const { data: max } = await admin.from("cursos_modulos").select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await admin.from("cursos_modulos").insert({ nombre: nombre.trim(), descripcion, color: color || "accent", orden: ((max?.orden as number) || 0) + 1 });
  if (error) return { error: "No se pudo crear el módulo." };
  return { ok: true };
}
export async function actualizarModulo(id: string, nombre: string, descripcion: string, color: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("cursos_modulos").update({ nombre: nombre.trim(), descripcion, color }).eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  return { ok: true };
}
export async function borrarModulo(id: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("cursos_modulos").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar (¿tiene clases?)." };
  return { ok: true };
}

// ————— Clases —————
export type ClaseInput = { titulo: string; instructor?: string; duracion_min?: number; nivel?: string; reto_texto?: string; reto_instrucciones?: string; portada?: string; revision?: string; video_url?: string };

export async function crearClase(moduloId: string, input: ClaseInput): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!input.titulo?.trim()) return { error: "El título es obligatorio." };
  const { data: max } = await admin.from("cursos_clases").select("orden").eq("modulo_id", moduloId).order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await admin.from("cursos_clases").insert({
    modulo_id: moduloId, titulo: input.titulo.trim(), instructor: input.instructor || "Melissa",
    duracion_min: input.duracion_min ?? 12, nivel: input.nivel || "basico",
    reto_texto: input.reto_texto || "", reto_instrucciones: input.reto_instrucciones || "", portada: input.portada || null, revision: input.revision || "auto",
    video_url: input.video_url || null, orden: ((max?.orden as number) || 0) + 1,
  });
  if (error) return { error: "No se pudo crear la clase." };
  return { ok: true };
}
export async function actualizarClase(id: string, input: ClaseInput): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const patch: Record<string, unknown> = { titulo: input.titulo.trim(), instructor: input.instructor, duracion_min: input.duracion_min, nivel: input.nivel, reto_texto: input.reto_texto, reto_instrucciones: input.reto_instrucciones, portada: input.portada || null, revision: input.revision };
  if (input.video_url !== undefined) patch.video_url = input.video_url || null;
  const { error } = await admin.from("cursos_clases").update(patch).eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  return { ok: true };
}
export async function borrarClase(id: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("cursos_clases").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar." };
  return { ok: true };
}
export async function setVideoClaseDB(id: string, videoUrl: string): Promise<{ ok: true } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };
  const { error } = await admin.from("cursos_clases").update({ video_url: videoUrl || null }).eq("id", id);
  if (error) return { error: "No se pudo guardar el video." };
  return { ok: true };
}
