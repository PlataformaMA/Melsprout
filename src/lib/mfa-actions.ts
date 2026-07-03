"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ===== Verificación en dos pasos (2FA / MFA) con app autenticadora (TOTP) =====
// Toda la validación de códigos ocurre en el servidor de Supabase.

export type EstadoMFA = {
  activo: boolean; // ¿tiene un factor TOTP verificado?
  factorId?: string;
};

type Factor = {
  id: string;
  factor_type: string;
  status: "verified" | "unverified";
};

// ¿El usuario ya tiene el 2FA activado?
export async function estadoMFA(): Promise<EstadoMFA> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return { activo: false };

  const todos = (data.all ?? []) as Factor[];
  const verificado = todos.find(
    (f) => f.factor_type === "totp" && f.status === "verified"
  );
  return { activo: !!verificado, factorId: verificado?.id };
}

// Paso 1 de activar: genera el código QR para escanear con la app.
export async function iniciarEnrolamiento(): Promise<
  { qr: string; secret: string; factorId: string } | { error: string }
> {
  const supabase = await createClient();

  // Limpieza: elimina factores TOTP a medio configurar (sin verificar),
  // así el usuario nunca queda bloqueado ni con basura acumulada.
  const { data: lista } = await supabase.auth.mfa.listFactors();
  const todos = (lista?.all ?? []) as Factor[];
  for (const f of todos) {
    if (f.factor_type === "totp" && f.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Autenticador Melsprout",
  });
  if (error || !data) {
    return { error: "No se pudo iniciar la activación. Inténtalo de nuevo." };
  }

  return {
    qr: data.totp.qr_code, // imagen SVG lista para <img src>
    secret: data.totp.secret, // código manual por si no puede escanear
    factorId: data.id,
  };
}

// Paso 2 de activar: confirma con el código de 6 dígitos de la app.
export async function confirmarEnrolamiento(
  factorId: string,
  codigo: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { data: reto, error: errReto } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (errReto || !reto) {
    return { error: "No se pudo verificar. Inténtalo de nuevo." };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: reto.id,
    code: codigo.trim(),
  });
  if (error) {
    return {
      error: "Código incorrecto o expirado. Revisa tu app e inténtalo de nuevo.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// En el login: valida el código para elevar la sesión a nivel 2 (AAL2).
export async function verificarLogin(
  codigo: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { data: lista, error: errLista } =
    await supabase.auth.mfa.listFactors();
  if (errLista || !lista) {
    return { error: "No pudimos comprobar tu 2FA. Inténtalo de nuevo." };
  }
  const totp = (lista.all ?? []).find(
    (f) => (f as Factor).factor_type === "totp" && (f as Factor).status === "verified"
  ) as Factor | undefined;
  if (!totp) return { error: "No tienes verificación en dos pasos configurada." };

  const { data: reto, error: errReto } = await supabase.auth.mfa.challenge({
    factorId: totp.id,
  });
  if (errReto || !reto) {
    return { error: "No se pudo generar el reto. Inténtalo de nuevo." };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: reto.id,
    code: codigo.trim(),
  });
  if (error) {
    return { error: "Código incorrecto o expirado. Inténtalo de nuevo." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Desactivar el 2FA (requiere estar ya con sesión de nivel 2).
export async function desactivarMFA(
  factorId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) {
    return { error: "No se pudo desactivar. Inténtalo de nuevo." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
