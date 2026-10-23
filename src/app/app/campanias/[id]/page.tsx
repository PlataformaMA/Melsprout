import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getColaboracion } from "@/lib/creador-campanias";
import { ColaboracionVista } from "@/components/ColaboracionVista";

export default async function ColaboracionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  // getColaboracion solo devuelve la colaboración si es de quien la pide.
  const colaboracion = await getColaboracion(id);
  if (!colaboracion) redirect("/app/campanias");

  return (
    <ColaboracionVista
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      racha={perfil.racha}
      colaboracion={colaboracion}
    />
  );
}
