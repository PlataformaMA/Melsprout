"use server";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// Zona horaria del usuario (guardada al entrar a la app). Fallback: México.
function zonaDe(user: User): string {
  return (user.user_metadata?.zona_horaria as string) || "America/Mexico_City";
}

// Fecha local (AAAA-MM-DD) de un instante, en la zona horaria del usuario.
function ymdEnZona(tz: string, base: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(base);
}

// Registra actividad de HOY (en la hora local del usuario) y actualiza la racha:
// - si ya contó hoy → no hace nada
// - si la última fue ayer → racha + 1
// - si hubo hueco (o es la primera) → racha = 1
export async function registrarRacha(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: p } = await supabase
    .from("profiles")
    .select("racha, racha_fecha, racha_congelada")
    .eq("id", user.id)
    .single();

  const tz = zonaDe(user);
  const hoyStr = ymdEnZona(tz);                                   // hoy en TU zona
  const ayerStr = ymdEnZona(tz, new Date(Date.now() - 86400000)); // ayer en TU zona

  // Si estaba congelada y vuelve a haber actividad, se descongela y continua
  // desde donde se quedo — no se reinicia por los dias sin clases disponibles.
  if (p?.racha_congelada) {
    await supabase
      .from("profiles")
      .update({ racha_congelada: false, racha_fecha: hoyStr })
      .eq("id", user.id);
    return;
  }

  const ultima = (p?.racha_fecha as string) ?? null;

  if (ultima === hoyStr) return; // ya contamos hoy

  const nuevaRacha = ultima === ayerStr ? ((p?.racha as number) || 0) + 1 : 1;
  await supabase.from("profiles").update({ racha: nuevaRacha, racha_fecha: hoyStr }).eq("id", user.id);
}

export type RachaInfo = {
  racha: number;
  hoyContado: boolean;
  // El alumno terminó todo lo disponible: la racha se guarda en vez de romperse.
  congelada: boolean;
  // 7 posiciones (Lun..Dom): true si hubo actividad ese día de la semana actual
  semana: boolean[];
};

// Lee la racha + qué días de ESTA semana (Lun–Dom, en TU zona horaria) tuvieron actividad.
export async function getRachaInfo(): Promise<RachaInfo> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { racha: 0, hoyContado: false, congelada: false, semana: Array(7).fill(false) };

  const { data: p } = await supabase.from("profiles").select("racha, racha_fecha, racha_congelada").eq("id", user.id).single();

  const tz = zonaDe(user);
  const hoyStr = ymdEnZona(tz);
  // Mediodía UTC de la fecha local → aritmética de días sin líos de DST.
  const hoyD = new Date(`${hoyStr}T12:00:00Z`);
  const diaSemana = (hoyD.getUTCDay() + 6) % 7;       // 0 = lunes
  const lunesD = new Date(hoyD.getTime() - diaSemana * 86400000);

  const semana = Array(7).fill(false);
  const marcar = (iso: string | null) => {
    if (!iso) return;
    const local = ymdEnZona(tz, new Date(iso));       // día local de esa actividad
    const idx = Math.round((new Date(`${local}T12:00:00Z`).getTime() - lunesD.getTime()) / 86400000);
    if (idx >= 0 && idx < 7) semana[idx] = true;
  };

  // Traemos actividad de los últimos ~8 días y marcar() filtra a la semana local.
  const desde = new Date(Date.now() - 8 * 86400000).toISOString();
  const [{ data: clases }, { data: retos }] = await Promise.all([
    supabase.from("clase_progreso").select("completada_at").eq("user_id", user.id).gte("completada_at", desde),
    supabase.from("reto_submissions").select("updated_at").eq("user_id", user.id).gte("updated_at", desde),
  ]);
  for (const c of clases || []) marcar(c.completada_at as string);
  for (const r of retos || []) marcar(r.updated_at as string);

  const hoyContado = (p?.racha_fecha as string) === hoyStr;
  if (hoyContado) semana[diaSemana] = true;

  return {
    racha: (p?.racha as number) || 0,
    hoyContado,
    congelada: !!p?.racha_congelada,
    semana,
  };
}

// Congela la racha cuando ya no queda nada por hacer. Se llama al terminar la
// última clase disponible: sin contenido nuevo el alumno no puede mantenerla,
// y perderla por eso sería castigarlo por ir al corriente.
export async function congelarRacha(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ racha_congelada: true }).eq("id", user.id);
}
