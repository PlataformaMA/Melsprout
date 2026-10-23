import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getInicio } from "@/lib/inicio";
import { seleccionSinDatos, misDatos } from "@/lib/creador-campanias";
import { InicioDashboard } from "@/components/InicioDashboard";

export default async function InicioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const datos = await getInicio();
  if (!datos) redirect("/app/ruta");

  const [seleccion, datosDeCobro] = await Promise.all([seleccionSinDatos(), misDatos()]);

  return (
    <InicioDashboard
      datos={datos}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      racha={perfil.racha}
      seleccion={seleccion}
      misDatos={datosDeCobro}
    />
  );
}
