import { verificarSignedRequest } from "@/lib/instagram";
import { eliminarConexionPorExternalId } from "@/lib/social-store";

// Meta avisa aquí cuando un alumno quita el permiso a Melsprout desde Instagram.
// Borramos su token y sus métricas. No hay sesión: la identidad viene firmada.
export async function POST(request: Request) {
  const form = await request.formData();
  const datos = verificarSignedRequest(
    String(form.get("signed_request") ?? "")
  );
  if (!datos?.user_id) {
    return new Response("Firma inválida", { status: 400 });
  }

  await eliminarConexionPorExternalId("instagram", String(datos.user_id));
  return new Response(null, { status: 200 });
}
