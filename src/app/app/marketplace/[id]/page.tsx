import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getCampaniaDetalle } from "@/lib/marketplace";
import { CampaniaDetalleVista } from "@/components/CampaniaDetalleVista";

export default async function CampaniaPublicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  // getCampaniaDetalle ya revisa Boost Pro y el estado de la campaña: si no hay
  // nada que enseñar, de vuelta al Marketplace (que muestra el aviso del plan).
  const campania = await getCampaniaDetalle(id);
  if (!campania) redirect("/app/marketplace");

  return (
    <CampaniaDetalleVista
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      racha={perfil.racha}
      campania={campania}
    />
  );
}
