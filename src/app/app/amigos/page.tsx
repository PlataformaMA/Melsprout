import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getAmigos } from "@/lib/chat-actions";
import { getSolicitudes } from "@/lib/seguidores-actions";
import { getActividadAmigos, getSeguidoresYSeguidos } from "@/lib/amigos-actions";
import { AmigosVista } from "@/components/AmigosVista";
import { estadoPro } from "@/lib/pro";
import { esAdminUsuario } from "@/lib/admin";

export default async function AmigosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const [amigos, solicitudes, actividad, { seguidores, seguidos }, pro] = await Promise.all([
    getAmigos(),
    getSolicitudes(),
    getActividadAmigos(),
    getSeguidoresYSeguidos(),
    // Lo social es parte de Boost Pro (ver lib/pro.ts).
    esAdminUsuario(user.id, user.email).then((a) => estadoPro(user.id, a)),
  ]);

  return (
    <AmigosVista
      yo={{
        id: perfil.id,
        nombre: perfil.full_name ?? "Creador",
        avatar: perfil.avatar_url,
        racha: perfil.racha,
        xp: perfil.xp,
      }}
      amigos={amigos}
      solicitudes={solicitudes}
      actividad={actividad}
      seguidores={seguidores}
      seguidos={seguidos}
      bloqueado={pro.activo && !pro.pro}
    />
  );
}
