// Lee las llaves de Supabase desde las variables de entorno (.env.local).
// Usa valores marcador si aún no están configuradas, para que la app no se
// caiga al abrirla — las llamadas reales fallarán con un mensaje claro hasta
// que pegues tus llaves de Supabase.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const SUPABASE_CONFIGURADO =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// SECRET key (llave maestra) — SOLO servidor. Nunca lleva prefijo NEXT_PUBLIC_,
// así Next.js jamás la manda al navegador. Se usa para los códigos de respaldo.
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ¿Está lista la función de códigos de respaldo? (requiere la secret key)
export const BACKUP_CONFIGURADO = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
