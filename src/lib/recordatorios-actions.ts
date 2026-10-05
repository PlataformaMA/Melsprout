"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { faltaDelPerfil, enLista } from "@/lib/perfil-completo";

// Recuerda por notificación lo que falta del perfil. Como mucho una vez cada
// tres días, para que no se vuelva ruido.
export async function recordarPerfilIncompleto(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select("avatar_url, headline, bio, ciudad, nicho, objetivo, plataforma_principal, redes")
    .eq("id", user.id)
    .maybeSingle();
  if (!p) return;

  // Lo que falta sale del MISMO cálculo que el anillo del perfil: así nadie
  // recibe "te falta X" con el perfil marcado al 100%.
  const falta = faltaDelPerfil(p);
  if (falta.length === 0) return;

  // ¿Ya se lo recordamos hace poco?
  const hace3dias = new Date(Date.now() - 3 * 864e5).toISOString();
  const { count } = await admin
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("tipo", "general")
    .ilike("titulo", "%Completa tu perfil%")
    .gt("created_at", hace3dias);
  if ((count ?? 0) > 0) return;

  const lista = enLista(falta);

  await admin.from("notificaciones").insert({
    user_id: user.id,
    tipo: "general",
    titulo: "Completa tu perfil ✨",
    cuerpo: `Te falta ${lista}. Un perfil completo conecta mejor con la comunidad.`,
    href: "/app/perfil/completar",
  });
}
