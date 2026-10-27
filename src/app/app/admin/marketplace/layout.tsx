import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";
import { getPerfil } from "@/lib/perfil-actions";
import { solicitudesPendientes } from "@/lib/mkt-admin";
import { MktShell } from "@/components/MktShell";

// Todo el Marketplace del equipo cuelga de aquí, así que el candado se pone
// una sola vez: cualquier pantalla nueva que se agregue abajo ya queda cerrada.
export default async function MarketplaceAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await esAdminUsuario(user.id, user.email))) redirect("/app/ruta");

  const [perfil, pendientes] = await Promise.all([getPerfil(), solicitudesPendientes()]);

  return (
    <MktShell
      nombre={perfil?.full_name ?? "Equipo"}
      avatarUrl={perfil?.avatar_url ?? null}
      xp={perfil?.xp ?? 0}
      racha={perfil?.racha ?? 0}
      pendientes={pendientes.length}
    >
      {children}
    </MktShell>
  );
}
