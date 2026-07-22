import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getForoPosts, getTopColaboradores } from "@/lib/foros-actions";
import { listarRetosComunidad } from "@/lib/comunidad-retos-actions";
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

  const [posts, top, retosComunidad] = await Promise.all([
    getForoPosts("General"),
    getTopColaboradores(),
    listarRetosComunidad(),
  ]);

  return (
    <ComunidadVista
      postsIniciales={posts}
      topColaboradores={top}
      retosComunidad={retosComunidad}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
