"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ¿Esta persona ya tiene el curso especial?
export async function tengoAcceso(moduloId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("curso_accesos")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("modulo_id", moduloId)
    .maybeSingle();
  return !!data;
}

export type Testimonio = { id: string; nombre: string; avatar: string | null; desde: string | null; texto: string };

// Testimonios reales del curso. Si no hay, la sección no se muestra.
export async function getTestimonios(moduloId: string): Promise<Testimonio[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("curso_testimonios")
    .select("id, nombre, avatar, desde, texto")
    .eq("modulo_id", moduloId)
    .eq("visible", true)
    .order("created_at", { ascending: true })
    .limit(8);
  return (data || []).map((t) => ({
    id: t.id as string,
    nombre: t.nombre as string,
    avatar: (t.avatar as string) || null,
    desde: (t.desde as string) || null,
    texto: t.texto as string,
  }));
}

// ¿Puede abrir esta clase? Las de la ruta sí; las de un curso especial solo
// si lo compró o si es del equipo. Sin esto bastaba con adivinar la URL.
export async function puedeVerClase(claseId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClient();
  const { data: clase } = await admin
    .from("cursos_clases").select("modulo_id").eq("id", claseId).maybeSingle();
  if (!clase) return false;

  const { data: modulo } = await admin
    .from("cursos_modulos").select("id, especial").eq("id", clase.modulo_id).maybeSingle();
  if (!modulo || modulo.especial !== true) return true;   // clase normal de la ruta

  const { esAdminUsuario } = await import("@/lib/admin");
  if (await esAdminUsuario(user.id, user.email)) return true;

  const { data: acceso } = await admin
    .from("curso_accesos").select("user_id")
    .eq("user_id", user.id).eq("modulo_id", modulo.id).maybeSingle();
  return !!acceso;
}
