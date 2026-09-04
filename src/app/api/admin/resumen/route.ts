import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

// Diagnóstico del Resumen: llama al mismo cálculo y devuelve el error real,
// que en la pantalla queda oculto. Solo para administradoras.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) {
    return NextResponse.json({ error: "no autorizado" }, { status: 403 });
  }
  try {
    const { getResumen } = await import("@/lib/superadmin-actions");
    const r = await getResumen("7d");
    return NextResponse.json({ llamada: "ok", resultado: r });
  } catch (e) {
    return NextResponse.json({
      llamada: "lanzó excepción",
      nombre: e instanceof Error ? e.name : typeof e,
      mensaje: e instanceof Error ? e.message : String(e),
      digest: (e as { digest?: string })?.digest ?? null,
      stack: e instanceof Error ? (e.stack || "").split("\n").slice(0, 14) : [],
    });
  }
}
