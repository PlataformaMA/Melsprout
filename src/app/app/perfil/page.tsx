import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { prepararTokenPhyllo, sincronizarMetricasPhyllo } from "@/lib/phyllo-server";
import { PerfilVista } from "@/components/PerfilVista";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ phyllo?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nombre = (user.user_metadata?.full_name as string) || user.email || "Creador";

  // Si volvemos de conectar en Phyllo → jala las métricas ANTES de leer el perfil.
  const sp = await searchParams;
  if (sp.phyllo === "conectado") {
    await sincronizarMetricasPhyllo(user.id);
  }

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  // Token para el Connect SDK (generado en el servidor, que sí tiene sesión).
  const phylloToken = await prepararTokenPhyllo(user.id, nombre);

  return <PerfilVista perfil={perfil} creadoEn={user.created_at ?? null} phylloToken={phylloToken} />;
}
