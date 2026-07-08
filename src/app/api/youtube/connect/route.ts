import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, YOUTUBE_CONFIGURADO } from "@/lib/youtube";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const destino = `${origin}/app/perfil/completar?paso=conectar`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!YOUTUBE_CONFIGURADO)
    return NextResponse.redirect(`${destino}&r=youtube_noconfig`);
  return NextResponse.redirect(buildAuthUrl(origin, user.id));
}
