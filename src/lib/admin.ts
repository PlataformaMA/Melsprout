import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Correos con acceso "raíz" al panel (bootstrap). Se configuran en ADMIN_EMAILS
// (separados por coma). Estos NUNCA se pueden quitar desde el panel.
const RAW = process.env.ADMIN_EMAILS || "sveidy@boostacademy.io";

export const ADMIN_EMAILS = RAW.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Admin por correo raíz (síncrono, para el bootstrap inicial).
export function esAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Admin real: correo raíz (ADMIN_EMAILS) O marcado como admin en la BD (profiles.is_admin).
export async function esAdminUsuario(
  userId: string | null | undefined,
  email: string | null | undefined
): Promise<boolean> {
  if (esAdmin(email)) return true;
  if (!userId) return false;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
    return data?.is_admin === true;
  } catch {
    return false;
  }
}
