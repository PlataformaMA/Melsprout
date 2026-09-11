import { CapturaContexto } from "@/components/CapturaContexto";
import { RecuperarVersion } from "@/components/RecuperarVersion";
import { BotonSoporte } from "@/components/BotonSoporte";

// Layout de la app. El menú móvil (☰ drawer) lo renderiza AppSidebar en cada página.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CapturaContexto />
      <RecuperarVersion />
      {children}
      <BotonSoporte />
    </div>
  );
}
