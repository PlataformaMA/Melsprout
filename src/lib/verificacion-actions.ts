"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { crearTokenVerificacion } from "@/lib/verificacion-token";

const FROM = "Melsprout <no-reply@boostacademy.io>";

async function urlSitio(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const hostReal = host && !host.includes("localhost");
  const envEsLocalhost = !!env && env.includes("localhost");
  if (env && !(envEsLocalhost && hostReal)) return env;
  if (host) return `${proto}://${host}`;
  return env ?? "http://localhost:3000";
}

function plantilla(nombre: string, link: string): string {
  const hola = nombre ? `¡Hola, ${nombre.split(" ")[0]}! 👋` : "¡Hola! 👋";
  return `
  <div style="background:#F5F3FB;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(60,26,107,.08);">
      <div style="padding:28px 32px 8px;font-size:18px;font-weight:800;color:#1A1A2E;">Mel<span style="color:#7C3AED;">sprout</span></div>
      <div style="padding:8px 32px 0;"><h1 style="margin:0;font-size:22px;font-weight:800;color:#1A1A2E;">Verifica tu correo electrónico</h1></div>
      <div style="padding:16px 32px 0;font-size:15px;color:#4B4B63;line-height:1.6;">
        <p style="margin:0 0 14px;">${hola}</p>
        <p style="margin:0 0 14px;">Gracias por registrarte en Melsprout.</p>
        <p style="margin:0 0 22px;">Verifica tu correo para <b>activar tu cuenta</b> y empezar a aprender en Melsprout:</p>
      </div>
      <div style="padding:0 32px;"><a href="${link}" style="display:block;text-align:center;padding:14px 24px;font-size:15px;font-weight:700;color:#fff;background:#7C3AED;text-decoration:none;border-radius:12px;">Verificar mi correo</a></div>
      <div style="padding:22px 32px 0;font-size:13px;color:#8A8AA0;line-height:1.6;">
        <p style="margin:0 0 6px;">O copia y pega este enlace:</p>
        <a href="${link}" style="color:#7C3AED;word-break:break-all;">${link}</a>
      </div>
      <div style="padding:22px 32px 28px;font-size:13px;color:#8A8AA0;line-height:1.6;">
        <p style="margin:0 0 6px;">Este enlace expira en 24 horas.</p>
        <p style="margin:0 0 14px;">Si no fuiste tú, puedes ignorar este mensaje.</p>
        <p style="margin:0;color:#4B4B63;">— El equipo de Melsprout ✨</p>
      </div>
    </div>
  </div>`;
}

// Envía el correo de verificación a un usuario concreto (se llama al registrarse).
export async function enviarVerificacionAUsuario(userId: string, email: string, nombre: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // Sin llave de Resend no enviamos (no rompe el registro).
  const link = `${await urlSitio()}/verificar-correo?token=${crearTokenVerificacion(userId)}`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [email], subject: "Verifica tu correo · Melsprout", html: plantilla(nombre, link) }),
    });
  } catch {
    // Falla de red al enviar: no bloqueamos; el usuario puede reenviar después.
  }
}

// Botón "Reenviar correo de verificación" (desde la app, si aún no verifica).
export async function reenviarVerificacion(): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Inicia sesión de nuevo." };

  const { data: perfil } = await supabase
    .from("profiles").select("email_verificado, full_name").eq("id", user.id).maybeSingle();
  if (perfil?.email_verificado) return { ok: true };

  await enviarVerificacionAUsuario(user.id, user.email, (perfil?.full_name as string) ?? "");
  return { ok: true };
}
