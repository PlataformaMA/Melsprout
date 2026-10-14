import { CapturaContexto } from "@/components/CapturaContexto";
import { RecuperarVersion } from "@/components/RecuperarVersion";
import { BotonSoporte } from "@/components/BotonSoporte";
import { InstalarApp } from "@/components/InstalarApp";
import { RegistrarSW } from "@/components/RegistrarSW";
import { TourBienvenida } from "@/components/TourBienvenida";

// Layout de la app. El menú móvil (☰ drawer) lo renderiza AppSidebar en cada página.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CapturaContexto />
      <RecuperarVersion />
      {children}
      <BotonSoporte />
      <InstalarApp />
      <RegistrarSW />
      {/* Recorrido de bienvenida: vive aquí porque va cambiando de pantalla. */}
      <TourBienvenida />
    </div>
  );
}
