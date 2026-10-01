import type { User } from "@supabase/supabase-js";

// Ayudantes de zona horaria. Viven aparte porque racha-actions.ts es un archivo
// de acciones de servidor ("use server"), donde TODO lo exportado debe ser una
// función async: estos son cálculos puros y ahí no caben.

// Zona horaria del usuario (guardada al entrar a la app). Fallback: México.
export function zonaDe(user: User): string {
  return (user.user_metadata?.zona_horaria as string) || "America/Mexico_City";
}

// Fecha local (AAAA-MM-DD) de un instante, en la zona horaria del usuario.
export function ymdEnZona(tz: string, base: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(base);
}

// Medianoche de HOY en la zona de la persona, en ISO: para contar "lo de hoy".
export function inicioDeHoy(user: User): string {
  const tz = zonaDe(user);
  const comoUtc = new Date(`${ymdEnZona(tz)}T00:00:00Z`);
  const desfase = comoUtc.getTime() - new Date(comoUtc.toLocaleString("en-US", { timeZone: tz })).getTime();
  return new Date(comoUtc.getTime() + desfase).toISOString();
}
