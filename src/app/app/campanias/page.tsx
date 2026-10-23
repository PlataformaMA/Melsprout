import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { esAdminUsuario } from "@/lib/admin";
import { estadoPro } from "@/lib/pro";
import { misColaboraciones, misPagos } from "@/lib/creador-campanias";
import { MisCampaniasVista } from "@/components/MisCampaniasVista";

export default async function CampaniasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const pro = await estadoPro(user.id, await esAdminUsuario(user.id, user.email));
  const bloqueado = pro.activo && !pro.pro;

  const [colaboraciones, pagos] = bloqueado
    ? [[], { filas: [], esteMes: 0, moneda: "MXN", variacion: null, serie: [], enCurso: 0 }]
    : await Promise.all([misColaboraciones(), misPagos("proceso")]);

  return (
    <MisCampaniasVista
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      xp={perfil.xp}
      racha={perfil.racha}
      colaboraciones={colaboraciones}
      pagos={pagos}
      bloqueado={bloqueado}
    />
  );
}
