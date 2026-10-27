import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

// Quién puede abrir una campaña por dentro: la marca que es dueña, y el equipo.
//
// La regla vive aquí, en un solo lugar, porque la usan las pantallas de la
// empresa Y las del equipo. Antes cada función revisaba "¿esta campaña es de
// mi marca?" por su cuenta, y para dejar entrar al equipo había que tocar esa
// comprobación en cinco archivos y acertarle en los cinco.

export async function puedeVerCampania(campaniaId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (await esAdminUsuario(user.id, user.email)) return true;

  try {
    const admin = createAdminClient();
    const { data: c } = await admin
      .from("campanias").select("marca_id").eq("id", campaniaId).maybeSingle();
    if (!c) return false;
    const { data: m } = await admin
      .from("marcas").select("id").eq("id", c.marca_id as string).eq("dueno_id", user.id).maybeSingle();
    return !!m;
  } catch {
    return false;
  }
}

// Lo mismo, pero partiendo de una postulación: es lo que se tiene a la mano
// cuando se mueve a alguien de etapa o se edita su colaboración.
export async function puedeVerAplicacion(aplicacionId: string): Promise<boolean> {
  try {
    const { data } = await createAdminClient()
      .from("campania_aplicaciones").select("campania_id").eq("id", aplicacionId).maybeSingle();
    return data ? puedeVerCampania(data.campania_id as string) : false;
  } catch {
    return false;
  }
}

// ¿Es del equipo? Para esconder los controles que solo le tocan a la marca.
export async function soyDelEquipo(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}
