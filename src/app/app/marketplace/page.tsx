import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { esAdminUsuario } from "@/lib/admin";
import { estadoPro } from "@/lib/pro";
import { opcionesDeFiltro } from "@/lib/marketplace";
import { MarketplaceVista } from "@/components/MarketplaceVista";

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  // El Marketplace es de Boost Pro.
  const pro = await estadoPro(user.id, await esAdminUsuario(user.id, user.email));

  return (
    <MarketplaceVista
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      racha={perfil.racha}
      opciones={await opcionesDeFiltro()}
      bloqueado={pro.activo && !pro.pro}
    />
  );
}
