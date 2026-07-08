import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { RutaAprendizaje } from "@/components/RutaAprendizaje";

export default async function RutaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  return (
    <RutaAprendizaje
      nombre={perfil.full_name ?? "creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
