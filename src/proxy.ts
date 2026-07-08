import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Firma de verificación de TikTok. La servimos DIRECTAMENTE desde el proxy para
// evitar la redirección de doble diagonal que hace que el verificador de TikTok
// (que no sigue redirecciones) no encuentre el archivo.
const TIKTOK_SIG_FILE = "tiktoka1AkfFbo7pEtcTCcbd2KoSnSkAOGSKmm";
const TIKTOK_SIG_BODY =
  "tiktok-developers-site-verification=a1AkfFbo7pEtcTCcbd2KoSnSkAOGSKmm";

// "Proxy" = lo que en versiones anteriores de Next.js se llamaba "middleware".
export async function proxy(request: NextRequest) {
  // Responder la verificación de TikTok sin importar cuántas diagonales traiga.
  if (request.url.includes(TIKTOK_SIG_FILE)) {
    return new NextResponse(TIKTOK_SIG_BODY, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Todas las rutas menos archivos estáticos e imágenes.
    // (Ojo: SÍ incluimos .txt para poder servir la verificación de TikTok.)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
