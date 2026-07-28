import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Aquí regresan: el login social (Google/Facebook), el enlace de confirmación
// de correo y el enlace de restablecer contraseña.
// - Enlaces de correo (confirmar/recuperar): traen `token_hash` + `type` → verifyOtp
//   (método confiable, funciona en cualquier navegador/computadora).
// - Login social (PKCE): trae `code` → exchangeCodeForSession.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/app";

  const supabase = await createClient();

  // 1) Enlaces de correo (signup, email_change, magiclink…)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      // Enlace inválido o expirado → pantalla dedicada.
      return NextResponse.redirect(`${origin}/enlace-expirado`);
    }
    // La recuperación de contraseña continúa a crear la nueva; el resto muestra
    // la pantalla "¡Correo verificado!".
    if (type === "recovery") return NextResponse.redirect(`${origin}/restablecer`);
    return NextResponse.redirect(`${origin}/verificado`);
  }

  // 2) Login social u otros flujos con código (PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=enlace`);
  }

  // Sin token ni código válido: enlace inválido o expirado.
  return NextResponse.redirect(`${origin}/enlace-expirado`);
}
