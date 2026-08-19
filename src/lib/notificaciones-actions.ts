"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TipoNotif = "general" | "reto" | "comentario" | "like" | "racha" | "nivel" | "clase" | "solicitud";

export type Notificacion = {
  id: string;
  tipo: TipoNotif;
  titulo: string;
  cuerpo: string;
  href: string | null;
  leida: boolean;
  hace: string;
};

const EMOJI: Record<TipoNotif, string> = {
  general: "🔔", reto: "🎯", comentario: "💬", like: "❤️",
  racha: "🔥", nivel: "⭐", clase: "📖", solicitud: "🤝",
};

export async function emojiDe(t: TipoNotif): Promise<string> {
  return EMOJI[t] ?? "🔔";
}

function hace(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} d`;
}

// Las últimas notificaciones del alumno + cuántas no ha leído.
export async function getNotificaciones(): Promise<{ lista: Notificacion[]; sinLeer: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { lista: [], sinLeer: 0 };

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notificaciones")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("leida", false),
  ]);

  return {
    lista: (data || []).map((n) => ({
      id: n.id as string,
      tipo: (n.tipo as TipoNotif) || "general",
      titulo: n.titulo as string,
      cuerpo: (n.cuerpo as string) || "",
      href: (n.href as string) ?? null,
      leida: !!n.leida,
      hace: hace(n.created_at as string),
    })),
    sinLeer: count ?? 0,
  };
}

export async function marcarLeidas(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("user_id", user.id)
    .eq("leida", false);
}

// Crea una notificación para OTRO usuario (o para uno mismo). La escribe el
// servidor con permisos de admin: el alumno solo puede marcarlas como leídas.
export async function notificar(
  userId: string,
  tipo: TipoNotif,
  titulo: string,
  cuerpo = "",
  href?: string
): Promise<boolean> {
  if (!userId) return false;
  const admin = createAdminClient();
  const { error } = await admin.from("notificaciones").insert({
    user_id: userId, tipo, titulo, cuerpo, href: href ?? null,
  });
  // Devuelve si se pudo: la tabla tiene una lista cerrada de tipos y si la
  // migración del tipo nuevo aún no corrió, quien llama puede reintentar.
  return !error;
}
