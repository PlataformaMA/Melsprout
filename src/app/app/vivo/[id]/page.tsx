import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { listarClasesVivo } from "@/lib/vivo-actions";
import { GrabacionVista } from "@/components/GrabacionVista";

export default async function GrabacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const clase = (await listarClasesVivo()).find((c) => c.id === id);
  if (!clase || !clase.grabacion_url) redirect("/app/vivo");

  return (
    <GrabacionVista
      clase={clase}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
