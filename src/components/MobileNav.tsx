"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMarca } from "@/components/LogoMarca";

const ITEMS = [
  { href: "/app/ruta", label: "Ruta de aprendizaje", icon: "🗺️" },
  { href: "/app/vivo", label: "Clases en vivo", icon: "📡" },
  { href: "/app/comunidad", label: "Comunidad", icon: "👥" },
  { href: "/app/retos", label: "Retos", icon: "🎯" },
  { href: "/app/perfil", label: "Mi perfil", icon: "🙂" },
];

// Menú ☰ lateral (drawer) — solo móvil. Se oculta en el panel admin.
export function MobileNav() {
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  if (path.startsWith("/app/admin")) return null;
  // El ☰ solo en las pantallas PRINCIPALES (las subpáginas tienen su propio "atrás").
  const esPrincipal = ITEMS.some((it) => it.href === path);
  if (!esPrincipal) return null;

  return (
    <>
      {/* Botón ☰ (fijo arriba a la izquierda) */}
      <button onClick={() => setOpen(true)} aria-label="Menú"
        className="lg:hidden fixed top-3.5 left-4 z-40 w-10 h-10 rounded-xl bg-surface border border-border shadow-sm grid place-items-center text-text active:scale-95 transition">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      {/* Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[82%] bg-surface shadow-2xl p-4 flex flex-col onb-slide">
            <div className="flex items-center justify-between mb-6 mt-1">
              <LogoMarca chico />
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="w-8 h-8 grid place-items-center rounded-lg text-hint hover:bg-bg">✕</button>
            </div>
            <nav className="flex flex-col gap-1">
              {ITEMS.map((it) => {
                const activo = path === it.href || (it.href !== "/app/inicio" && path.startsWith(it.href));
                return (
                  <Link key={it.href} href={it.href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-semibold transition ${activo ? "bg-accent-soft text-accent" : "text-text hover:bg-bg"}`}>
                    <span className="text-[18px]">{it.icon}</span>{it.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
