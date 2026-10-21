"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/lib/auth-actions";
import type { MiMarca } from "@/lib/marca-cuenta";

// El armazón del portal de marcas: su propio menú y su barra de arriba.
//
// Una empresa no ve la Ruta, ni la comunidad, ni el XP. Por eso no reusa
// AppSidebar: son dos productos distintos dentro de la misma plataforma.

const MENU = [
  { id: "inicio", label: "Inicio", href: "/app/marca", icono: <CasaIcon /> },
  { id: "marketplace", label: "Marketplace", href: "/app/marca/marketplace", icono: <GenteIcon /> },
  { id: "campanias", label: "Mis campañas", href: "/app/marca/campanias", icono: <CalendarioIcon /> },
  { id: "mensajes", label: "Mensajes", href: "/app/marca/mensajes", icono: <ChatIcon /> },
];

export function MarcaShell({
  marca, activo, children, sinLeer = 0,
}: {
  marca: MiMarca; activo: string; children: React.ReactNode; sinLeer?: number;
}) {
  const ruta = usePathname();

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Menú */}
      <div className="hidden lg:block shrink-0 w-[244px]">
        <div className="sticky top-5 ml-4 mt-4">
          <div className="text-[11px] text-sub mb-1 pl-3">Menú</div>
          <div className="bg-surface rounded-3xl shadow-md border border-border py-4 px-2.5 flex flex-col min-h-[calc(100vh-72px)]">
            <div className="flex items-center gap-2 mb-5 pl-2">
              <span className="w-8 h-8 rounded-full bg-accent shrink-0" />
            </div>

            <nav className="flex flex-col gap-1">
              {MENU.map((it) => {
                const on = it.id === activo || (it.href !== "/app/marca" && ruta.startsWith(it.href));
                return (
                  <Link key={it.id} href={it.href}
                    className={`relative flex items-center gap-3 rounded-2xl h-11 px-3 transition ${
                      on ? "bg-accent-soft text-accent font-bold" : "text-hint hover:bg-bg hover:text-sub"
                    }`}>
                    {on && <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-accent" />}
                    <span className="shrink-0">{it.icono}</span>
                    <span className="text-[15px] whitespace-nowrap">{it.label}</span>
                    {it.id === "mensajes" && sinLeer > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-pink text-white text-[11px] font-extrabold grid place-items-center">
                        {sinLeer > 9 ? "9+" : sinLeer}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* La empresa, abajo del todo */}
            <Link href="/app/marca/cuenta"
              className="mt-auto flex items-center gap-2.5 rounded-2xl p-2 hover:bg-bg transition">
              <Logo marca={marca} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold truncate">{marca.nombre}</span>
                <span className="block text-[11px] text-hint">
                  {marca.plan === "free" ? "Plan gratuito" : `Plan ${marca.plan}`}
                </span>
              </span>
              <span className="text-hint">›</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          {/* Barra de arriba: buscador y la cuenta */}
          <header className="flex items-center gap-3 mb-5 h-11">
            <label className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2.5 flex-1 max-w-[460px]">
              <Lupa />
              <input placeholder="Buscar creadores, campañas, nichos…"
                className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
            </label>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/app/marca/mensajes" className="relative text-hint hover:text-sub transition" aria-label="Mensajes">
                <Campana />
                {sinLeer > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-pink ring-2 ring-bg" />}
              </Link>
              <Link href="/app/marca/cuenta" className="flex items-center gap-2.5">
                <Logo marca={marca} size={36} />
                <span className="hidden sm:block">
                  <span className="block text-[13px] font-bold leading-tight">{marca.nombre}</span>
                  <span className="block text-[11.5px] text-hint">Empresa</span>
                </span>
              </Link>
              <form action={cerrarSesion}>
                <button className="text-[12px] font-bold text-hint hover:text-pink transition">Salir</button>
              </form>
            </div>
          </header>

          {/* Mientras el equipo no la apruebe, la marca puede prepararlo todo
              pero no publicar: más vale decírselo arriba que dejarla chocar
              contra el botón. */}
          {!marca.aprobada && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
              <span className="text-[18px]">⏳</span>
              <div className="min-w-0">
                <div className="font-display font-extrabold text-[14px] text-amber-900">
                  Tu empresa está en revisión
                </div>
                <p className="text-[12.5px] text-amber-800 leading-snug mt-0.5">
                  Puedes preparar tus campañas mientras tanto. En cuanto el equipo de Melsprout
                  apruebe tu cuenta vas a poder publicarlas y buscar creadoras.
                </p>
              </div>
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}

export function Logo({ marca, size = 36 }: { marca: { nombre: string; logoUrl: string | null }; size?: number }) {
  if (marca.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={marca.logoUrl} alt="" style={{ width: size, height: size }}
      className="rounded-full object-cover shrink-0" />;
  }
  return (
    <span style={{ width: size, height: size }}
      className="rounded-full bg-accent-soft text-accent grid place-items-center text-[12px] font-extrabold shrink-0">
      {marca.nombre.slice(0, 2).toUpperCase()}
    </span>
  );
}

const ICO = {
  width: 21, height: 21, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round",
} as const;

function CasaIcon() { return <svg {...ICO}><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></svg>; }
function GenteIcon() {
  return <svg {...ICO}><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5a6 6 0 0 1 12 0" /><circle cx="17.5" cy="9.5" r="2.2" /><path d="M16.5 15.5a5 5 0 0 1 4.5 4" /></svg>;
}
function CalendarioIcon() { return <svg {...ICO}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>; }
function ChatIcon() { return <svg {...ICO}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function Campana() { return <svg {...ICO}><path d="M18 8a6 6 0 1 0-12 0c0 7-2 8-2 8h16s-2-1-2-8" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></svg>; }
function Lupa() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-hint" aria-hidden>
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}
