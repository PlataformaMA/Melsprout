"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { id: string; label: string; href: string; icon: React.ReactNode };

const ITEMS: Item[] = [
  { id: "inicio", label: "Inicio", href: "/app/ruta", icon: <HomeIcon /> },
  { id: "clases", label: "Todas las clases", href: "/app/ruta", icon: <MapIcon /> },
  { id: "vivo", label: "Clases en vivo", href: "/app/ruta", icon: <LiveIcon /> },
  { id: "comunidad", label: "Comunidad", href: "/app/ruta", icon: <PeopleIcon /> },
  { id: "retos", label: "Retos", href: "/app/ruta", icon: <TrophyIcon /> },
  { id: "perfil", label: "Mi perfil", href: "/app/perfil", icon: <UserIcon /> },
];

export function AppSidebar({ active }: { active: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="hidden lg:block shrink-0" style={{ width: abierto ? 264 : 92 }}>
      <div className="sticky top-5 ml-4 mt-4 transition-all">
        <div className="text-[11px] text-sub mb-1 pl-3">Menú</div>
        <div className="bg-surface rounded-3xl shadow-md border border-border py-4 px-2.5">
          {/* Logo + expandir */}
          <div className="flex items-center gap-1 mb-4 pl-1.5">
            <div className="w-9 h-9 rounded-xl border border-border grid place-items-center shrink-0">
              <span className="w-4 h-4 rounded-full bg-accent" />
            </div>
            <button onClick={() => setAbierto((v) => !v)} aria-label={abierto ? "Contraer" : "Expandir"}
              className="w-7 h-9 grid place-items-center text-hint hover:text-sub transition">
              <span className={`transition-transform ${abierto ? "rotate-180" : ""}`}>›</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {ITEMS.map((it) => {
              const on = it.id === active;
              return (
                <Link key={it.id} href={it.href} title={it.label}
                  className={`relative flex items-center gap-3 rounded-2xl h-11 transition ${abierto ? "px-3" : "justify-center w-11"} ${
                    on ? "bg-accent-soft text-accent font-bold" : "text-hint hover:bg-bg hover:text-sub"
                  }`}>
                  {on && <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-accent" />}
                  <span className="shrink-0">{it.icon}</span>
                  {abierto && <span className="text-[15px] whitespace-nowrap">{it.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>; }
function MapIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>; }
function LiveIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17" /></svg>; }
function PeopleIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-4-5.6" /></svg>; }
function TrophyIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4" /></svg>; }
function UserIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>; }
