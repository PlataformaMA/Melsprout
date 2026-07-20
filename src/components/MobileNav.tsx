"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app/inicio", label: "Inicio", icon: "🏠" },
  { href: "/app/ruta", label: "Clases", icon: "🗺️" },
  { href: "/app/comunidad", label: "Comunidad", icon: "👥" },
  { href: "/app/retos", label: "Retos", icon: "🎯" },
  { href: "/app/perfil", label: "Perfil", icon: "🙂" },
];

// Barra de navegación inferior (solo móvil). Se oculta en el panel admin.
export function MobileNav() {
  const path = usePathname() || "";
  if (path.startsWith("/app/admin")) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((it) => {
        const activo = path === it.href || (it.href !== "/app/inicio" && path.startsWith(it.href));
        return (
          <Link key={it.href} href={it.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition ${activo ? "text-accent" : "text-sub"}`}>
            <span className="text-[18px]">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
