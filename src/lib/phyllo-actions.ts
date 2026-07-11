"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  crearUsuario, crearSdkToken,
  obtenerCuentas, obtenerPerfiles, llaveDePlataforma,
  PHYLLO_ENV, PHYLLO_CONFIGURADO,
} from "@/lib/phyllo";

type Metrica = { username: string | null; followers: number | null; updated_at: string };

// Crea (o reusa) el usuario de Phyllo y guarda su id en social_connections (provider='phyllo').
async function asegurarPhylloUser(userId: string, nombre: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data: conn } = await admin
    .from("social_connections")
    .select("external_id")
    .eq("user_id", userId)
    .eq("provider", "phyllo")
    .maybeSingle();
  if (conn?.external_id) return conn.external_id as string;

  // No lo teníamos guardado: créalo. Con external_id determinista; si ya existe
  // (400 user_exists) usamos uno único, porque el filtro por external_id de Phyllo
  // no es confiable para recuperarlo.
  let creado = await crearUsuario(nombre, `melsprout-${userId}`);
  if (!creado?.id) creado = await crearUsuario(nombre, `melsprout-${userId}-${Date.now()}`);
  const phylloId = creado?.id ?? null;
  if (!phylloId) return null;

  await admin.from("social_connections").upsert({
    user_id: userId,
    provider: "phyllo",
    external_id: phylloId,
    updated_at: new Date().toISOString(),
  });
  return phylloId;
}

// Devuelve el token + datos para inicializar el Connect SDK en el navegador.
export async function obtenerTokenPhyllo(): Promise<
  { sdkToken: string; environment: string; userId: string } | { error: string }
> {
  if (!PHYLLO_CONFIGURADO) return { error: "La conexión de redes aún no está configurada." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const nombre = (user.user_metadata?.full_name as string) || user.email || "Creador";
  const phylloUserId = await asegurarPhylloUser(user.id, nombre);
  if (!phylloUserId) return { error: "No se pudo preparar la conexión. Inténtalo de nuevo." };

  const t = await crearSdkToken(phylloUserId);
  if (!t) return { error: "No se pudo generar el token de conexión." };
  return { sdkToken: t.sdk_token, environment: PHYLLO_ENV, userId: phylloUserId };
}

// Tras conectar (o para refrescar): jala perfiles/cuentas de Phyllo y guarda métricas.
export async function sincronizarMetricasPhyllo(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("social_connections")
    .select("external_id")
    .eq("user_id", user.id)
    .eq("provider", "phyllo")
    .maybeSingle();
  const phylloUserId = conn?.external_id as string | undefined;
  if (!phylloUserId) return { error: "Aún no has conectado ninguna cuenta." };

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
    .eq("id", user.id)
    .single();

  await admin
    .from("profiles")
    .update({
      metricas: { ...(prof?.metricas || {}), ...metricas },
      redes: { ...(prof?.redes || {}), ...redes },
    })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  return { ok: true };
}
