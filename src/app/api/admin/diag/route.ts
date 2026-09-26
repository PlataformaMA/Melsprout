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

  // Solo el equipo: antes cualquiera podía consultarlo sin sesión.
  if (!user || !(await esAdminUsuario(user.id, user.email))) {
    return NextResponse.json({ ok: false, error: "no_autorizado" }, { status: 404 });
  }

  // ¿La llave de Resend sirve? Se le pregunta al proveedor, sin exponer su valor.
  let resend: string;
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) resend = "FALTA la variable";
    else {
      const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
      const cuerpo = r.ok ? "" : (await r.text()).slice(0, 160);
      resend = r.ok || cuerpo.includes("restricted_api_key")
        ? `ok · llave válida con permiso de envío (termina en …${key.slice(-4)})`
        : `RECHAZADA por Resend: HTTP ${r.status} · ${cuerpo}`;
    }
  } catch (e) {
    resend = "no se pudo consultar: " + String(e).slice(0, 80);
  }

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
    resend,
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
      // Correos: verificación y bienvenida salen por Resend.
      correo: !!process.env.RESEND_API_KEY,
      remitente: process.env.CORREO_REMITENTE || null,
      subtitulos: !!process.env.ASSEMBLYAI_API_KEY,
    },
  });
}
