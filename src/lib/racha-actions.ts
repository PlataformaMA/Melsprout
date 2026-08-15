"use server";

import { createClient } from "@/lib/supabase/server";

// Fecha (YYYY-MM-DD) de una fecha dada.
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Registra actividad de HOY y actualiza la racha:
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

  // Si estaba congelada y vuelve a haber actividad, se descongela y continúa
  // desde donde se quedó — no se reinicia por los días sin clases disponibles.
  if (p?.racha_congelada) {
    await supabase
      .from("profiles")
      .update({ racha_congelada: false, racha_fecha: ymd(new Date()) })
      .eq("id", user.id);
    return;
  }

  const hoy = new Date();
  const ayer = new Date(hoy.getTime() - 86400000);
  const hoyStr = ymd(hoy);
  const ayerStr = ymd(ayer);
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

// Lee la racha + qué días de ESTA semana (Lun–Dom) tuvieron actividad.
export async function getRachaInfo(): Promise<RachaInfo> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { racha: 0, hoyContado: false, congelada: false, semana: Array(7).fill(false) };

  const { data: p } = await supabase.from("profiles").select("racha, racha_fecha, racha_congelada").eq("id", user.id).single();

  // Inicio de semana = lunes 00:00 (hora del servidor).
  const now = new Date();
  const diaSemana = (now.getDay() + 6) % 7; // 0 = lunes
  const lunes = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diaSemana);

  const semana = Array(7).fill(false);
  const marcar = (iso: string | null) => {
    if (!iso) return;
    const d = new Date(iso);
    const idx = Math.floor((d.getTime() - lunes.getTime()) / 86400000);
    if (idx >= 0 && idx < 7) semana[idx] = true;
  };

  // Actividad: clases completadas + retos enviados esta semana.
  const desde = lunes.toISOString();
  const [{ data: clases }, { data: retos }] = await Promise.all([
    supabase.from("clase_progreso").select("completada_at").eq("user_id", user.id).gte("completada_at", desde),
    supabase.from("reto_submissions").select("updated_at").eq("user_id", user.id).gte("updated_at", desde),
  ]);
  for (const c of clases || []) marcar(c.completada_at as string);
  for (const r of retos || []) marcar(r.updated_at as string);

  const hoyStr = ymd(now);
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
