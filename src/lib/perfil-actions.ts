"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  pais: string | null;
  fecha_nacimiento: string | null;
  whatsapp: string | null;
  whatsapp_optin: boolean;
  nicho: string | null;
  objetivo: string | null;
  plataforma_principal: string | null;
  tamano_audiencia: string | null;
  redes: Record<string, string>;
  onboarding_completo: boolean;
  etapa: string;
  xp: number;
  gemas: number;
  racha: number;
};

// Datos que llegan del onboarding.
export type DatosOnboarding = {
  pais?: string;
  fecha_nacimiento?: string;
  whatsapp?: string;
  whatsapp_optin?: boolean;
  nicho: string;
  objetivo: string;
  plataforma_principal: string;
  tamano_audiencia: string;
  redes?: Record<string, string>;
};

const XP_BIENVENIDA = 50;

// Lee el perfil del usuario actual.
export async function getPerfil(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data as Perfil;
}

// Guarda el onboarding: datos + marca completo + suma los +50 XP de bienvenida.
export async function guardarOnboarding(
  datos: DatosOnboarding
): Promise<{ ok: true; xp: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  // ¿Ya lo hizo antes? No volvemos a dar XP.
  const { data: actual } = await supabase
    .from("profiles")
    .select("onboarding_completo, xp")
    .eq("id", user.id)
    .single();

  const yaCompleto = actual?.onboarding_completo === true;
  const xpBase = actual?.xp ?? 0;
  const nuevoXP = yaCompleto ? xpBase : xpBase + XP_BIENVENIDA;

  const { error } = await supabase
    .from("profiles")
    .update({
      pais: datos.pais ?? null,
      fecha_nacimiento: datos.fecha_nacimiento || null,
      whatsapp: datos.whatsapp || null,
      whatsapp_optin: !!datos.whatsapp_optin,
      nicho: datos.nicho,
      objetivo: datos.objetivo,
      plataforma_principal: datos.plataforma_principal,
      tamano_audiencia: datos.tamano_audiencia,
      redes: datos.redes ?? {},
      onboarding_completo: true,
      xp: nuevoXP,
    })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/", "layout");
  return { ok: true, xp: nuevoXP };
}
