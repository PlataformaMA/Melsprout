import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, fetchChannel } from "@/lib/youtube";
import { guardarConexion } from "@/lib/social-store";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const destino = `${origin}/app/perfil/completar?paso=conectar`;
  const code = searchParams.get("code");
  if (searchParams.get("error") || !code)
    return NextResponse.redirect(`${destino}&r=youtube_err`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const tok = await exchangeCode(origin, code);
  if (!tok) return NextResponse.redirect(`${destino}&r=youtube_err`);

  const ch = await fetchChannel(tok.access_token);
  if (!ch) return NextResponse.redirect(`${destino}&r=youtube_err`);

  await guardarConexion(user.id, "youtube", {
    externalId: ch.id,
    username: ch.title,
    followers: ch.followers,
    accessToken: tok.refresh_token ?? tok.access_token,
    expiresAt: new Date(Date.now() + tok.expires_in * 1000).toISOString(),
  });

  return NextResponse.redirect(`${destino}&r=youtube_ok`);
}
