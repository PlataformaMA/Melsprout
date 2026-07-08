import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCode, longLived, fetchProfile } from "@/lib/instagram";

// Regreso de Instagram: intercambia el código, lee seguidores y guarda todo.
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const destino = `${origin}/app/perfil/completar?paso=instagram`;
  const code = searchParams.get("code");
  const errParam = searchParams.get("error");

  if (errParam || !code) return NextResponse.redirect(`${destino}&ig=err`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const short = await exchangeCode(origin, code);
  if (!short) return NextResponse.redirect(`${destino}&ig=err`);

  const long = await longLived(short.access_token);
  const token = long?.access_token ?? short.access_token;

  const prof = await fetchProfile(token);
  if (!prof) return NextResponse.redirect(`${destino}&ig=err`);

  const admin = createAdminClient();

  // Guarda el token de forma segura (tabla protegida, solo servidor).
  await admin.from("social_connections").upsert({
    user_id: user.id,
    provider: "instagram",
    external_id: String(prof.user_id),
    username: prof.username,
    access_token: token,
    expires_at: long
      ? new Date(Date.now() + long.expires_in * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  });

  // Guarda seguidores (métricas) y el @ en el perfil.
  const { data: p } = await admin
    .from("profiles")
    .select("metricas, redes")
    .eq("id", user.id)
    .single();

  const metricas = {
    ...(p?.metricas || {}),
    instagram: {
      followers: prof.followers_count ?? null,
      username: prof.username,
      updated_at: new Date().toISOString(),
    },
  };
  const redes = { ...(p?.redes || {}), instagram: prof.username };

  await admin.from("profiles").update({ metricas, redes }).eq("id", user.id);

  return NextResponse.redirect(`${destino}&ig=ok`);
}
