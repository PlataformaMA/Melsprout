import { CapturaContexto } from "@/components/CapturaContexto";
import { RecuperarVersion } from "@/components/RecuperarVersion";
import { BotonSoporte } from "@/components/BotonSoporte";
import { InstalarApp } from "@/components/InstalarApp";
import { RegistrarSW } from "@/components/RegistrarSW";
import { TourBienvenida } from "@/components/TourBienvenida";
import { miMarca } from "@/lib/marca-cuenta";

// Layout de la app. El menú móvil (☰ drawer) lo renderiza AppSidebar en cada página.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Una empresa no hace el recorrido de las alumnas: habla de la Ruta, del XP
  // y de la comunidad, que ella no tiene.
  const esEmpresa = !!(await miMarca());
  return (
    <div>
      <CapturaContexto />
      <RecuperarVersion />
      {children}
      <BotonSoporte />
      <InstalarApp />
      <RegistrarSW />
      {/* Recorrido de bienvenida: vive aquí porque va cambiando de pantalla. */}
      {!esEmpresa && <TourBienvenida />}
    </div>
  );
}
