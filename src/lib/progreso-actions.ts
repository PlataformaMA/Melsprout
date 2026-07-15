"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ETAPA_1 } from "@/lib/data";

// Orden lineal de las clases (para desbloqueo secuencial).
const ORDEN = ETAPA_1.flatMap((m) => m.clases.map((c) => c.id));

// Devuelve el set de clase_ids completadas por el usuario.
export async function getClasesCompletadas(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from("clase_progreso")
    .select("clase_id, completada")
    .eq("user_id", user.id)
    .eq("completada", true);
  return new Set((data || []).map((r) => r.clase_id as string));
}

// Marca una clase como completada. Da +100 XP UNA sola vez. Devuelve si dio XP.
export async function completarClase(
  claseId: string
): Promise<{ ok: true; xpDado: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  if (!ORDEN.includes(claseId)) return { error: "Clase no válida." };

  // ¿Ya tenía XP dado por esta clase?
  const { data: prev } = await supabase
    .from("clase_progreso")
    .select("xp_dado")
    .eq("user_id", user.id)
    .eq("clase_id", claseId)
    .maybeSingle();
  const yaTeniaXp = prev?.xp_dado === true;

  const { error } = await supabase.from("clase_progreso").upsert({
    user_id: user.id,
    clase_id: claseId,
    completada: true,
    xp_dado: true,
    completada_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "No se pudo guardar el progreso." };

  // +100 XP una sola vez.
  if (!yaTeniaXp) {
    const admin = createAdminClient();
    const { data: p } = await admin.from("profiles").select("xp").eq("id", user.id).single();
    await admin.from("profiles").update({ xp: (p?.xp ?? 0) + 100 }).eq("id", user.id);
  }
  return { ok: true, xpDado: !yaTeniaXp };
}

// Guarda la posición del video (memoria de posición). No bloquea si falla.
export async function guardarPosicion(claseId: string, segundos: number): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("clase_progreso").upsert({
    user_id: user.id,
    clase_id: claseId,
    segundos_vistos: Math.round(segundos),
    updated_at: new Date().toISOString(),
  });
}
