"use server";

import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { remitenteCorreo } from "@/lib/remitente";
import { emailValido } from "@/lib/validacion";

const SITIO = (() => {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) return env;
  return "https://melsprout.boostacademy.io";
})();
const SOPORTE = "https://boostacademy-n8n.n6e5xe.easypanel.host/webhook/83e6b04f-98b3-423e-94e4-2b64ceb8dbe4";

// "Olvidé mi contraseña": el correo sale por Resend (el remitente de Supabase
// está limitado a 2 correos por hora y casi nunca llegaba). El enlace es
// nuestro (/activar) y dura 24 h; al tocar el botón se genera el acceso.
// Siempre responde igual, exista o no la cuenta (no filtra correos registrados).
export async function pedirEnlaceRecuperacion(emailCrudo: string): Promise<{ ok: true } | { error: string }> {
  const email = emailCrudo.trim().toLowerCase();
  if (!emailValido(email)) return { error: "Escribe un correo válido." };

  const llave = process.env.RESEND_API_KEY;
  const remitente = remitenteCorreo();
  if (!llave || !remitente) return { error: "El correo no está configurado. Escríbenos a soporte." };

  const admin = createAdminClient();
  // generateLink es la forma de obtener el id de usuario a partir del correo.
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const userId = link?.user?.id;
  if (error || !userId) return { ok: true };

  const token = randomBytes(24).toString("hex");
  const { error: eTok } = await admin.from("activaciones")
    .insert({ token_hash: createHash("sha256").update(token).digest("hex"), user_id: userId, tipo: "recuperacion" });
  if (eTok) return { error: "No se pudo generar el enlace. Inténtalo de nuevo." };

  const enlace = `${SITIO}/activar?k=${token}&e=${encodeURIComponent(email)}&r=1`;
  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#FAF9FE;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px">
    <div style="background:#fff;border:1px solid #EDE9F7;border-radius:24px;overflow:hidden">
      <div style="background:linear-gradient(120deg,#F3F0FF,#FBFAFF);padding:28px 26px;text-align:center">
        <img src="${SITIO}/octi.png" alt="" width="88" style="display:block;margin:0 auto 10px">
        <h1 style="margin:0;font-size:21px;color:#7C3AED">Restablece tu contraseña 🔑</h1>
      </div>
      <div style="padding:24px 26px;color:#3F3D46;font-size:15px;line-height:1.6">
        <p style="margin:0 0 16px">Recibimos una solicitud para cambiar la contraseña de tu cuenta en Melsprout.
        Toca el botón y elige una nueva. El enlace vale 24 horas.</p>
        <a href="${enlace}" style="display:block;background:#7C3AED;color:#fff;text-decoration:none;
          font-weight:700;text-align:center;border-radius:16px;padding:14px 0;font-size:15px">
          Crear nueva contraseña
        </a>
        <p style="margin:18px 0 0;font-size:13px;color:#8A8794">Si el botón no abre, copia este enlace:<br>
        <span style="word-break:break-all;color:#7C3AED">${enlace}</span></p>
        <p style="margin:18px 0 0;font-size:13px;color:#8A8794">Si tú no lo pediste, ignora este correo: tu contraseña no cambia.</p>
        <p style="margin:18px 0 0;font-size:13px;color:#8A8794">¿Algún problema?
          <a href="${SOPORTE}" style="color:#7C3AED;font-weight:700;text-decoration:none">Contacta a nuestro equipo de soporte</a>.</p>
      </div>
    </div>
    <p style="text-align:center;color:#9AA0AD;font-size:12px;margin:16px 0 0">Melsprout · Marketing con Melissa</p>
  </div>
</body></html>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${llave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: remitente, to: email, subject: "Restablece tu contraseña en Melsprout 🔑", html }),
    });
    if (!r.ok) return { error: "No se pudo enviar el correo. Inténtalo de nuevo." };
  } catch {
    return { error: "No se pudo enviar el correo. Inténtalo de nuevo." };
  }
  return { ok: true };
}
