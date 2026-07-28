import { CapturaContexto } from "@/components/CapturaContexto";

// Layout de la app. El menú móvil (☰ drawer) lo renderiza AppSidebar en cada página.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CapturaContexto />
      {children}
    </div>
  );
}
