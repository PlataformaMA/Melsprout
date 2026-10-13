"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { buscarClases, type ClaseEncontrada } from "@/lib/buscar-clases";

// Buscador de clases.
//
// El camino es bonito pero largo: cuando alguien recuerda el nombre de una
// clase y quiere volver a ella, bajar nodo por nodo es un castigo. Aquí la
// escribe y entra. Las que todavía no le tocan salen con candado, para que sepa
// que existen sin poder saltárselas.
export function BuscarClases() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [clases, setClases] = useState<ClaseEncontrada[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Busca sola mientras escribe, con una pausa para no pedir en cada tecla.
  useEffect(() => {
    if (!abierto) return;
    const q = texto.trim();
    if (q.length < 2) { setClases([]); return; }
    let vivo = true;
    setBuscando(true);
    const t = setTimeout(async () => {
      const r = await buscarClases(q);
      if (vivo) { setClases(r); setBuscando(false); }
    }, 350);
    return () => { vivo = false; clearTimeout(t); };
  }, [texto, abierto]);

  // Escape cierra, como cualquier buscador.
  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [abierto]);

  function cerrar() { setAbierto(false); setTexto(""); setClases([]); }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)}
        title="Buscar una clase" aria-label="Buscar una clase"
        className="flex items-center gap-2 bg-surface border border-border rounded-full px-3.5 py-2 text-[13px] font-bold text-sub hover:border-accent/40 transition">
        <Lupa /> <span className="hidden sm:inline">Buscar clase</span>
      </button>
    );
  }

  return (
    <div className="relative w-full sm:w-[320px]">
      <div className="flex items-center gap-2 bg-surface border border-accent/40 rounded-full px-3.5 py-2">
        <Lupa />
        <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="¿Qué clase buscas?"
          className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        <button type="button" onClick={cerrar} aria-label="Cerrar búsqueda"
          className="text-hint hover:text-sub shrink-0">✕</button>
      </div>

      {texto.trim().length >= 2 && (
        <div className="absolute z-40 left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-xl max-h-[400px] overflow-y-auto">
          {buscando ? (
            <p className="text-[13px] text-sub px-4 py-3">Buscando…</p>
          ) : clases.length === 0 ? (
            <p className="text-[13px] text-sub px-4 py-3">Ninguna clase con ese nombre.</p>
          ) : (
            clases.map((c) => <FilaClase key={c.id} clase={c} onIr={cerrar} />)
          )}
        </div>
      )}
    </div>
  );
}

function FilaClase({ clase, onIr }: { clase: ClaseEncontrada; onIr: () => void }) {
  const dentro = (
    <>
      <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 text-[13px] ${
        clase.completada ? "bg-green/15 text-green"
          : clase.abierta ? "bg-accent-soft text-accent" : "bg-bg text-hint"}`}>
        {clase.completada ? "✓" : clase.abierta ? "▶" : "🔒"}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13.5px] font-bold truncate ${clase.abierta ? "" : "text-hint"}`}>
          {clase.titulo}
        </span>
        <span className="block text-[11.5px] text-hint truncate">
          {clase.donde === clase.modulo ? clase.donde : `${clase.donde} · ${clase.modulo}`}
        </span>
      </span>
    </>
  );

  if (!clase.abierta) {
    return (
      <div className="flex items-center gap-3 px-3.5 py-2.5 opacity-70" title="Todavía no se desbloquea">
        {dentro}
      </div>
    );
  }
  return (
    <Link href={clase.href} onClick={onIr}
      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-bg transition">
      {dentro}
    </Link>
  );
}

function Lupa() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-hint" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}
