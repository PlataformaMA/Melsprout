"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BACKUP_CONFIGURADO } from "@/lib/supabase/env";
import { cifrarCodigo, coincide, generarCodigo, normalizar } from "@/lib/codigos-util";

const CANTIDAD = 10;

type FactorLite = { id: string; factor_type: string; status: string };

// Cuántos códigos de respaldo sin usar tiene el usuario (para mostrar en pantalla).
export async function contarCodigos(): Promise<number> {
  if (!BACKUP_CONFIGURADO) return 0;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const admin = createAdminClient();
  const { count } = await admin
    .from("backup_codes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("used_at", null);
  return count ?? 0;
}

// Genera (o regenera) 10 códigos. Requiere sesión de NIVEL 2 (2FA completado),
// para que un atacante con solo la contraseña no pueda crear/leer códigos.
export async function generarCodigos(): Promise<
  { codigos: string[] } | { error: string }
> {
  if (!BACKUP_CONFIGURADO)
    return { error: "Los códigos de respaldo aún no están configurados." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  // Exigir AAL2 (2FA completado en esta sesión).
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return {
      error:
        "Completa la verificación en dos pasos antes de generar códigos de respaldo.",
    };
  }

  const admin = createAdminClient();
  // Invalida los códigos anteriores (los viejos dejan de servir).
  await admin.from("backup_codes").delete().eq("user_id", user.id);

  const codigos: string[] = [];
  const filas = [];
  for (let i = 0; i < CANTIDAD; i++) {
    const codigo = generarCodigo();
    codigos.push(codigo);
    const { salt, hash } = cifrarCodigo(normalizar(codigo));
    filas.push({ user_id: user.id, salt, code_hash: hash });
  }

  const { error } = await admin.from("backup_codes").insert(filas);
  if (error) return { error: "No se pudieron guardar los códigos." };

  revalidatePath("/app/seguridad");
  return { codigos };
}

// Usar un código de respaldo cuando NO se tiene el autenticador.
// El usuario ya pasó la contraseña (nivel 1); el código es su segundo factor.
// Al validarlo, quitamos el 2FA (recuperación) para que pueda entrar y
// reconfigurarlo. Cada código sirve una sola vez.
export async function usarCodigo(
  codigoIngresado: string
): Promise<{ ok: true } | { error: string }> {
  if (!BACKUP_CONFIGURADO)
    return { error: "Los códigos de respaldo no están configurados." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Inicia sesión de nuevo." };

  const norm = normalizar(codigoIngresado);
  if (norm.length < 10) return { error: "Código inválido." };

  const admin = createAdminClient();
  const { data: filas } = await admin
    .from("backup_codes")
    .select("id, salt, code_hash")
    .eq("user_id", user.id)
    .is("used_at", null);

  if (!filas || filas.length === 0) {
    return { error: "No tienes códigos de respaldo disponibles." };
  }

  // Comparación en tiempo constante contra cada código sin usar.
  const fila = filas.find((f) => coincide(norm, f.salt, f.code_hash));
  if (!fila) return { error: "Código incorrecto. Revisa e inténtalo de nuevo." };

  // Marca el código como usado (un solo uso).
  await admin
    .from("backup_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", fila.id);

  // Recuperación: quita los factores 2FA para que pueda entrar y reconfigurar.
  const { data: factores } = await supabase.auth.mfa.listFactors();
  for (const f of (factores?.all ?? []) as FactorLite[]) {
    if (f.factor_type === "totp") {
      await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: user.id });
    }
  }

  // Limpia los códigos restantes (ya no hay 2FA que proteger).
  await admin.from("backup_codes").delete().eq("user_id", user.id);

  revalidatePath("/", "layout");
  return { ok: true };
}
