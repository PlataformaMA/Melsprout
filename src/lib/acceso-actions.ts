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

// ¿Puede entrar a este grupo? Los normales sí; los de un curso, solo quien
// lo compró (o el equipo). Con esto el enlace no sirve para colarse.
export async function puedeVerGrupo(grupoId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClient();
  const { data: grupo } = await admin
    .from("grupos").select("curso_id").eq("id", grupoId).maybeSingle();
  if (!grupo) return false;
  if (!grupo.curso_id) return true;             // grupo normal de la comunidad

  const { esAdminUsuario } = await import("@/lib/admin");
  if (await esAdminUsuario(user.id, user.email)) return true;

  const { data: acceso } = await admin
    .from("curso_accesos").select("user_id")
    .eq("user_id", user.id).eq("modulo_id", grupo.curso_id).maybeSingle();
  return !!acceso;
}

// Dar acceso a un curso: además de abrirle las clases, lo mete a su grupo.
// Esto es lo que hay que llamar cuando alguien compre.
export async function darAccesoCurso(
  userId: string, moduloId: string, origen = "checkout"
): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();

  const { error } = await admin.from("curso_accesos")
    .upsert({ user_id: userId, modulo_id: moduloId, origen }, { onConflict: "user_id,modulo_id" });
  if (error) return { error: "No se pudo dar el acceso." };

  const { data: grupo } = await admin
    .from("grupos").select("id, nombre").eq("curso_id", moduloId).maybeSingle();
  if (grupo) {
    await admin.from("grupo_miembros")
      .upsert({ grupo_id: grupo.id, user_id: userId, rol: "miembro" }, { onConflict: "grupo_id,user_id" });

    const { notificar } = await import("@/lib/notificaciones-actions");
    await notificar(userId, "general", "¡Ya eres parte de Boost Your Web! 🚀",
      `Tienes el curso completo y entraste al grupo «${grupo.nombre}». Preséntate cuando quieras.`,
      `/app/comunidad/grupo/${grupo.id}`);
  }
  return { ok: true };
}

// Quitar el acceso a un curso: reembolso, contracargo o baja manual.
// Sale del curso y de su grupo, pero conserva su cuenta y su progreso.
export async function quitarAccesoCurso(
  userId: string, moduloId: string
): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();

  const { error } = await admin.from("curso_accesos")
    .delete().eq("user_id", userId).eq("modulo_id", moduloId);
  if (error) return { error: "No se pudo quitar el acceso." };

  const { data: grupo } = await admin
    .from("grupos").select("id").eq("curso_id", moduloId).maybeSingle();
  if (grupo) {
    await admin.from("grupo_miembros")
      .delete().eq("grupo_id", grupo.id).eq("user_id", userId);
  }
  return { ok: true };
}
