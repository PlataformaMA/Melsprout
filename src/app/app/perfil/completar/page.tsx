import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { INSTAGRAM_CONFIGURADO } from "@/lib/instagram";
import { CompletarPerfil } from "@/components/CompletarPerfil";

export default async function CompletarPage({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string; ig?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  return (
    <CompletarPerfil
      perfil={perfil}
      pasoInicial={sp.paso}
      ig={sp.ig}
      igConfigurado={INSTAGRAM_CONFIGURADO}
    />
  );
}
