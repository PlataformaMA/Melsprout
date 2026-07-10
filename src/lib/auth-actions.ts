"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { emailValido, evaluarPassword, traducirError } from "@/lib/validacion";

export type EstadoAuth = {
  error?: string;
  mensaje?: string;
};

// URL base del sitio, para armar los enlaces de los correos (confirmación, reset).
// Blindado: si la variable de entorno quedó en "localhost" pero corremos en un
// host real (producción), usamos el host real para que los enlaces no se rompan.
async function urlSitio(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  const hostReal = host && !host.includes("localhost");
  const envEsLocalhost = !!env && env.includes("localhost");

  // Prioriza el host real cuando el env está mal configurado (localhost en prod).
  if (env && !(envEsLocalhost && hostReal)) return env;
  if (host) return `${proto}://${host}`;
  return env ?? "http://localhost:3000";
}

// ===== Iniciar sesión con email + contraseña =====
export async function iniciarSesion(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!emailValido(email)) return { error: "Escribe un correo válido." };
  if (!password) return { error: "Escribe tu contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: traducirError(error.message) };

  revalidatePath("/", "layout");
  redirect("/app");
}

// ===== Crear cuenta con email + contraseña =====
export async function crearCuenta(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const acepta = formData.get("acepta") === "on";
  const noticias = formData.get("noticias") === "on";

  if (nombre.length < 2) return { error: "Escribe tu nombre completo." };
  if (!emailValido(email)) return { error: "Escribe un correo válido." };

  // Validación de contraseña en el SERVIDOR (no solo en el navegador).
  const fuerza = evaluarPassword(password);
  if (!fuerza.cumpleMinimo)
    return { error: `Tu contraseña necesita: ${fuerza.faltantes.join(", ")}.` };

  if (!acepta) return { error: "Debes aceptar los términos para continuar." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: nombre, acepta_noticias: noticias },
      emailRedirectTo: `${await urlSitio()}/auth/callback?next=/app`,
    },
  });

  if (error) return { error: traducirError(error.message) };

  return {
    mensaje:
      "¡Cuenta creada! Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja (y el spam).",
  };
}

// ===== Pedir enlace para restablecer contraseña =====
export async function pedirReset(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const email = String(formData.get("email") ?? "").trim();
  if (!emailValido(email)) return { error: "Escribe un correo válido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await urlSitio()}/auth/callback?next=/restablecer`,
  });

  // Siempre respondemos igual, exista o no la cuenta (evita filtrar qué
  // correos están registrados = protección contra enumeración de usuarios).
  return {
    mensaje:
      "Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña (válido 24 horas).",
  };
}

// ===== Guardar la nueva contraseña (tras abrir el enlace del correo) =====
export async function actualizarPassword(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const password = String(formData.get("password") ?? "");
  const fuerza = evaluarPassword(password);
  if (!fuerza.cumpleMinimo)
    return { error: `Tu contraseña necesita: ${fuerza.faltantes.join(", ")}.` };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: traducirError(error.message) };

  revalidatePath("/", "layout");
  redirect("/app");
}

// ===== Cambiar contraseña (ya con sesión iniciada, desde Configuración) =====
export async function cambiarPassword(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fuerza = evaluarPassword(password);
  if (!fuerza.cumpleMinimo)
    return { error: `Tu contraseña necesita: ${fuerza.faltantes.join(", ")}.` };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: traducirError(error.message) };

  return { mensaje: "¡Contraseña actualizada! Ya puedes usarla para entrar." };
}

// ===== Cambiar correo (envía confirmación al nuevo correo) =====
export async function cambiarCorreo(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const email = String(formData.get("email") ?? "").trim();
  if (!emailValido(email)) return { error: "Escribe un correo válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };
  if (email === user.email) return { error: "Ese ya es tu correo actual." };

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${await urlSitio()}/auth/callback?next=/app/config` }
  );
  if (error) return { error: traducirError(error.message) };

  return {
    mensaje:
      "Te enviamos un enlace de confirmación a tu correo actual y al nuevo. Confírmalo en ambos para completar el cambio.",
  };
}

// ===== Cerrar sesión =====
export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
