import { CapturaContexto } from "@/components/CapturaContexto";
import { RecuperarVersion } from "@/components/RecuperarVersion";
import { BotonSoporte } from "@/components/BotonSoporte";
import { InstalarApp } from "@/components/InstalarApp";
import { RegistrarSW } from "@/components/RegistrarSW";
import { TourBienvenida } from "@/components/TourBienvenida";
import { miMarca } from "@/lib/marca-cuenta";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

// Layout de la app. El menú móvil (☰ drawer) lo renderiza AppSidebar en cada página.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Una empresa no hace el recorrido de las alumnas: habla de la Ruta, del XP
  // y de la comunidad, que ella no tiene.
  const esEmpresa = !!(await miMarca());

  // El equipo tampoco lo recibe solo: salía encima del panel de administración,
  // que no es parte del recorrido. Lo abre desde "🧭 Ver el recorrido".
  const { data: { user } } = await (await createClient()).auth.getUser();
  const esEquipo = !!user && (await esAdminUsuario(user.id, user.email));
  return (
    <div>
      <CapturaContexto />
      <RecuperarVersion />
      {children}
      <BotonSoporte />
      <InstalarApp />
      <RegistrarSW />
      {/* Recorrido de bienvenida: vive aquí porque va cambiando de pantalla. */}
      {!esEmpresa && <TourBienvenida auto={!esEquipo} />}
    </div>
  );
}
