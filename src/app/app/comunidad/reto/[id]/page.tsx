import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getRetoComunidad } from "@/lib/comunidad-retos-actions";
import { RetoComunidadDetalle } from "@/components/RetoComunidadDetalle";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const detalle = await getRetoComunidad(id);
  if (!detalle) redirect("/app/comunidad");

  return (
    <RetoComunidadDetalle
      detalle={detalle}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
