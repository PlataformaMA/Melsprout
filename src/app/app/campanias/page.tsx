import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { esAdminUsuario } from "@/lib/admin";
import { estadoPro } from "@/lib/pro";
import { misCampanias } from "@/lib/marketplace";
import { MisCampaniasVista } from "@/components/MisCampaniasVista";

export default async function CampaniasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const pro = await estadoPro(user.id, await esAdminUsuario(user.id, user.email));
  const bloqueado = pro.activo && !pro.pro;

  return (
    <MisCampaniasVista
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      racha={perfil.racha}
      lista={bloqueado ? [] : await misCampanias()}
      bloqueado={bloqueado}
    />
  );
}
