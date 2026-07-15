import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { listarClasesVivo } from "@/lib/vivo-actions";
import { VivoVista } from "@/components/VivoVista";

export default async function VivoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const clases = await listarClasesVivo();
  // Asistencias del usuario (para marcar "Asistí").
  const { data: asist } = await supabase
    .from("asistencias_vivo")
    .select("clase_vivo_id")
    .eq("user_id", user.id);
  const asistidas = (asist || []).map((a) => a.clase_vivo_id as string);

  return (
    <VivoVista
      clases={clases}
      asistidas={asistidas}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
