import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL || "https://melsprout.boostacademy.io";

// Correo de bienvenida: distinto al de verificación. Este orienta a quien
// entra por primera vez. Se manda con Resend si hay llave; si no, la persona
// igual recibe la bienvenida dentro de la plataforma.
function plantilla(nombre: string): string {
  const hola = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#FAF9FE;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px">
    <div style="background:#fff;border:1px solid #EDE9F7;border-radius:24px;overflow:hidden">
      <div style="background:linear-gradient(120deg,#F3F0FF,#FBFAFF);padding:28px 26px;text-align:center">
        <img src="${SITIO}/octi.png" alt="" width="96" style="display:block;margin:0 auto 10px">
        <h1 style="margin:0;font-size:22px;color:#7C3AED">${hola} Bienvenida a Melsprout 💜</h1>
      </div>
      <div style="padding:24px 26px;color:#3F3D46;font-size:15px;line-height:1.6">
        <p style="margin:0 0 14px">Ya tienes tu lugar. Aquí vas a aprender a crear contenido que conecta, con clases,
        retos y una comunidad que va contigo.</p>

        <p style="margin:0 0 8px;font-weight:700;color:#1F2937">Para empezar bien:</p>
        <ol style="margin:0 0 18px;padding-left:20px">
          <li style="margin-bottom:6px"><b>Completa tu perfil.</b> Foto, tu profesión y una descripción corta.</li>
          <li style="margin-bottom:6px"><b>Ve tu primera clase.</b> Al terminarla ganas tus primeros XP.</li>
          <li style="margin-bottom:6px"><b>Haz su reto.</b> Ahí es donde de verdad se aprende.</li>
          <li><b>Preséntate en la comunidad.</b> Encontrarás a otras creadoras como tú.</li>
        </ol>

        <p style="margin:0 0 20px">Entra todos los días y mantén tu racha 🔥 — se activa sola cada vez que
        completas algo.</p>

        <a href="${SITIO}/app/ruta" style="display:block;background:#7C3AED;color:#fff;text-decoration:none;
          font-weight:700;text-align:center;border-radius:16px;padding:14px 0;font-size:15px">
          Empezar mi ruta
        </a>

        <p style="margin:20px 0 0;font-size:13px;color:#8A8794">¿Dudas? Responde este correo y te ayudamos.</p>
      </div>
    </div>
    <p style="text-align:center;color:#9AA0AD;font-size:12px;margin:16px 0 0">Melsprout · Marketing con Melissa</p>
  </div>
</body></html>`;
}

export async function darBienvenida(userId: string, email: string | null, nombre: string): Promise<void> {
  const admin = createAdminClient();

  // Una sola vez por persona.
  const { count } = await admin
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .ilike("titulo", "%Bienvenida a Melsprout%");
  if ((count ?? 0) > 0) return;

  await admin.from("notificaciones").insert({
    user_id: userId,
    tipo: "general",
    titulo: "¡Bienvenida a Melsprout! 💜",
    cuerpo: "Completa tu perfil, ve tu primera clase y preséntate en la comunidad. Aquí empieza tu ruta.",
    href: "/app/ruta",
  });

  // El correo solo sale si hay proveedor configurado.
  const llave = process.env.RESEND_API_KEY;
  const remitente = process.env.CORREO_REMITENTE;
  if (!llave || !remitente || !email) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${llave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: remitente,
        to: email,
        subject: "¡Bienvenida a Melsprout! 💜",
        html: plantilla(nombre),
      }),
    });
  } catch {
    // Si el correo falla, la bienvenida dentro de la plataforma ya se dio.
  }
}
