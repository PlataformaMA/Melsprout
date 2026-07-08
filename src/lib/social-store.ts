import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Guarda (de forma segura) el token y las métricas de una red conectada.
export async function guardarConexion(
  userId: string,
  provider: "instagram" | "tiktok" | "youtube",
  datos: {
    externalId?: string;
    username?: string;
    followers?: number | null;
    accessToken?: string;
    expiresAt?: string | null;
  }
) {
  const admin = createAdminClient();

  // Token en tabla protegida (solo servidor).
  await admin.from("social_connections").upsert({
    user_id: userId,
    provider,
    external_id: datos.externalId ?? null,
    username: datos.username ?? null,
    access_token: datos.accessToken ?? null,
    expires_at: datos.expiresAt ?? null,
    updated_at: new Date().toISOString(),
  });

  // Métricas públicas + @ en el perfil.
  const { data: p } = await admin
    .from("profiles")
    .select("metricas, redes")
    .eq("id", userId)
    .single();

  const metricas = {
    ...(p?.metricas || {}),
    [provider]: {
      followers: datos.followers ?? null,
      username: datos.username ?? null,
      updated_at: new Date().toISOString(),
    },
  };
  const redes = datos.username
    ? { ...(p?.redes || {}), [provider]: datos.username }
    : p?.redes || {};

  await admin.from("profiles").update({ metricas, redes }).eq("id", userId);
}
