import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

// Los admins entran directo a su panel; los usuarios, a su Ruta de Aprendizaje.
// Quien acaba de recibir un curso (compra o alta desde el panel) va primero
// al curso, una sola vez; después entra a la Ruta como todo el mundo.
export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && (await esAdminUsuario(user.id, user.email))) redirect("/app/admin");

  if (user) {
    const destino = await cursoRecienRecibido(user.id);
    if (destino) redirect(destino);
  }
  redirect("/app/ruta");
}

// El curso más reciente al que todavía no ha entrado. Solo cuenta cuando ya
// terminó el onboarding: si no, la Ruta la manda al onboarding y al acabar
// vuelve a pasar por aquí.
async function cursoRecienRecibido(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: perfil } = await admin
    .from("profiles").select("onboarding_completo").eq("id", userId).maybeSingle();
  if (!perfil?.onboarding_completo) return null;

  const { data: acceso } = await admin
    .from("curso_accesos")
    .select("modulo_id, cursos_modulos!inner(id, activo, especial)")
    .eq("user_id", userId)
    .is("entrada_at", null)
    .eq("cursos_modulos.activo", true)
    .eq("cursos_modulos.especial", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!acceso) return null;

  await admin
    .from("curso_accesos")
    .update({ entrada_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("modulo_id", acceso.modulo_id as string);

  return `/app/especiales/${acceso.modulo_id as string}`;
}
