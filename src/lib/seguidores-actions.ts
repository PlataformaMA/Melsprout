"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificar } from "@/lib/notificaciones-actions";

export type Social = {
  seguidores: number;
  siguiendo: number;
  loSigo: boolean;   // ¿yo sigo a esta persona?
};

// Conteos de un perfil + si yo lo sigo. Sirve para el mío y para el de otros.
export async function getSocial(userId: string): Promise<Social> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const [{ count: seguidores }, { count: siguiendo }, { data: mio }] = await Promise.all([
    admin.from("seguidores").select("seguidor_id", { count: "exact", head: true }).eq("seguido_id", userId),
    admin.from("seguidores").select("seguido_id", { count: "exact", head: true }).eq("seguidor_id", userId),
    user && user.id !== userId
      ? admin.from("seguidores").select("seguidor_id")
          .eq("seguidor_id", user.id).eq("seguido_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    seguidores: seguidores ?? 0,
    siguiendo: siguiendo ?? 0,
    loSigo: !!mio,
  };
}

// Seguir / dejar de seguir. Devuelve el estado nuevo.
export async function toggleSeguir(
  seguidoId: string
): Promise<{ loSigo: boolean; seguidores: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  if (user.id === seguidoId) return { error: "No puedes seguirte a ti." };

  const admin = createAdminClient();
  const { data: ya } = await admin
    .from("seguidores")
    .select("seguidor_id")
    .eq("seguidor_id", user.id)
    .eq("seguido_id", seguidoId)
    .maybeSingle();

  if (ya) {
    const { error } = await admin.from("seguidores").delete()
      .eq("seguidor_id", user.id).eq("seguido_id", seguidoId);
    // Antes esto fallaba en silencio y el botón se quedaba mintiendo.
    if (error) return { error: "No se pudo dejar de seguir." };
  } else {
    const { error } = await admin.from("seguidores")
      .insert({ seguidor_id: user.id, seguido_id: seguidoId });
    if (error) return { error: "No se pudo seguir. Inténtalo de nuevo." };
    const { data: yo } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    await notificar(seguidoId, "general",
      `${(yo?.full_name as string) || "Alguien"} te empezó a seguir`,
      "", `/app/creador/${user.id}`);
  }

  const { count } = await admin
    .from("seguidores")
    .select("seguidor_id", { count: "exact", head: true })
    .eq("seguido_id", seguidoId);

  return { loSigo: !ya, seguidores: count ?? 0 };
}
