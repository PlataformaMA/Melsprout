import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, INSTAGRAM_CONFIGURADO } from "@/lib/instagram";

// Inicia la conexión con Instagram: manda al usuario a autorizar en Instagram.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const destino = `${origin}/app/perfil/completar?paso=instagram`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  if (!INSTAGRAM_CONFIGURADO) {
    return NextResponse.redirect(`${destino}&ig=noconfig`);
  }

  return NextResponse.redirect(buildAuthUrl(origin, user.id));
}
