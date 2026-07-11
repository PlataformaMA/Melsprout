import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  crearUsuario, crearSdkToken, obtenerCuentas, obtenerPerfiles,
  llaveDePlataforma, PHYLLO_ENV, PHYLLO_CONFIGURADO,
} from "@/lib/phyllo";

export type TokenPhyllo = { sdkToken: string; environment: string; userId: string };

// Prepara el usuario de Phyllo (crea/reusa) y genera el token del Connect SDK.
// Se llama desde la PÁGINA (server component), que sí tiene la sesión.
export async function prepararTokenPhyllo(userId: string, nombre: string): Promise<TokenPhyllo | null> {
  if (!PHYLLO_CONFIGURADO) return null;
  const admin = createAdminClient();

  let phylloUserId: string | null = null;
  const sel = await admin
    .from("social_connections")
    .select("external_id")
    .eq("user_id", userId)
    .eq("provider", "phyllo")
    .maybeSingle();
  if (sel.data?.external_id) phylloUserId = sel.data.external_id as string;

  if (!phylloUserId) {
    let creado = await crearUsuario(nombre, `melsprout-${userId}`);
    if (!creado?.id) creado = await crearUsuario(nombre, `melsprout-${userId}-${Date.now()}`);
    if (!creado?.id) return null;
    phylloUserId = creado.id;
    await admin.from("social_connections").upsert({
      user_id: userId,
      provider: "phyllo",
      external_id: phylloUserId,
      updated_at: new Date().toISOString(),
    });
  }

  const t = await crearSdkToken(phylloUserId);
  if (!t) return null;
  return { sdkToken: t.sdk_token, environment: PHYLLO_ENV, userId: phylloUserId };
}

type Metrica = { username: string | null; followers: number | null; updated_at: string };

// Jala perfiles/cuentas de Phyllo y guarda las métricas del creador.
export async function sincronizarMetricasPhyllo(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("social_connections")
    .select("external_id")
    .eq("user_id", userId)
    .eq("provider", "phyllo")
    .maybeSingle();
  const phylloUserId = conn?.external_id as string | undefined;
  if (!phylloUserId) return;

  const perfiles = await obtenerPerfiles(phylloUserId);
  const cuentas = await obtenerCuentas(phylloUserId);

  const metricas: Record<string, Metrica> = {};
  const redes: Record<string, string> = {};
  const ahora = new Date().toISOString();

  for (const p of perfiles) {
    const key = llaveDePlataforma(p.work_platform?.name);
    if (!key) continue;
    const followers = p.reputation?.follower_count ?? p.reputation?.subscriber_count ?? null;
    metricas[key] = { username: p.platform_username ?? null, followers, updated_at: ahora };
    if (p.platform_username) redes[key] = p.platform_username;
  }
  for (const a of cuentas) {
    const key = llaveDePlataforma(a.work_platform?.name);
    if (key && !metricas[key] && a.username) {
      metricas[key] = { username: a.username, followers: null, updated_at: ahora };
      redes[key] = a.username;
    }
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("metricas, redes")
    .eq("id", userId)
    .single();

  await admin
    .from("profiles")
    .update({
      metricas: { ...(prof?.metricas || {}), ...metricas },
      redes: { ...(prof?.redes || {}), ...redes },
    })
    .eq("id", userId);
}
