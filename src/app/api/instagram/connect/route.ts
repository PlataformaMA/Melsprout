import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, INSTAGRAM_CONFIGURADO, SCOPE_BASICO, SCOPE_COMPLETO } from "@/lib/instagram";

// Inicia la conexión con Instagram: manda al usuario a autorizar en Instagram.
// Con ?basico=1 pide solo el permiso mínimo (lo usa el reintento del callback).
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const volverA = searchParams.get("volver") || "/app/perfil";
  const destino = `${origin}${volverA}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  if (!INSTAGRAM_CONFIGURADO) {
    return NextResponse.redirect(`${destino}?r=instagram_noconfig`);
  }

  const basico = searchParams.get("basico") === "1";
  // El state lleva quién es, si ya reintentamos y a dónde volver.
  const state = [user.id, basico ? "b" : "f", encodeURIComponent(volverA)].join("|");
  return NextResponse.redirect(buildAuthUrl(origin, state, basico ? SCOPE_BASICO : SCOPE_COMPLETO));
}
