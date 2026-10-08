import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getForoPosts, getTopColaboradores } from "@/lib/foros-actions";
import { listarRetosComunidad } from "@/lib/comunidad-retos-actions";
import { getActividadReciente } from "@/lib/comunidad-actions";
import { listarGrupos } from "@/lib/grupos-actions";
import { ComunidadVista } from "@/components/ComunidadVista";
import { CATEGORIA_GENERAL } from "@/lib/data";
import { esAdminUsuario } from "@/lib/admin";

export default async function ComunidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const [posts, top, retosComunidad, actividad, grupos] = await Promise.all([
    getForoPosts(CATEGORIA_GENERAL),
    getTopColaboradores(),
    listarRetosComunidad(),
    getActividadReciente(),
    // Si la migración de grupos aún no corre, la pestaña sale vacía en vez de romper.
    listarGrupos().catch(() => ({ propuestas: [], mios: [], otros: [] })),
  ]);

  return (
    <ComunidadVista
      postsIniciales={posts}
      topColaboradores={top}
      retosComunidad={retosComunidad}
      grupos={grupos}
      actividad={actividad}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      racha={perfil.racha}
      esAdmin={await esAdminUsuario(user.id, user.email)}
    />
  );
}
