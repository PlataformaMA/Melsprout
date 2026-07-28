import { NextResponse } from "next/server";
import { validarTokenVerificacion } from "@/lib/verificacion-token";
import { createAdminClient } from "@/lib/supabase/admin";

// Se llega desde el enlace del correo de verificación (token firmado). Si es
// válido, marca el perfil como verificado y muestra "¡Correo verificado!".
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  const datos = validarTokenVerificacion(token);
  if (!datos) return NextResponse.redirect(`${origin}/enlace-expirado`);

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ email_verificado: true })
    .eq("id", datos.userId);
  if (error) return NextResponse.redirect(`${origin}/enlace-expirado`);

  return NextResponse.redirect(`${origin}/verificado`);
}
