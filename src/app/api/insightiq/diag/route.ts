import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

// Diagnóstico para el equipo: dice si las variables están presentes (nunca su
// valor). Cerrado a admins: la configuración interna no es asunto público.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) {
    return NextResponse.json({ ok: false, error: "no_autorizado" }, { status: 404 });
  }
  return NextResponse.json({
    configured:
      !!process.env.INSIGHTIQ_CLIENT_ID && !!process.env.INSIGHTIQ_CLIENT_SECRET,
    env: process.env.INSIGHTIQ_ENV || null,
    client_id_len: (process.env.INSIGHTIQ_CLIENT_ID || "").length,
    secret_len: (process.env.INSIGHTIQ_CLIENT_SECRET || "").length,
  });
}
