import { MobileNav } from "@/components/MobileNav";

// Layout de la app: agrega la navegación inferior en móvil y el espacio para ella.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-16 lg:pb-0">{children}</div>
      <MobileNav />
    </>
  );
}
