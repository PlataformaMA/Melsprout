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

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Devuelve el token + datos para inicializar el Connect SDK en el navegador.
// (Con diagnóstico detallado temporal para ubicar el paso que falla.)
export async function obtenerTokenPhyllo(): Promise<
  { sdkToken: string; environment: string; userId: string } | { error: string }
> {
  try {
    if (!PHYLLO_CONFIGURADO) return { error: "La conexión de redes aún no está configurada." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión de nuevo." };

    const admin = createAdminClient();
    const nombre = (user.user_metadata?.full_name as string) || user.email || "Creador";

    // 1) ¿Ya tenemos su usuario Phyllo guardado?
    let phylloUserId: string | null = null;
    const sel = await admin
      .from("social_connections")
      .select("external_id")
      .eq("user_id", user.id)
      .eq("provider", "phyllo")
      .maybeSingle();
    if (sel.data?.external_id) phylloUserId = sel.data.external_id as string;

    // 2) Si no, créalo en Phyllo y guárdalo.
    if (!phylloUserId) {
      let creado = await crearUsuario(nombre, `melsprout-${user.id}`);
      if (!creado?.id) creado = await crearUsuario(nombre, `melsprout-${user.id}-${Date.now()}`);
      if (!creado?.id) return { error: "No se pudo preparar la conexión. Inténtalo de nuevo." };
      phylloUserId = creado.id;
      await admin.from("social_connections").upsert({
        user_id: user.id,
        provider: "phyllo",
        external_id: phylloUserId,
        updated_at: new Date().toISOString(),
      });
    }

    // 3) Token del SDK.
    const t = await crearSdkToken(phylloUserId);
    if (!t) return { error: "No se pudo generar el token de conexión." };

    return { sdkToken: t.sdk_token, environment: PHYLLO_ENV, userId: phylloUserId };
  } catch (e) {
    return { error: "No se pudo preparar la conexión: " + msg(e) };
  }
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
