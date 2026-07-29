"use client";

import { useState } from "react";

type Tipo = "pdf" | "plantillas" | "canva" | "links";
type Recurso = {
  titulo: string;
  tipo: Tipo;
  etiqueta?: string; // "Nuevo", "Canva", "PDF"…
  peso?: string;
  desc: string;
  descargas: number;
  url?: string;
  emoji: string;
  reclamado?: boolean;
};

// Material de apoyo. (De momento es una lista base; luego se puede leer de la BD.)
const RECURSOS: Recurso[] = [
  { titulo: "Plantilla de Calendario de Contenido", tipo: "plantillas", etiqueta: "Nuevo", peso: "PDF · 2.3 MB", desc: "Organiza un mes completo de publicaciones.", descargas: 1240, emoji: "🗓️" },
  { titulo: "Guía de Hooks Virales", tipo: "pdf", peso: "PDF", desc: "Aprende las estructuras que generan atención.", descargas: 890, emoji: "📕" },
  { titulo: "Plantilla Canva para Reels", tipo: "canva", etiqueta: "Canva", desc: "Duplica esta plantilla y personalízala con tu marca.", descargas: 560, emoji: "🎨", url: "https://canva.com" },
  { titulo: "Checklist antes de publicar", tipo: "pdf", peso: "PDF · 1.1 MB", desc: "Los 15 puntos para revisar antes de subir un video.", descargas: 720, emoji: "✅", reclamado: true },
];

const FILTROS: { k: "todos" | Tipo; label: string; icono: string }[] = [
  { k: "todos", label: "Todos", icono: "▦" },
  { k: "pdf", label: "PDF", icono: "📕" },
  { k: "plantillas", label: "Plantillas", icono: "🗂️" },
  { k: "canva", label: "Canva", icono: "🎨" },
  { k: "links", label: "Links", icono: "🔗" },
];

export function RecursosModal({ onClose }: { onClose: () => void }) {
  const [filtro, setFiltro] = useState<"todos" | Tipo>("todos");
  const [q, setQ] = useState("");
  const [imgErr, setImgErr] = useState(false);

  const lista = RECURSOS.filter((r) => {
    if (filtro !== "todos" && r.tipo !== filtro) return false;
    if (q && !r.titulo.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl my-4">
        {/* Cabecera */}
        <div className="flex items-start gap-3 p-5 sm:p-6 pb-3">
          {imgErr ? (
            <div className="w-12 h-12 rounded-2xl bg-accent-soft grid place-items-center text-2xl shrink-0">📁</div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/recursos.png" alt="" onError={() => setImgErr(true)} className="w-12 h-12 object-contain shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-extrabold text-lg sm:text-xl leading-tight">Recursos</h2>
            <p className="text-sub text-[13px] mt-0.5">Todo el material para aplicar lo aprendido.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition shrink-0">✕</button>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          {/* Buscador */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hint">🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar recurso…"
              className="w-full rounded-xl border border-border bg-bg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent transition" />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
            {FILTROS.map((f) => (
              <button key={f.k} onClick={() => setFiltro(f.k)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                  filtro === f.k ? "border-accent bg-accent-soft text-accent" : "border-border text-sub hover:border-accent/40"
                }`}>
                <span>{f.icono}</span>{f.label}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1 divide-y divide-border">
            {lista.length === 0 && <p className="text-center text-sub text-[13px] py-8">No hay recursos en esta categoría.</p>}
            {lista.map((r) => (
              <div key={r.titulo} className="flex items-center gap-3 py-3">
                <div className="w-12 h-12 rounded-xl bg-accent-soft grid place-items-center text-2xl shrink-0">{r.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[14px] leading-tight">{r.titulo}</span>
                    {r.etiqueta && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-soft text-accent">{r.etiqueta}</span>}
                  </div>
                  {r.peso && <div className="text-[11px] text-pink font-semibold mt-0.5">{r.peso}</div>}
                  <p className="text-[12.5px] text-sub leading-tight mt-0.5">{r.desc}</p>
                  <div className="text-[11px] text-hint mt-1">⬇ Descargado {r.descargas.toLocaleString()} veces</div>
                </div>
                {r.tipo === "canva" ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 rounded-xl border border-accent/40 text-accent font-bold text-[12.5px] px-3.5 py-2 hover:bg-accent-soft transition whitespace-nowrap">
                    ↗ Abrir en Canva
                  </a>
                ) : r.reclamado ? (
                  <span className="shrink-0 rounded-xl bg-green/10 text-green font-bold text-[12.5px] px-3.5 py-2 whitespace-nowrap">✓ Descargado</span>
                ) : (
                  <a href={r.url ?? "#"} className="shrink-0 rounded-xl border border-accent/40 text-accent font-bold text-[12.5px] px-3.5 py-2 hover:bg-accent-soft transition whitespace-nowrap">
                    ⬇ Descargar
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
