import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getForoPosts, getTopColaboradores } from "@/lib/foros-actions";
import { ComunidadVista } from "@/components/ComunidadVista";

export default async function ComunidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const [posts, top] = await Promise.all([getForoPosts("General"), getTopColaboradores()]);

  return (
    <ComunidadVista
      postsIniciales={posts}
      topColaboradores={top}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
