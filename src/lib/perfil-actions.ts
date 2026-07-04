"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// Editar el perfil (desde la página "Mi perfil"). No toca XP/gemas/racha.
export type EdicionPerfil = {
  full_name: string;
  pais?: string;
  fecha_nacimiento?: string;
  whatsapp?: string;
  whatsapp_optin?: boolean;
  nicho?: string;
  objetivo?: string;
  plataforma_principal?: string;
  tamano_audiencia?: string;
};

export async function actualizarPerfil(
  datos: EdicionPerfil
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  if (!datos.full_name || datos.full_name.trim().length < 2)
    return { error: "Escribe tu nombre." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: datos.full_name.trim(),
      pais: datos.pais || null,
      fecha_nacimiento: datos.fecha_nacimiento || null,
      whatsapp: datos.whatsapp || null,
      whatsapp_optin: !!datos.whatsapp_optin,
      nicho: datos.nicho || null,
      objetivo: datos.objetivo || null,
      plataforma_principal: datos.plataforma_principal || null,
      tamano_audiencia: datos.tamano_audiencia || null,
    })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Subir foto de perfil. Recibe la imagen ya reducida (dataURL) desde el navegador,
// la sube al bucket "avatars" con la llave de servidor y guarda la URL.
export async function subirAvatar(
  dataUrl: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return { error: "Formato de imagen no válido." };
  const contentType = m[1];
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > 2_000_000) return { error: "La imagen es muy grande." };

  const ext = contentType.split("/")[1];
  const path = `${user.id}/avatar.${ext}`;

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType, upsert: true });
  if (upErr) return { error: "No se pudo subir la imagen." };

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  // Cache-busting para que se vea la nueva foto al instante.
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (dbErr) return { error: "No se pudo guardar la foto." };

  revalidatePath("/", "layout");
  return { url };
}
