import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { INSTAGRAM_CONFIGURADO } from "@/lib/instagram";
import { TIKTOK_CONFIGURADO } from "@/lib/tiktok";
import { YOUTUBE_CONFIGURADO } from "@/lib/youtube";
import { CompletarPerfil } from "@/components/CompletarPerfil";

export default async function CompletarPage({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string; r?: string }>;
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
      resultado={sp.r}
      configurado={{
        instagram: INSTAGRAM_CONFIGURADO,
        tiktok: TIKTOK_CONFIGURADO,
        youtube: YOUTUBE_CONFIGURADO,
      }}
    />
  );
}
