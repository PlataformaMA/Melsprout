import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getAmigos } from "@/lib/chat-actions";
import { getSolicitudes } from "@/lib/seguidores-actions";
import { getActividadAmigos, getSeguidoresYSeguidos } from "@/lib/amigos-actions";
import { AmigosVista } from "@/components/AmigosVista";

export default async function AmigosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const [amigos, solicitudes, actividad, { seguidores, seguidos }] = await Promise.all([
    getAmigos(),
    getSolicitudes(),
    getActividadAmigos(),
    getSeguidoresYSeguidos(),
  ]);

  return (
    <AmigosVista
      yo={{
        id: perfil.id,
        nombre: perfil.full_name ?? "Creador",
        avatar: perfil.avatar_url,
        racha: perfil.racha,
        gemas: perfil.gemas,
      }}
      amigos={amigos}
      solicitudes={solicitudes}
      actividad={actividad}
      seguidores={seguidores}
      seguidos={seguidos}
    />
  );
}
