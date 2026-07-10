"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Perfil = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  headline: string | null;
  bio: string | null;
  ciudad: string | null;
  especialidades: string[];
  abierto_colab: boolean;
  pais: string | null;
  fecha_nacimiento: string | null;
  whatsapp: string | null;
  whatsapp_optin: boolean;
  nicho: string | null;
  objetivo: string | null;
  plataforma_principal: string | null;
  tamano_audiencia: string | null;
  redes: Record<string, string>;
  metricas: Record<string, { followers?: number; username?: string; updated_at?: string }>;
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
  headline?: string;
  bio?: string;
  ciudad?: string;
  abierto_colab?: boolean;
  redes?: Record<string, string>;
  pais?: string;
  fecha_nacimiento?: string;
  whatsapp?: string;
  whatsapp_optin?: boolean;
  nicho?: string;
  objetivo?: string;
  plataforma_principal?: string;
  tamano_audiencia?: string;
};

// Limpia un @ de red social: sin espacios, sin @, sin URL.
function limpiarHandle(v?: string): string {
  if (!v) return "";
  return v.trim().replace(/^@+/, "").replace(/\s+/g, "").slice(0, 40);
}

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

  const redes: Record<string, string> = {};
  for (const k of ["instagram", "tiktok", "youtube"]) {
    const h = limpiarHandle(datos.redes?.[k]);
    if (h) redes[k] = h;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: datos.full_name.trim(),
      headline: datos.headline?.trim().slice(0, 80) || null,
      bio: datos.bio?.trim().slice(0, 400) || null,
      ciudad: datos.ciudad?.trim().slice(0, 60) || null,
      abierto_colab: datos.abierto_colab ?? true,
      redes,
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

// Cambia o quita el nicho desde el chip del perfil.
export async function guardarNicho(
  nicho: string | null
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const { error } = await supabase
    .from("profiles")
    .update({ nicho: nicho ? nicho.trim().slice(0, 40) : null })
    .eq("id", user.id);
  if (error) return { error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Sube una imagen (avatar o portada) al bucket "avatars" con la llave de
// servidor y guarda su URL en el perfil. La imagen llega ya reducida del navegador.
async function subirImagen(
  dataUrl: string,
  tipo: "avatar" | "cover"
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
  if (buffer.length > 3_000_000) return { error: "La imagen es muy grande." };

  const ext = contentType.split("/")[1];
  const path = `${user.id}/${tipo}.${ext}`;

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType, upsert: true });
  if (upErr) return { error: "No se pudo subir la imagen." };

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`; // anti-caché

  const columna = tipo === "avatar" ? "avatar_url" : "cover_url";
  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ [columna]: url })
    .eq("id", user.id);
  if (dbErr) return { error: "No se pudo guardar la imagen." };

  revalidatePath("/", "layout");
  return { url };
}

export async function subirAvatar(dataUrl: string) {
  return subirImagen(dataUrl, "avatar");
}
export async function subirCover(dataUrl: string) {
  return subirImagen(dataUrl, "cover");
}

// Guardado incremental para el flujo de completar perfil.
// Solo actualiza los campos enviados (uno o varios por paso).
export async function guardarCampos(campos: {
  headline?: string;
  bio?: string;
  ciudad?: string;
  redes?: Record<string, string>;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const update: Record<string, unknown> = {};
  if (campos.headline !== undefined)
    update.headline = campos.headline.trim().slice(0, 80) || null;
  if (campos.bio !== undefined)
    update.bio = campos.bio.trim().slice(0, 400) || null;
  if (campos.ciudad !== undefined)
    update.ciudad = campos.ciudad.trim().slice(0, 60) || null;
  if (campos.redes !== undefined) {
    const redes: Record<string, string> = {};
    for (const k of ["instagram", "tiktok", "youtube"]) {
      const h = limpiarHandle(campos.redes[k]);
      if (h) redes[k] = h;
    }
    update.redes = redes;
  }
  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true };
}
