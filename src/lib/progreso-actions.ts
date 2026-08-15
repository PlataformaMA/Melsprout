"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarRacha, congelarRacha } from "@/lib/racha-actions";
import { getCursos } from "@/lib/cursos-db";
import { notificar } from "@/lib/notificaciones-actions";
import { nivelPorXP } from "@/lib/data";

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
  if (!claseId) return { error: "Clase no válida." };

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
    const antes = p?.xp ?? 0;
    const despues = antes + 100;
    await admin.from("profiles").update({ xp: despues }).eq("id", user.id);

    // ¿Cruzó un umbral de nivel con esos 100 XP?
    const nAntes = nivelPorXP(antes).actual.nivel;
    const nDespues = nivelPorXP(despues);
    if (nDespues.actual.nivel > nAntes) {
      await notificar(user.id, "nivel", `¡Subiste al nivel ${nDespues.actual.nivel}! ⭐`,
        `Ahora eres ${nDespues.actual.nombre}.`, "/app/perfil");
    }
  }
  await registrarRacha(); // cuenta actividad de hoy para la racha

  // ¿Con esta clase terminó TODO lo publicado? Entonces congelamos la racha:
  // sin clases nuevas no puede mantenerla, y romperla sería castigarlo por ir
  // al corriente. Se descongela sola en cuanto haya contenido y vuelva.
  const cursos = await getCursos();
  const todas = cursos.flatMap((m) => m.clases.map((c) => c.id));
  const { count } = await supabase
    .from("clase_progreso")
    .select("clase_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completada", true);
  if (todas.length > 0 && (count ?? 0) >= todas.length) await congelarRacha();

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

// Conteo real de avance para el perfil: clases completadas y retos aprobados.
// Avance de CUALQUIER usuario. Los totales salen del curso REAL (la base), no
// de la lista estática: por eso antes decía "55 / 10". Y solo cuentan las clases
// y retos que siguen existiendo en el curso (había filas de clases ya borradas).
export async function getAvanceDe(userId: string): Promise<{
  clases: number; retos: number; totalClases: number; totalRetos: number;
}> {
  const admin = createAdminClient();
  const cursos = await getCursos();

  const idsClases = new Set<string>();
  let totalRetos = 0;
  for (const m of cursos) {
    for (const c of m.clases) {
      idsClases.add(c.id);
      if ((c.reto || "").trim()) totalRetos++;
    }
  }

  const [{ data: prog }, { data: subs }] = await Promise.all([
    admin.from("clase_progreso").select("clase_id").eq("user_id", userId).eq("completada", true),
    // OJO: la columna es reto_id, no clase_id. Con el nombre malo la consulta
    // fallaba y los retos completados salían SIEMPRE en 0.
    admin.from("reto_submissions").select("reto_id").eq("user_id", userId).eq("revision", "aprobado"),
  ]);

  const clases = (prog || []).filter((r) => idsClases.has(r.clase_id as string)).length;
  const retos = (subs || []).filter((r) => idsClases.has(r.reto_id as string)).length;

  return { clases, retos, totalClases: idsClases.size, totalRetos };
}

export async function getAvance(): Promise<{
  clases: number; retos: number; totalClases: number; totalRetos: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { clases: 0, retos: 0, totalClases: 0, totalRetos: 0 };
  return getAvanceDe(user.id);
}
