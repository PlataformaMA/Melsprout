import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";
import { getResumen, type Rango } from "@/lib/superadmin-actions";

// El resumen del panel se pide por aquí y no como acción de servidor: una
// petición normal no depende de la versión del paquete que tenga el navegador,
// así que un despliegue nuevo no la rompe.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) {
    return NextResponse.json({ ok: false, motivo: "Tu cuenta no tiene permiso de administradora." }, { status: 403 });
  }

  const p = new URL(request.url).searchParams.get("rango");
  const rango: Rango = p === "hoy" || p === "30d" ? p : "7d";

  try {
    return NextResponse.json(await getResumen(rango));
  } catch (e) {
    return NextResponse.json({
      ok: false,
      motivo: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    });
  }
}
