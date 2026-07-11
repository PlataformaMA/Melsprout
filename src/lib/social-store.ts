import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MetricaRed } from "@/lib/insightiq";

// Guarda las métricas de las redes conectadas vía InsightIQ en el perfil.
// No maneja tokens (InsightIQ los guarda por su lado); solo métricas públicas + @.
export async function guardarMetricasInsightIQ(
  userId: string,
  redes: MetricaRed[]
) {
  if (!redes.length) return;
  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select("metricas, redes")
    .eq("id", userId)
    .single();

  const metricas = { ...(p?.metricas || {}) };
  const redesMap = { ...(p?.redes || {}) };
  const now = new Date().toISOString();
  for (const r of redes) {
    metricas[r.provider] = {
      followers: r.followers ?? undefined,
      following: r.following ?? undefined,
      posts: r.posts ?? undefined,
      likes: r.likes ?? undefined,
      username: r.username ?? undefined,
      url: r.url ?? undefined,
      image: r.image ?? undefined,
      audiencia: r.audiencia ?? null,
      updated_at: now,
    };
    if (r.username) redesMap[r.provider] = r.username;
  }
  await admin
    .from("profiles")
    .update({ metricas, redes: redesMap })
    .eq("id", userId);
}

// Quita una red del perfil (al desconectar la cuenta).
export async function eliminarRedInsightIQ(userId: string, provider: string) {
  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select("metricas, redes")
    .eq("id", userId)
    .single();

  const metricas = { ...(p?.metricas || {}) };
  const redesMap = { ...(p?.redes || {}) };
  delete metricas[provider];
  delete redesMap[provider];
  await admin
    .from("profiles")
    .update({ metricas, redes: redesMap })
    .eq("id", userId);
}

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
