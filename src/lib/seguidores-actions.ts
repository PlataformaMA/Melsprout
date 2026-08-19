"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificar } from "@/lib/notificaciones-actions";

export type Social = {
  seguidores: number;   // solo los ACEPTADOS
  siguiendo: number;    // solo los ACEPTADOS
  loSigo: boolean;      // ¿ya me aceptó y la sigo?
  solicitada: boolean;  // ¿le mandé solicitud y sigue pendiente?
};

// Una solicitud de seguimiento que espera mi respuesta.
export type Solicitud = {
  id: string;
  nombre: string;
  avatar: string | null;
  fecha: string;
};

// Conteos de un perfil + si yo lo sigo. Sirve para el mío y para el de otros.
export async function getSocial(userId: string): Promise<Social> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const [{ count: seguidores }, { count: siguiendo }, { data: mio }] = await Promise.all([
    admin.from("seguidores").select("seguidor_id", { count: "exact", head: true })
      .eq("seguido_id", userId).eq("estado", "aceptado"),
    admin.from("seguidores").select("seguido_id", { count: "exact", head: true })
      .eq("seguidor_id", userId).eq("estado", "aceptado"),
    user && user.id !== userId
      ? admin.from("seguidores").select("estado")
          .eq("seguidor_id", user.id).eq("seguido_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const estado = (mio as { estado?: string } | null)?.estado ?? null;
  return {
    seguidores: seguidores ?? 0,
    siguiendo: siguiendo ?? 0,
    loSigo: estado === "aceptado",
    solicitada: estado === "pendiente",
  };
}

// Mandar solicitud / cancelarla / dejar de seguir. Devuelve el estado nuevo.
// Seguir ya NO es inmediato: la fila nace pendiente y la otra persona acepta.
export async function toggleSeguir(
  seguidoId: string
): Promise<{ loSigo: boolean; solicitada: boolean; seguidores: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  if (user.id === seguidoId) return { error: "No puedes seguirte a ti." };

  const admin = createAdminClient();
  const { data: ya } = await admin
    .from("seguidores")
    .select("estado")
    .eq("seguidor_id", user.id)
    .eq("seguido_id", seguidoId)
    .maybeSingle();

  if (ya) {
    // Existe: cancela la solicitud pendiente o deja de seguir.
    const { error } = await admin.from("seguidores").delete()
      .eq("seguidor_id", user.id).eq("seguido_id", seguidoId);
    // Antes esto fallaba en silencio y el botón se quedaba mintiendo.
    if (error) return { error: "No se pudo deshacer." };
  } else {
    const { error } = await admin.from("seguidores")
      .insert({ seguidor_id: user.id, seguido_id: seguidoId, estado: "pendiente" });
    if (error) return { error: "No se pudo enviar la solicitud. Inténtalo de nuevo." };
    const { data: yo } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    // Sin duplicados: si ya le mandamos una solicitud sin leer, no llenamos su
    // campana con la misma cada vez que se sigue y se deja de seguir.
    const { data: previa } = await admin
      .from("notificaciones")
      .select("id")
      .eq("user_id", seguidoId)
      .eq("leida", false)
      .like("href", `%de=${user.id}%`)
      .maybeSingle();
    if (!previa) {
      const titulo = `${(yo?.full_name as string) || "Alguien"} quiere seguirte`;
      const cuerpo = "Acéptala para que sean amigos y puedan chatear.";
      const destino = `/app/amigos?de=${user.id}#solicitudes`;
      const ok = await notificar(seguidoId, "solicitud", titulo, cuerpo, destino);
      // Si la migración del tipo "solicitud" todavía no corrió, la mandamos como
      // general: el aviso llega igual y los botones siguen funcionando.
      if (!ok) await notificar(seguidoId, "general", titulo, cuerpo, destino);
    }
  }

  const { count } = await admin
    .from("seguidores")
    .select("seguidor_id", { count: "exact", head: true })
    .eq("seguido_id", seguidoId).eq("estado", "aceptado");

  return { loSigo: false, solicitada: !ya, seguidores: count ?? 0 };
}

// Solicitudes que esperan MI respuesta.
export async function getSolicitudes(): Promise<Solicitud[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const { data: filas } = await admin
    .from("seguidores")
    .select("seguidor_id, created_at")
    .eq("seguido_id", user.id)
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  const ids = (filas || []).map((f) => f.seguidor_id as string);
  if (ids.length === 0) return [];

  const { data: perfiles } = await admin
    .from("profiles").select("id, full_name, avatar_url").in("id", ids);
  const porId = new Map((perfiles || []).map((p) => [p.id as string, p]));

  return (filas || []).map((f) => {
    const p = porId.get(f.seguidor_id as string);
    return {
      id: f.seguidor_id as string,
      nombre: (p?.full_name as string) || "Creador",
      avatar: (p?.avatar_url as string) || null,
      fecha: f.created_at as string,
    };
  });
}

// Aceptar o rechazar una solicitud. Al aceptar, esa persona pasa a contar como
// seguidora y quedan como amigos (se abre el chat).
export async function responderSolicitud(
  seguidorId: string,
  aceptar: boolean
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const admin = createAdminClient();
  if (!aceptar) {
    const { error } = await admin.from("seguidores").delete()
      .eq("seguidor_id", seguidorId).eq("seguido_id", user.id).eq("estado", "pendiente");
    await admin.from("notificaciones").update({ leida: true })
      .eq("user_id", user.id).like("href", `%de=${seguidorId}%`);
    return error ? { error: "No se pudo rechazar." } : { ok: true };
  }

  const { error } = await admin.from("seguidores")
    .update({ estado: "aceptado" })
    .eq("seguidor_id", seguidorId).eq("seguido_id", user.id).eq("estado", "pendiente");
  if (error) return { error: "No se pudo aceptar." };

  // Ya respondida: que no siga apareciendo pendiente en la campana.
  await admin.from("notificaciones").update({ leida: true })
    .eq("user_id", user.id).like("href", `%de=${seguidorId}%`);

  const { data: yo } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  await notificar(seguidorId, "general",
    `${(yo?.full_name as string) || "Alguien"} aceptó tu solicitud`,
    "Ya son amigos: pueden mandarse stickers.", `/app/amigos/${user.id}`);
  return { ok: true };
}
