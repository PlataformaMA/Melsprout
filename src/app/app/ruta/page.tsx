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

  const tieneRedes = ["instagram", "tiktok", "youtube"].some((k) => perfil.redes?.[k]);
  const items = [
    !!perfil.avatar_url, !!perfil.cover_url, !!perfil.headline, !!perfil.bio,
    !!perfil.ciudad, tieneRedes, !!perfil.nicho, !!perfil.objetivo, !!perfil.plataforma_principal,
  ];
  const perfilPct = Math.round((items.filter(Boolean).length / items.length) * 100);

  return (
    <RutaAprendizaje
      nombre={perfil.full_name ?? "creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      gemas={perfil.gemas}
      racha={perfil.racha}
      perfilPct={perfilPct}
    />
  );
}
