"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { zonaDe, ymdEnZona } from "@/lib/zona";

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
    await createAdminClient()
      .from("profiles")
      .update({ racha_congelada: false, racha_fecha: hoyStr, ultima_actividad: new Date().toISOString() })
      .eq("id", user.id);
    return;
  }

  const ultima = (p?.racha_fecha as string) ?? null;

  const ahora = new Date().toISOString();
  if (ultima === hoyStr) {
    // Ya contamos hoy, pero sigue siendo actividad: se anota la hora.
    await createAdminClient().from("profiles").update({ ultima_actividad: ahora }).eq("id", user.id);
    return;
  }

  const nuevaRacha = ultima === ayerStr ? ((p?.racha as number) || 0) + 1 : 1;
  await createAdminClient().from("profiles")
    .update({ racha: nuevaRacha, racha_fecha: hoyStr, ultima_actividad: ahora })
    .eq("id", user.id);
}

export type RachaInfo = {
  racha: number;
  hoyContado: boolean;
  // El alumno terminó todo lo disponible: la racha se guarda en vez de romperse.
  congelada: boolean;
  // 7 posiciones (Lun..Dom): true si hubo actividad ese día de la semana actual
  semana: boolean[];
  // Racha que todavía se puede rescatar (0 = no hay nada que rescatar). Ver
  // rescatarRacha: la segunda oportunidad dura 3 días.
  rescatable: number;
};

// Días completos entre dos fechas "YYYY-MM-DD". Se comparan a mediodía UTC para
// que los cambios de horario no muevan el resultado.
function diasEntre(desde: string, hasta: string): number {
  return Math.round(
    (Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86400000
  );
}

// Cuántos días sin entrar se perdonan: si la última actividad fue hace 2, 3 o 4
// días (o sea, falló 1, 2 o 3 días), todavía se puede recuperar la racha.
const RESCATE_MAX = 4;

// Lee la racha + qué días de ESTA semana (Lun–Dom, en TU zona horaria) tuvieron actividad.
export async function getRachaInfo(): Promise<RachaInfo> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { racha: 0, hoyContado: false, congelada: false, semana: Array(7).fill(false), rescatable: 0 };

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

  // Si la última actividad no fue hoy ni ayer, la racha YA se rompió: se muestra
  // en 0 aunque en la base siga el número viejo (se reescribe en la siguiente
  // actividad). Antes seguía anunciando "12 días" con la racha perdida.
  const ultimaFecha = (p?.racha_fecha as string) ?? null;
  const dias = ultimaFecha ? diasEntre(ultimaFecha, hoyStr) : Infinity;
  const vigente = !!p?.racha_congelada || dias <= 1;
  const guardada = (p?.racha as number) || 0;

  // Rota hace poco y valía la pena (2 días o más): se le ofrece recuperarla.
  const rescatable = !vigente && guardada >= 2 && dias <= RESCATE_MAX ? guardada : 0;

  return {
    racha: vigente ? guardada : 0,
    hoyContado,
    congelada: !!p?.racha_congelada,
    semana,
    rescatable,
  };
}

// Segunda oportunidad: devuelve la racha perdida en vez de ponerla en cero.
//
// No regala un día: deja la fecha en AYER, así que la cadena sigue viva pero
// para que siga creciendo tiene que completar algo hoy. Si no hace nada, mañana
// vuelve a estar rota.
export async function rescatarRacha(): Promise<{ ok: boolean; racha: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, racha: 0 };

  const { data: p } = await supabase
    .from("profiles").select("racha, racha_fecha, racha_congelada").eq("id", user.id).single();

  const tz = zonaDe(user);
  const hoyStr = ymdEnZona(tz);
  const ayerStr = ymdEnZona(tz, new Date(Date.now() - 86400000));
  const ultimaFecha = (p?.racha_fecha as string) ?? null;
  const guardada = (p?.racha as number) || 0;
  const dias = ultimaFecha ? diasEntre(ultimaFecha, hoyStr) : Infinity;

  // Se vuelve a comprobar aquí: el pop-up vive en el navegador y no se le cree.
  if (p?.racha_congelada || guardada < 2 || dias <= 1 || dias > RESCATE_MAX) {
    return { ok: false, racha: 0 };
  }

  await createAdminClient().from("profiles").update({ racha_fecha: ayerStr }).eq("id", user.id);
  return { ok: true, racha: guardada };
}

// Congela la racha cuando ya no queda nada por hacer. Se llama al terminar la
// última clase disponible: sin contenido nuevo el alumno no puede mantenerla,
// y perderla por eso sería castigarlo por ir al corriente.
export async function congelarRacha(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await createAdminClient().from("profiles").update({ racha_congelada: true }).eq("id", user.id);
}
