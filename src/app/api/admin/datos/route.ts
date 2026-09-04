import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";
import { listarClasesAdmin } from "@/lib/clases-admin-actions";
import { listarRetosRuta, listarRetosComunidadAdmin } from "@/lib/retos-admin-actions";
import { getComunidadAdmin, listarSugerencias } from "@/lib/comunidad-admin-actions";
import { listarModeracion, type Ambito } from "@/lib/moderacion-actions";
import { listarEstudiantes } from "@/lib/estudiantes-actions";
import { listarVivoAdmin } from "@/lib/vivo-admin-actions";

// Los datos del panel se piden por aquí, con una petición normal. Antes iban
// como acciones de servidor, que caducan al desplegar y dejaban las pantallas
// vacías sin decir nada.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) {
    return NextResponse.json({ error: "no autorizado" }, { status: 403 });
  }

  const p = new URL(request.url).searchParams;
  const que = p.get("que");

  try {
    switch (que) {
      case "clases":       return NextResponse.json(await listarClasesAdmin());
      case "retos":        return NextResponse.json(await listarRetosRuta());
      case "retos-comunidad": return NextResponse.json(await listarRetosComunidadAdmin());
      case "comunidad":    return NextResponse.json(await getComunidadAdmin());
      case "sugerencias":  return NextResponse.json(await listarSugerencias());
      case "estudiantes":  return NextResponse.json(await listarEstudiantes());
      case "vivo":         return NextResponse.json(await listarVivoAdmin());
      case "moderacion": {
        const a = p.get("ambito");
        const ambito: Ambito = a === "especiales" || a === "comunidad" ? a : "ruta";
        return NextResponse.json(await listarModeracion(ambito));
      }
      default:
        return NextResponse.json({ error: "sección desconocida" }, { status: 400 });
    }
  } catch (e) {
    console.error("[api/admin/datos]", que, e);
    return NextResponse.json(
      { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) },
      { status: 500 },
    );
  }
}
