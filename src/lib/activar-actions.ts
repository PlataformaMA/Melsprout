"use server";

import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// Canjea el token del correo de compra por un enlace fresco de Supabase para
// crear la contraseña. Se llama al tocar el botón en /activar.
export async function activarCuenta(k: string): Promise<{ error: string } | never> {
  if (!/^[a-f0-9]{48}$/.test(k)) return { error: "El enlace no es válido." };
  const admin = createAdminClient();
  const hash = createHash("sha256").update(k).digest("hex");

  const { data: act } = await admin.from("activaciones")
    .select("user_id, usado_at").eq("token_hash", hash).maybeSingle();
  if (!act) return { error: "El enlace no es válido." };
  if (act.usado_at) return { error: "Este enlace ya se usó. Pide uno nuevo abajo." };

  const { data: u } = await admin.auth.admin.getUserById(act.user_id as string);
  const email = u?.user?.email;
  if (!email) return { error: "No encontramos la cuenta." };

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const th = link?.properties?.hashed_token;
  if (error || !th) return { error: "No se pudo generar el acceso. Intenta de nuevo." };

  await admin.from("activaciones").update({ usado_at: new Date().toISOString() }).eq("token_hash", hash);
  redirect(`/auth/callback?token_hash=${encodeURIComponent(th)}&type=recovery&next=/restablecer`);
}
