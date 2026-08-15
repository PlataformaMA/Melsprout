import crypto from "node:crypto";
import { verificarSignedRequest } from "@/lib/instagram";
import { eliminarConexionPorExternalId } from "@/lib/social-store";
import { siteBase } from "@/lib/site-url";

// Meta avisa aquí cuando un alumno pide desde Instagram que borremos sus datos.
// Borramos la conexión y devolvemos, como exige Meta, una URL de seguimiento y
// un código con el que el alumno puede consultar el estado de su solicitud.
export async function POST(request: Request) {
  const form = await request.formData();
  const datos = verificarSignedRequest(
    String(form.get("signed_request") ?? "")
  );
  if (!datos?.user_id) {
    return new Response("Firma inválida", { status: 400 });
  }

  const externalId = String(datos.user_id);
  await eliminarConexionPorExternalId("instagram", externalId);

  // Código estable por cuenta: el mismo id siempre da el mismo código, así que
  // el alumno puede volver a consultarlo. No revela el id (va por HMAC).
  const codigo = crypto
    .createHmac("sha256", process.env.INSTAGRAM_APP_SECRET || "")
    .update(`instagram:${externalId}`)
    .digest("hex")
    .slice(0, 16);

  const base = siteBase(new URL(request.url).origin);
  return Response.json({
    url: `${base}/eliminar-datos?codigo=${codigo}`,
    confirmation_code: codigo,
  });
}
