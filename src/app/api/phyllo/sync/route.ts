import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerCuentas, obtenerPerfiles, llaveDePlataforma } from "@/lib/phyllo";

type Metrica = { username: string | null; followers: number | null; updated_at: string };

// Tras conectar en Phyllo: jala perfiles/cuentas y guarda las métricas del creador.
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Inicia sesión de nuevo." });

    const admin = createAdminClient();
    const { data: conn } = await admin
      .from("social_connections")
      .select("external_id")
      .eq("user_id", user.id)
      .eq("provider", "phyllo")
      .maybeSingle();
    const phylloUserId = conn?.external_id as string | undefined;
    if (!phylloUserId) return NextResponse.json({ error: "Aún no has conectado ninguna cuenta." });

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

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "sync: " + (e instanceof Error ? e.message : String(e)) });
  }
}
