import "server-only";

// Correos con acceso al panel admin. Se configuran en la variable de entorno
// ADMIN_EMAILS (separados por coma). Ej: "sveidy@boostacademy.io,hola@marketingconmelissa.com".
const RAW = process.env.ADMIN_EMAILS || "sveidy@boostacademy.io";

export const ADMIN_EMAILS = RAW.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function esAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
