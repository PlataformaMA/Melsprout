"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdmin } from "@/lib/admin";
import type { RetoRow, RetoTipo } from "@/lib/retos-db";

// Verifica que quien llama sea admin. Devuelve el admin client o null.
async function comoAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !esAdmin(user.email)) return null;
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
export type UsuarioAdmin = { id: string; email: string | null; nombre: string | null; creado: string };

export async function listarUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  const admin = await comoAdmin();
  if (!admin) return [];
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return (data?.users || []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    nombre: (u.user_metadata?.full_name as string) || null,
    creado: u.created_at,
  }));
}

export async function crearUsuarioAdmin(
  email: string,
  nombre: string,
  password: string
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

  // Asegura el perfil con el nombre.
  await admin.from("profiles").upsert({ id: data.user.id, full_name: nombre?.trim() || "" });
  return { ok: true };
}
