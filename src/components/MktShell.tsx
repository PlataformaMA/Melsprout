"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";

// El menú del Marketplace del equipo. Es un panel aparte del de la Academia:
// arriba se cambia de uno a otro, porque son dos operaciones distintas con la
// misma cuenta (clases por un lado, marcas y campañas por el otro).

const MENU = [
  { href: "/app/admin/marketplace", texto: "Inicio", icono: "🏠", exacto: true },
  { href: "/app/admin/marketplace/solicitudes", texto: "Solicitudes", icono: "📄" },
  { href: "/app/admin/marketplace/campanias", texto: "Campañas", icono: "📣" },
  { href: "/app/admin/marketplace/marcas", texto: "Marcas", icono: "🏷️" },
  { href: "/app/admin/marketplace/creadores", texto: "Creadores destacados", icono: "⭐" },
];

export function MktShell({
  nombre, avatarUrl, xp, racha, pendientes = 0, children,
}: {
  nombre: string;
  avatarUrl: string | null;
  xp: number;
  racha: number;
  pendientes?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="hidden lg:block w-[270px] shrink-0 p-4">
        <div className="bg-surface border border-border rounded-3xl p-3 shadow-sm sticky top-4">
          <Conmutador />

          <p className="text-[12px] font-extrabold text-hint px-3 mt-4 mb-1.5">Principal</p>
          <nav className="space-y-0.5">
            {MENU.map((m) => {
              const activo = m.exacto ? pathname === m.href : pathname.startsWith(m.href);
              return (
                <Link key={m.href} href={m.href}
                  className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[14px] transition ${
                    activo
                      ? "bg-accent-soft text-accent font-extrabold"
                      : "text-sub font-semibold hover:bg-bg"}`}>
                  <span className="text-[15px] leading-none">{m.icono}</span>
                  <span className="truncate">{m.texto}</span>
                  {m.texto === "Solicitudes" && pendientes > 0 && (
                    <span className="ml-auto shrink-0 bg-pink text-white text-[11px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {pendientes}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          {/* En móvil el menú lateral no cabe: va como tira de pestañas. */}
          <div className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto">
            <div className="flex gap-2 w-max">
              {MENU.map((m) => {
                const activo = m.exacto ? pathname === m.href : pathname.startsWith(m.href);
                return (
                  <Link key={m.href} href={m.href}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition ${
                      activo ? "bg-accent text-white" : "bg-surface border border-border text-sub"}`}>
                    {m.texto}
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

// Cambiar entre la Academia y el Marketplace.
function Conmutador() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-border px-3 py-2.5 text-left hover:bg-bg transition">
        <span className="w-8 h-8 rounded-xl bg-accent-soft text-accent grid place-items-center text-[15px] shrink-0">🛍️</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-extrabold truncate">Marketplace</span>
          <span className="block text-[11.5px] text-hint truncate">Boost Academy</span>
        </span>
        <span className={`text-hint text-[11px] transition ${abierto ? "rotate-180" : ""}`}>▼</span>
      </button>

      {abierto && (
        <div className="absolute z-20 left-0 right-0 mt-1.5 bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
          <Opcion href="/app/admin" icono="🎓" titulo="Academia"
            pie="Clases, estudiantes y comunidad" onIr={() => setAbierto(false)} />
          <Opcion href="/app/admin/marketplace" icono="🛍️" titulo="Marketplace"
            pie="Marcas, campañas y colaboraciones" activo onIr={() => setAbierto(false)} />
        </div>
      )}
    </div>
  );
}

function Opcion({ href, icono, titulo, pie, activo, onIr }: {
  href: string; icono: string; titulo: string; pie: string; activo?: boolean; onIr: () => void;
}) {
  return (
    <Link href={href} onClick={onIr}
      className={`flex items-center gap-2.5 px-3 py-2.5 transition ${activo ? "bg-accent-soft" : "hover:bg-bg"}`}>
      <span className={`w-8 h-8 rounded-xl grid place-items-center text-[15px] shrink-0 ${
        activo ? "bg-accent text-white" : "bg-bg"}`}>{icono}</span>
      <span className="min-w-0">
        <span className={`block text-[13.5px] font-extrabold truncate ${activo ? "text-accent" : ""}`}>{titulo}</span>
        <span className="block text-[11.5px] text-hint truncate">{pie}</span>
      </span>
    </Link>
  );
}
