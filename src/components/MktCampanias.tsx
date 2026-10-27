"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fechaCorta } from "@/lib/formato-campanias";
import type { CampaniaEquipo } from "@/lib/mkt-admin";

// Todas las campañas de la plataforma, de cualquier marca. Es la vista del
// equipo: el portal de cada empresa solo enseña las suyas.

const ESTADOS: Record<string, { txt: string; clase: string; punto: string }> = {
  aprobada: { txt: "Activa", clase: "bg-green/10 text-green", punto: "bg-green" },
  pendiente: { txt: "En revisión", clase: "bg-accent-soft text-accent", punto: "bg-accent" },
  cerrada: { txt: "Completada", clase: "bg-bg text-sub border border-border", punto: "bg-hint" },
  rechazada: { txt: "Con comentarios", clase: "bg-pink-soft text-pink", punto: "bg-pink" },
  borrador: { txt: "Borrador", clase: "bg-bg text-sub border border-border", punto: "bg-hint" },
};

const FILTROS = [
  ["todas", "Todas"],
  ["aprobada", "Activas"],
  ["pendiente", "En revisión"],
  ["borrador", "Borradores"],
  ["cerrada", "Completadas"],
] as const;

export function MktCampanias({ lista }: { lista: CampaniaEquipo[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number][0]>("todas");

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((c) => {
      if (filtro !== "todas" && c.estado !== filtro) return false;
      if (!q) return true;
      return c.titulo.toLowerCase().includes(q) || c.marca.toLowerCase().includes(q);
    });
  }, [lista, busca, filtro]);

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Campañas</h1>
      <p className="text-sub text-[14px] mt-1">
        Campañas totales: <b className="text-accent">{lista.length}</b>
      </p>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <label className="flex-1 min-w-[220px] flex items-center gap-2 bg-surface border border-border rounded-2xl px-3.5 h-11">
          <span className="text-hint text-[14px]">🔍</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar campaña o marca…"
            className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        </label>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {FILTROS.map(([k, txt]) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
              filtro === k ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
            {txt}
            {k !== "todas" && (
              <span className="ml-1.5 opacity-70">{lista.filter((c) => c.estado === k).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {visibles.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
            <h2 className="font-display font-extrabold text-[16px] mt-3">
              {lista.length === 0 ? "Todavía no hay campañas" : "Nada con ese filtro"}
            </h2>
            <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
              {lista.length === 0
                ? "Cuando una marca cree su primera campaña, te aparece aquí."
                : "Prueba con otro estado o con otro nombre."}
            </p>
          </div>
        ) : (
          visibles.map((c) => {
            const e = ESTADOS[c.estado] ?? ESTADOS.borrador;
            return (
              <article key={c.id}
                className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row">
                {c.portada ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.portada} alt=""
                    className="w-full lg:w-[190px] h-[150px] lg:h-auto object-cover shrink-0" />
                ) : (
                  <span className="w-full lg:w-[190px] h-[150px] lg:h-auto bg-accent-soft shrink-0 grid place-items-center text-3xl">📣</span>
                )}

                <div className="flex-1 min-w-0 p-4 sm:p-5">
                  <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold rounded-full px-2.5 py-1 ${e.clase}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${e.punto}`} />{e.txt}
                  </span>
                  <h3 className="font-display font-extrabold text-[17px] mt-2">{c.marca}</h3>
                  <p className="text-[13.5px] text-sub">{c.titulo}</p>
                  <p className="text-[13px] text-hint mt-1">{c.compensacion}</p>
                  <Link href={`/app/admin/marketplace/campanias/${c.id}`}
                    className="inline-block text-[13.5px] font-bold text-accent mt-2.5">
                    Ver detalles →
                  </Link>
                </div>

                <div className="lg:w-[300px] shrink-0 p-4 sm:p-5 lg:border-l border-t lg:border-t-0 border-border grid grid-cols-2 gap-x-4 gap-y-3 content-start">
                  <Dato etiqueta="Publicada" valor={fechaCorta(c.publicada?.slice(0, 10))} />
                  <Dato etiqueta="Cierra" valor={c.cierra ? fechaCorta(c.cierra.slice(0, 10)) : "Sin fecha"} />
                  <Dato etiqueta="Postulaciones" valor={String(c.postuladas)} />
                  <Dato etiqueta="Seleccionados" valor={String(c.seleccionadas)} />
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11.5px] text-hint">{etiqueta}</div>
      <div className="text-[13.5px] font-bold truncate">{valor}</div>
    </div>
  );
}
