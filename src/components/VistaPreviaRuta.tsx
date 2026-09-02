"use client";

import { useMemo, useState } from "react";
import type { ClaseAdmin, MundoAdmin } from "@/lib/clases-admin-actions";

// Cómo ven las alumnas la ruta: el camino y los bloques, tal cual se publica.
export function VistaPreviaRuta({
  clases, mundos, onCerrar,
}: {
  clases: ClaseAdmin[]; mundos: MundoAdmin[]; onCerrar: () => void;
}) {
  const [vista, setVista] = useState<"camino" | "bloques">("bloques");
  const [mundo, setMundo] = useState(mundos[0]?.id || "");

  // Solo se ve lo que está publicado: igual que en la app.
  const visibles = useMemo(
    () => clases.filter((c) => c.estado !== "oculta" && c.moduloId === mundo),
    [clases, mundo]
  );

  return (
    <div className="fixed inset-0 z-[92] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[820px] shadow-2xl my-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-extrabold text-lg leading-tight">Vista previa</h2>
            <p className="text-[12.5px] text-sub">Así lo ven las alumnas.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={mundo} onChange={(e) => setMundo(e.target.value)}
              className="bg-bg border border-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-accent">
              {mundos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            <div className="flex bg-bg border border-border rounded-xl p-0.5">
              {([["camino", "Camino"], ["bloques", "Bloques"]] as const).map(([id, txt]) => (
                <button key={id} onClick={() => setVista(id)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold transition ${
                    vista === id ? "bg-surface text-accent shadow-sm" : "text-sub"
                  }`}>{txt}</button>
              ))}
            </div>
            <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none">×</button>
          </div>
        </div>

        <div className="px-6 py-5">
          {visibles.length === 0 ? (
            <p className="text-[13.5px] text-hint py-10 text-center">Este mundo no tiene clases publicadas.</p>
          ) : vista === "bloques" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibles.map((c, i) => (
                <article key={c.id} className="bg-bg border border-border rounded-2xl p-3">
                  <div className="rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-[#3b0764] to-[#7c3aed] grid place-items-center">
                    {c.portada ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.portada} alt="" className="w-full h-full object-cover" />
                    ) : <span className="text-white/80 text-xl">▶</span>}
                  </div>
                  <div className="text-[11px] font-bold text-accent mt-2">Clase {i + 1}</div>
                  <h3 className="font-display font-extrabold text-[13.5px] leading-tight">{c.titulo}</h3>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[11.5px] text-sub">{c.duracionMin} min</span>
                    <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${
                      c.estado === "publicada" ? "bg-accent-soft text-accent" : "bg-bg border border-border text-hint"
                    }`}>
                      {c.estado === "publicada" ? "Disponible" : "Próximamente"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="relative mx-auto max-w-[420px] py-2">
              {/* Serpentina simple: cada clase con su nodo y su reto */}
              {visibles.map((c, i) => (
                <div key={c.id} className={`flex items-center gap-4 py-3 ${i % 2 ? "flex-row-reverse text-right" : ""}`}>
                  <span className={`w-14 h-14 rounded-full grid place-items-center text-white shrink-0 shadow-md ${
                    c.estado === "publicada" ? "bg-accent" : "bg-[#D9DCE3]"
                  }`}>
                    {c.estado === "publicada" ? "▶" : "🔒"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-hint">Clase {i + 1}</div>
                    <div className="font-display font-extrabold text-[13.5px] leading-tight truncate">{c.titulo}</div>
                    <div className="text-[11.5px] text-sub">{c.duracionMin} min · reto al terminar</div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-center pt-3 border-t border-border mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/puerta.png" alt="" className="w-[92px] select-none" draggable={false} />
                <span className="text-[12px] text-hint mt-1.5">Puerta al siguiente mundo</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
