import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, fetchUser } from "@/lib/tiktok";
import { guardarConexion } from "@/lib/social-store";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const destino = `${origin}/app/perfil/completar?paso=conectar`;
  const code = searchParams.get("code");
  if (searchParams.get("error") || !code)
    return NextResponse.redirect(`${destino}&r=tiktok_err`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const tok = await exchangeCode(origin, code);
  if (!tok) return NextResponse.redirect(`${destino}&r=tiktok_err`);

  const u = await fetchUser(tok.access_token);
  if (!u) return NextResponse.redirect(`${destino}&r=tiktok_err`);

  await guardarConexion(user.id, "tiktok", {
    externalId: u.id,
    username: u.username,
    followers: u.followers,
    accessToken: tok.access_token,
    expiresAt: new Date(Date.now() + tok.expires_in * 1000).toISOString(),
  });

  return NextResponse.redirect(`${destino}&r=tiktok_ok`);
}
