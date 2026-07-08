import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// "Proxy" = lo que en versiones anteriores de Next.js se llamaba "middleware".
// Corre antes de cada petición: refresca la sesión y protege /app.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Todas las rutas menos archivos estáticos, imágenes y .txt
    // (los .txt de verificación se sirven directo, sin pasar por aquí).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
