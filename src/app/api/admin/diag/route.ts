import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS, esAdmin, esAdminUsuario } from "@/lib/admin";

// Diagnóstico SEGURO: lee TU sesión (al navegar directo) y dice si te reconoce
// como admin. No expone secretos ni datos de otros usuarios (solo tu propia sesión).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({
    build: "mobile-nav-v4",
    logueado: !!user,
    tuCorreo: user?.email ?? null,
    esAdminPorCorreo: esAdmin(user?.email),
    esAdminReal: user ? await esAdminUsuario(user.id, user.email) : false,
    adminEmailsCount: ADMIN_EMAILS.length,
  });
}
