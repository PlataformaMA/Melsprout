"use client";

import { useState } from "react";
import Link from "next/link";

// El cambio entre los dos paneles del equipo: la Academia y el Marketplace.
//
// Va en LOS DOS. Al principio solo estaba en el del Marketplace, así que desde
// la Academia no había ninguna puerta: había que escribir la URL a mano y
// parecía que el panel nuevo no existía.

const PANELES = {
  academia: {
    href: "/app/admin",
    icono: "🎓",
    titulo: "Academia",
    pie: "Clases, estudiantes y comunidad",
  },
  marketplace: {
    href: "/app/admin/marketplace",
    icono: "🛍️",
    titulo: "Marketplace",
    pie: "Marcas, campañas y colaboraciones",
  },
} as const;

export function ConmutadorPanel({ activo }: { activo: "academia" | "marketplace" }) {
  const [abierto, setAbierto] = useState(false);
  const actual = PANELES[activo];

  return (
    <div className="relative">
      <button onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-border px-3 py-2.5 text-left hover:bg-bg transition">
        <span className="w-8 h-8 rounded-xl bg-accent-soft text-accent grid place-items-center text-[15px] shrink-0">
          {actual.icono}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-extrabold truncate">{actual.titulo}</span>
          <span className="block text-[11.5px] text-hint truncate">Boost Academy</span>
        </span>
        <span className={`text-hint text-[11px] transition ${abierto ? "rotate-180" : ""}`}>▼</span>
      </button>

      {abierto && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
          {(Object.keys(PANELES) as (keyof typeof PANELES)[]).map((k) => {
            const p = PANELES[k];
            const esEste = k === activo;
            return (
              <Link key={k} href={p.href} onClick={() => setAbierto(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 transition ${
                  esEste ? "bg-accent-soft" : "hover:bg-bg"}`}>
                <span className={`w-8 h-8 rounded-xl grid place-items-center text-[15px] shrink-0 ${
                  esEste ? "bg-accent text-white" : "bg-bg"}`}>{p.icono}</span>
                <span className="min-w-0">
                  <span className={`block text-[13.5px] font-extrabold truncate ${esEste ? "text-accent" : ""}`}>
                    {p.titulo}
                  </span>
                  <span className="block text-[11.5px] text-hint truncate">{p.pie}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
