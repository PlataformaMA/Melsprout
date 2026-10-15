"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { NAV_ITEMS as ITEMS } from "@/components/nav-items";

export function AppSidebar({ active }: { active: string }) {
  const [fijado, setFijado] = useState(false);
  const [hover, setHover] = useState(false);
  // Durante el recorrido de bienvenida el menú se queda abierto: los globos
  // apuntan a cada sección por su nombre, y plegado no se entendería nada.
  const [tour, setTour] = useState(false);
  useEffect(() => {
    const alTour = (e: Event) => setTour((e as CustomEvent<boolean>).detail);
    window.addEventListener("melsprout:tour", alTour);
    // El recorrido pudo arrancar antes de que este menú se montara.
    try {
      if (sessionStorage.getItem("melsprout_tour_activo") === "1") setTour(true);
    } catch {}
    return () => window.removeEventListener("melsprout:tour", alTour);
  }, []);
  const abierto = fijado || hover || tour; // se despliega al pasar el mouse, al fijarlo o en el tour
  return (
    <>
    <div
      className="hidden lg:block shrink-0"
      style={{ width: abierto ? 264 : 92 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`sticky top-5 ml-4 mt-4 transition-all ${tour ? "relative z-[145]" : ""}`}>
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
                <div key={it.id}>
                {/* Título del bloque (Principal, Aprende…). Plegado no cabe. */}
                {it.grupo && abierto && (
                  <div className="text-[13px] font-extrabold text-text px-3 pt-3 pb-1.5">{it.grupo}</div>
                )}
                {it.grupo && !abierto && <div className="h-px bg-border my-2 mx-2" />}
                <Link href={it.href} title={it.label} data-nav={it.id}
                  className={`relative flex items-center gap-3 rounded-2xl h-11 transition ${abierto ? "px-3" : "justify-center w-11"} ${
                    on ? "bg-accent-soft text-accent font-bold" : "text-hint hover:bg-bg hover:text-sub"
                  }`}>
                  {on && <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-accent" />}
                  <span className="shrink-0">{it.icon}</span>
                  {abierto && <span className="text-[15px] whitespace-nowrap">{it.label}</span>}
                </Link>
                </div>
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
