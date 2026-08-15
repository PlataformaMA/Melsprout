"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";

type Item = { id: string; label: string; href: string; icon: React.ReactNode };

const ITEMS: Item[] = [
  { id: "clases", label: "Ruta de aprendizaje", href: "/app/ruta", icon: <MapIcon /> },
  { id: "vivo", label: "Clases en vivo", href: "/app/vivo", icon: <LiveIcon /> },
  { id: "comunidad", label: "Comunidad", href: "/app/comunidad", icon: <PeopleIcon /> },
  { id: "amigos", label: "Amigos", href: "/app/amigos", icon: <ChatIcon /> },
  { id: "perfil", label: "Mi perfil", href: "/app/perfil", icon: <UserIcon /> },
];

export function AppSidebar({ active }: { active: string }) {
  const [fijado, setFijado] = useState(false);
  const [hover, setHover] = useState(false);
  const abierto = fijado || hover; // se despliega al pasar el mouse o al fijarlo
  return (
    <>
    <div
      className="hidden lg:block shrink-0"
      style={{ width: abierto ? 264 : 92 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="sticky top-5 ml-4 mt-4 transition-all">
        <div className="text-[11px] text-sub mb-1 pl-3">Menú</div>
        <div className="bg-surface rounded-3xl shadow-md border border-border py-4 px-2.5">
          {/* Logo + expandir */}
          <div className="flex items-center gap-1 mb-4 pl-1.5">
            <div className="w-9 h-9 rounded-xl border border-border grid place-items-center shrink-0">
              <span className="w-4 h-4 rounded-full bg-accent" />
            </div>
            <button onClick={() => setFijado((v) => !v)} aria-label={fijado ? "Contraer" : "Fijar abierto"}
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
    <MobileNav />
    </>
  );
}

const ICO = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function MapIcon() { return <svg {...ICO}><path d="M9 4.5 3.7 6.4v13.1l5.3-1.9 6 1.9 5.3-1.9V4.5l-5.3 1.9-6-1.9z" /><path d="M9 4.5v13.1M15 6.4v13.1" /></svg>; }
function LiveIcon() { return <svg {...ICO}><circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4" /><path d="M5.2 5.2a10 10 0 0 0 0 13.6" /><path d="M18.8 5.2a10 10 0 0 1 0 13.6" /></svg>; }
function PeopleIcon() { return <svg {...ICO}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" /><path d="M15.5 6a3 3 0 0 1 0 5.6M20.5 19.5a5.5 5.5 0 0 0-3.6-5.2" /></svg>; }
function TrophyIcon() { return <svg {...ICO}><path d="M7 4.5h10v3.5a5 5 0 0 1-10 0z" /><path d="M7 6.5H4.5v.8a3 3 0 0 0 3 3M17 6.5h2.5v.8a3 3 0 0 1-3 3M9.5 19.5h5M12 13v3.5" /></svg>; }
function UserIcon() { return <svg {...ICO}><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>; }

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
