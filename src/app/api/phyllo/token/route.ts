import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearUsuario, crearSdkToken, PHYLLO_ENV, PHYLLO_CONFIGURADO } from "@/lib/phyllo";

// Prepara el usuario Phyllo y devuelve el token para el Connect SDK.
// GET existe solo para poder probar en el navegador; POST es el real.
export async function GET() {
  return POST();
}

export async function POST() {
  try {
    if (!PHYLLO_CONFIGURADO)
      return NextResponse.json({ error: "La conexión de redes aún no está configurada." });

    const supabase = await createClient();
    let user = (await supabase.auth.getUser()).data.user;
    if (!user) user = (await supabase.auth.getSession()).data.session?.user ?? null;
    if (!user) {
      const store = await cookies();
      const authCookies = store.getAll().map((c) => c.name).filter((n) => n.includes("sb-") || n.includes("auth"));
      return NextResponse.json({ error: "Inicia sesión de nuevo.", debug_cookies: authCookies });
    }

    const admin = createAdminClient();
    const nombre = (user.user_metadata?.full_name as string) || user.email || "Creador";

    let phylloUserId: string | null = null;
    const sel = await admin
      .from("social_connections")
      .select("external_id")
      .eq("user_id", user.id)
      .eq("provider", "phyllo")
      .maybeSingle();
    if (sel.data?.external_id) phylloUserId = sel.data.external_id as string;

    if (!phylloUserId) {
      let creado = await crearUsuario(nombre, `melsprout-${user.id}`);
      if (!creado?.id) creado = await crearUsuario(nombre, `melsprout-${user.id}-${Date.now()}`);
      if (!creado?.id) return NextResponse.json({ error: "No se pudo preparar la conexión. Inténtalo de nuevo." });
      phylloUserId = creado.id;
      await admin.from("social_connections").upsert({
        user_id: user.id,
        provider: "phyllo",
        external_id: phylloUserId,
        updated_at: new Date().toISOString(),
      });
    }

    const t = await crearSdkToken(phylloUserId);
    if (!t) return NextResponse.json({ error: "No se pudo generar el token de conexión." });

    return NextResponse.json({ sdkToken: t.sdk_token, environment: PHYLLO_ENV, userId: phylloUserId });
  } catch (e) {
    return NextResponse.json({ error: "No se pudo preparar: " + (e instanceof Error ? e.message : String(e)) });
  }
}
