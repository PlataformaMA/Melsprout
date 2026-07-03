import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURADO, SUPABASE_URL } from "./env";

// Rutas que requieren haber iniciado sesión.
const RUTAS_PROTEGIDAS = ["/app"];
// Rutas de autenticación (si ya iniciaste sesión, no deberías verlas).
const RUTAS_AUTH = ["/login", "/registro"];

// Refresca la sesión en cada petición y protege las rutas privadas.
// Se ejecuta en el "proxy" (antes middleware) de Next.js 16.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Si Supabase aún no está configurado, no bloqueamos nada (modo desarrollo).
  if (!SUPABASE_CONFIGURADO) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANTE: getUser() valida el token contra el servidor de Supabase.
  // No usar getSession() para decisiones de seguridad (se puede falsificar).
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return response; // Sin red / mal configurado: no bloqueamos.
  }

  const path = request.nextUrl.pathname;
  const esProtegida = RUTAS_PROTEGIDAS.some((r) => path.startsWith(r));
  const esAuth = RUTAS_AUTH.some((r) => path.startsWith(r));
  const esVerificacion = path.startsWith("/verificar");

  const irA = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = "";
    return NextResponse.redirect(url);
  };

  // Sin sesión: solo puede ver rutas públicas.
  if (!user) {
    if (esProtegida || esVerificacion) return irA("/login");
    return response;
  }

  // ===== Verificación en dos pasos (AAL) =====
  // currentLevel "aal1" = solo contraseña. nextLevel "aal2" = tiene 2FA activo
  // pero aún no lo completó en esta sesión → hay que exigir el segundo factor.
  let necesitaMFA = false;
  try {
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    necesitaMFA =
      !!aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2";
  } catch {
    // Fallo transitorio al consultar el nivel: no bloqueamos (la sesión base
    // ya fue validada). Es la única puerta que queda en nivel 1.
    necesitaMFA = false;
  }

  if (necesitaMFA) {
    // Debe completar el 2FA antes de cualquier zona privada o de auth.
    if (esProtegida || esAuth) return irA("/verificar");
    return response; // ya está en /verificar
  }

  // Ya no hace falta 2FA (o no tiene): no dejamos ver /verificar, login ni registro.
  if (esVerificacion || esAuth) return irA("/app");

  return response;
}
