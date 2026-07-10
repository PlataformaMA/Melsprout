import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { ETAPA_1 } from "@/lib/data";
import { ReproductorClase } from "@/components/ReproductorClase";

export default async function ClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const modulo = ETAPA_1.find((m) => m.clases.some((c) => c.id === id)) ?? ETAPA_1[0];
  const clase = modulo.clases.find((c) => c.id === id) ?? modulo.clases[0];

  return (
    <ReproductorClase
      clase={clase}
      modulo={modulo}
      avatarUrl={perfil.avatar_url}
      nombre={perfil.full_name ?? "creador"}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
