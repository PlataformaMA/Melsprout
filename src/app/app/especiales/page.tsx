import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getCursosEspeciales } from "@/lib/cursos-db";
import { EspecialesVista } from "@/components/EspecialesVista";

export default async function EspecialesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const cursos = await getCursosEspeciales();

  return (
    <EspecialesVista
      yo={{
        nombre: perfil.full_name ?? "Creador",
        avatar: perfil.avatar_url,
        racha: perfil.racha,
        gemas: perfil.gemas,
      }}
      cursos={cursos}
    />
  );
}
