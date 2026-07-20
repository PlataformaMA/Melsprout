"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Registra un referido y da +100 XP a quien invitó (una sola vez por nuevo usuario).
export async function procesarReferido(referidorId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión." };
  if (!referidorId || referidorId === user.id) return { ok: true }; // no auto-referido

  const admin = createAdminClient();
  // ¿Este usuario ya fue contado como referido?
  const { data: ya } = await admin.from("referidos").select("referido_id").eq("referido_id", user.id).maybeSingle();
  if (ya) return { ok: true };

  // ¿El referidor existe?
  const { data: ref } = await admin.from("profiles").select("xp").eq("id", referidorId).maybeSingle();
  if (!ref) return { ok: true };

  await admin.from("referidos").insert({ referido_id: user.id, referidor_id: referidorId });
  await admin.from("profiles").update({ xp: (ref.xp ?? 0) + 100 }).eq("id", referidorId);
  return { ok: true };
}
