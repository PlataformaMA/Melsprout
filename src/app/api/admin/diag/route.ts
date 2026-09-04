import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS, esAdmin, esAdminUsuario } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Diagnóstico SEGURO: lee TU sesión (al navegar directo) y dice si te reconoce
// como admin. No expone secretos ni datos de otros usuarios (solo tu propia sesión).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ¿La llave de servicio existe y sirve? Solo devuelve sí/no, nunca su valor.
  let llaveServicio: string;
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      llaveServicio = "FALTA la variable";
    } else {
      const admin = createAdminClient();
      const { error } = await admin.from("profiles").select("id").limit(1);
      llaveServicio = error ? `no sirve: ${error.message}` : "ok";
    }
  } catch (e) {
    llaveServicio = `revienta: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    llaveServicio,
    build: "mobile-nav-v4",
    logueado: !!user,
    tuCorreo: user?.email ?? null,
    esAdminPorCorreo: esAdmin(user?.email),
    esAdminReal: user ? await esAdminUsuario(user.id, user.email) : false,
    adminEmailsCount: ADMIN_EMAILS.length,
    // Solo dice si la variable existe, nunca su valor.
    integraciones: {
      instagram: !!process.env.INSTAGRAM_APP_ID && !!process.env.INSTAGRAM_APP_SECRET,
      tiktok: !!process.env.TIKTOK_CLIENT_KEY && !!process.env.TIKTOK_CLIENT_SECRET,
      youtube: !!process.env.YOUTUBE_CLIENT_ID && !!process.env.YOUTUBE_CLIENT_SECRET,
      sitio: process.env.NEXT_PUBLIC_SITE_URL || null,
    },
  });
}
