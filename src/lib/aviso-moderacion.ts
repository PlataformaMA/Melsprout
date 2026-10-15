import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { remitenteCorreo } from "@/lib/remitente";

// Correo al equipo cuando queda algo por revisar en la comunidad.
//
// Es un RESUMEN con espera, no un correo por comentario: en un día con
// movimiento llegarían decenas y acabarían en la papelera sin abrirse. Se manda
// como mucho uno cada dos horas, y dice cuántas cosas esperan en total.
//
// A quién le llega: si hay que cambiar la lista, es esta constante.
const DESTINATARIOS = ["nancy@boostacademy.io", "alexia@boostacademy.io"];

// Minutos entre un correo y el siguiente.
const ESPERA_MIN = 120;

// La hora del último aviso vive en ajustes_plataforma, que ya es el cajón de
// llave/valor de la plataforma: así no hace falta una tabla nueva.
const CLAVE = "aviso_moderacion_at";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL || "https://melsprout.boostacademy.io";

// Lo NUEVO desde el último aviso, no el montón acumulado: el correo avisa de
// lo que acaba de llegar, no del rezago histórico (que son cientos y solo
// desanima). El total se menciona aparte, como contexto.
async function pendientes(
  admin: ReturnType<typeof createAdminClient>,
  desde: string,
): Promise<{ nuevas: number; total: number }> {
  const tablas = ["clase_comentarios", "foros_posts", "foros_respuestas", "comunidad_reto_posts"];
  let nuevas = 0;
  let total = 0;
  for (const t of tablas) {
    const [{ count: n }, { count: tot }] = await Promise.all([
      admin.from(t).select("id", { count: "exact", head: true })
        .eq("estado", "pendiente").gte("created_at", desde),
      admin.from(t).select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    ]);
    nuevas += n ?? 0;
    total += tot ?? 0;
  }
  return { nuevas, total };
}

export async function avisarPorCorreoModeracion(): Promise<void> {
  const llave = process.env.RESEND_API_KEY;
  const remitente = remitenteCorreo();
  if (!llave || !remitente || DESTINATARIOS.length === 0) return;

  try {
    const admin = createAdminClient();

    // ¿Ya se avisó hace poco? Entonces no se vuelve a molestar.
    const { data: ajuste } = await admin
      .from("ajustes_plataforma").select("valor").eq("clave", CLAVE).maybeSingle();
    const ultimo = ajuste?.valor ? Date.parse(String(ajuste.valor)) : 0;
    if (Number.isFinite(ultimo) && Date.now() - ultimo < ESPERA_MIN * 60_000) return;

    // Sin aviso previo se mira el último día: así el primer correo habla de
    // lo de hoy y no del rezago de meses.
    const desde = ultimo
      ? new Date(ultimo).toISOString()
      : new Date(Date.now() - 24 * 3600_000).toISOString();
    const { nuevas, total } = await pendientes(admin, desde);
    if (nuevas === 0) return;

    // Se marca ANTES de mandar: si el correo falla, mejor perder un aviso que
    // mandar diez porque el contador se quedó atrás.
    await admin.from("ajustes_plataforma")
      .upsert({ clave: CLAVE, valor: new Date().toISOString() }, { onConflict: "clave" });

    const cosas = nuevas === 1 ? "1 publicación nueva" : `${nuevas} publicaciones nuevas`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${llave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: remitente,
        to: DESTINATARIOS,
        subject: `Tienes ${cosas} por revisar en Melsprout`,
        html: plantilla(nuevas, total),
      }),
    });
  } catch {
    // Un aviso que no sale nunca debe tumbar la publicación de una alumna.
  }
}

function plantilla(n: number, total: number): string {
  const cosas = n === 1 ? "una publicación nueva" : `${n} publicaciones nuevas`;
  const verbo = n === 1 ? "espera" : "esperan";
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f7f7f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:20px;padding:30px 28px">
        <tr><td style="font-size:13px;font-weight:700;color:#7C3AED;letter-spacing:.4px">MELSPROUT · MODERACIÓN</td></tr>
        <tr><td style="font-size:22px;font-weight:800;color:#111827;padding-top:8px;line-height:1.25">
          Hay ${cosas} por revisar
        </td></tr>
        <tr><td style="font-size:15px;color:#4B5563;padding-top:12px;line-height:1.6">
          ${n === 1 ? "Una alumna dejó algo" : "Las alumnas dejaron cosas"} en la comunidad que ${verbo} tu respuesta o tu visto bueno.
          Desde el panel puedes aprobarlas, responder en el mismo hilo y ver las fotos que mandaron.
        </td></tr>
        <tr><td style="padding-top:22px">
          <a href="${SITIO}/app/admin"
             style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px">
            Ir a moderar
          </a>
        </td></tr>
        ${total > n ? `<tr><td style="font-size:13px;color:#6B7280;padding-top:14px;line-height:1.6">
          En total quedan <b style="color:#374151">${total}</b> publicaciones pendientes, contando las de días anteriores.
        </td></tr>` : ""}
        <tr><td style="font-size:12.5px;color:#9CA3AF;padding-top:22px;line-height:1.6">
          Este aviso se manda como mucho una vez cada ${ESPERA_MIN / 60} horas, aunque lleguen más publicaciones.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
