import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getGrupo } from "@/lib/grupos-actions";
import { getForoPosts } from "@/lib/foros-actions";
import { getActividadReciente } from "@/lib/comunidad-actions";
import { GrupoDetalle } from "@/components/GrupoDetalle";

export default async function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const grupo = await getGrupo(id);
  if (!grupo) notFound();

  const [posts, actividad] = await Promise.all([
    getForoPosts("General", id),
    getActividadReciente(),
  ]);

  return (
    <GrupoDetalle
      grupo={grupo}
      postsIniciales={posts}
      actividad={actividad}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
