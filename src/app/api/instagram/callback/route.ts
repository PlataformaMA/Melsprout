import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, longLived, fetchProfile } from "@/lib/instagram";
import { guardarConexion } from "@/lib/social-store";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const destino = `${origin}/app/perfil/completar?paso=conectar`;
  const code = searchParams.get("code");
  if (searchParams.get("error") || !code)
    return NextResponse.redirect(`${destino}&r=instagram_err`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const short = await exchangeCode(origin, code);
  if (!short) return NextResponse.redirect(`${destino}&r=instagram_err`);
  const long = await longLived(short.access_token);
  const token = long?.access_token ?? short.access_token;
  const prof = await fetchProfile(token);
  if (!prof) return NextResponse.redirect(`${destino}&r=instagram_err`);

  await guardarConexion(user.id, "instagram", {
    externalId: String(prof.user_id),
    username: prof.username,
    followers: prof.followers_count ?? null,
    accessToken: token,
    expiresAt: long ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null,
  });

  return NextResponse.redirect(`${destino}&r=instagram_ok`);
}
