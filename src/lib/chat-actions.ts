"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esStickerValido } from "@/lib/stickers";
import { notificar } from "@/lib/notificaciones-actions";

const MINUTOS_EN_LINEA = 2;

export type Amigo = {
  id: string;
  nombre: string;
  avatar: string | null;
  enLinea: boolean;
  sinLeer: number;
  racha: number;
  gemas: number;
};

export type Mensaje = {
  id: string;
  sticker: string;
  mio: boolean;
  leido: boolean;
  fecha: string;
};

// Quiénes se siguen MUTUAMENTE conmigo. Solo con ellos hay chat.
async function idsMutuos(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const [{ data: sigo }, { data: meSiguen }] = await Promise.all([
    admin.from("seguidores").select("seguido_id").eq("seguidor_id", userId),
    admin.from("seguidores").select("seguidor_id").eq("seguido_id", userId),
  ]);
  const A = new Set((sigo || []).map((r) => r.seguido_id as string));
  return (meSiguen || [])
    .map((r) => r.seguidor_id as string)
    .filter((id) => A.has(id));
}

export async function getAmigos(): Promise<Amigo[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const ids = await idsMutuos(user.id);
  if (ids.length === 0) return [];

  const admin = createAdminClient();
  const [{ data: perfiles }, { data: noLeidos }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url, ultima_actividad, racha, gemas").in("id", ids),
    admin.from("chat_mensajes").select("de_id").eq("para_id", user.id).eq("leido", false),
  ]);

  const cuenta = new Map<string, number>();
  for (const m of noLeidos || []) {
    const d = m.de_id as string;
    cuenta.set(d, (cuenta.get(d) || 0) + 1);
  }

  const corte = Date.now() - MINUTOS_EN_LINEA * 60_000;
  return (perfiles || [])
    .map((p) => ({
      id: p.id as string,
      nombre: (p.full_name as string) || "Creador",
      avatar: (p.avatar_url as string) || null,
      enLinea: !!p.ultima_actividad && new Date(p.ultima_actividad as string).getTime() > corte,
      sinLeer: cuenta.get(p.id as string) || 0,
      racha: (p.racha as number) || 0,
      gemas: (p.gemas as number) || 0,
    }))
    // Primero quien tiene mensajes sin leer, luego quien está en línea.
    .sort((a, b) => b.sinLeer - a.sinLeer || Number(b.enLinea) - Number(a.enLinea));
}

// Conversación con una persona. Marca como leídos los que me mandó.
export async function getConversacion(
  otroId: string
): Promise<{ mensajes: Mensaje[]; amigo: Amigo | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { mensajes: [], amigo: null };

  const mutuos = await idsMutuos(user.id);
  if (!mutuos.includes(otroId)) return { mensajes: [], amigo: null };

  const admin = createAdminClient();
  const { data } = await admin
    .from("chat_mensajes")
    .select("id, de_id, sticker, leido, created_at")
    .or(`and(de_id.eq.${user.id},para_id.eq.${otroId}),and(de_id.eq.${otroId},para_id.eq.${user.id})`)
    .order("created_at", { ascending: true })
    .limit(200);

  await admin.from("chat_mensajes")
    .update({ leido: true })
    .eq("de_id", otroId).eq("para_id", user.id).eq("leido", false);

  const { data: p } = await admin
    .from("profiles").select("id, full_name, avatar_url, ultima_actividad, racha, gemas")
    .eq("id", otroId).maybeSingle();

  const corte = Date.now() - MINUTOS_EN_LINEA * 60_000;
  return {
    mensajes: (data || []).map((m) => ({
      id: m.id as string,
      sticker: m.sticker as string,
      mio: m.de_id === user.id,
      leido: !!m.leido,
      fecha: m.created_at as string,
    })),
    amigo: p ? {
      id: p.id as string,
      nombre: (p.full_name as string) || "Creador",
      avatar: (p.avatar_url as string) || null,
      enLinea: !!p.ultima_actividad && new Date(p.ultima_actividad as string).getTime() > corte,
      sinLeer: 0,
      racha: (p.racha as number) || 0,
      gemas: (p.gemas as number) || 0,
    } : null,
  };
}

export async function enviarSticker(
  paraId: string,
  sticker: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  // El catálogo es cerrado: cualquier clave inventada se rechaza aquí.
  if (!esStickerValido(sticker)) return { error: "Ese sticker no existe." };

  const mutuos = await idsMutuos(user.id);
  if (!mutuos.includes(paraId)) return { error: "Solo puedes escribirle a quien te sigue de vuelta." };

  const admin = createAdminClient();
  const { error } = await admin.from("chat_mensajes")
    .insert({ de_id: user.id, para_id: paraId, sticker });
  if (error) return { error: "No se pudo enviar." };

  const { data: yo } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  await notificar(paraId, "general",
    `${(yo?.full_name as string) || "Alguien"} te mandó una felicitación`,
    "", `/app/amigos/${user.id}`);
  return { ok: true };
}

// Latido de presencia: lo llama la app cada minuto mientras está abierta.
export async function marcarActividad(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await createAdminClient()
    .from("profiles")
    .update({ ultima_actividad: new Date().toISOString() })
    .eq("id", user.id);
}
