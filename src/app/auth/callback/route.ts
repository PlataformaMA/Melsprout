import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Aquí regresan: el login social (Google/Facebook), el enlace de confirmación
// de correo y el enlace de restablecer contraseña. Intercambiamos el "código"
// temporal por una sesión real y guardamos las cookies seguras.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Algo falló: de vuelta al login con un aviso.
  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
