"use client";

import { useMemo, useRef, useState } from "react";
import { mensajesDe } from "@/lib/mensajes-marca";
import { HiloMensajes } from "@/components/HiloMensajes";
import { fechaCorta } from "@/lib/formato-campanias";
import type { Conversacion, Mensaje } from "@/lib/mensajes-marca";

// La bandeja del equipo: las marcas a la izquierda, la conversación a la
// derecha. En móvil no caben las dos, así que se ve una a la vez.

export function MktMensajes({ lista, abierta, mensajes }: {
  lista: Conversacion[];
  abierta: Conversacion | null;
  mensajes: Mensaje[];
}) {
  const [sel, setSel] = useState<Conversacion | null>(abierta);
  const [hilo, setHilo] = useState<Mensaje[]>(mensajes);
  const [busca, setBusca] = useState("");
  const [soloSinLeer, setSoloSinLeer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const turno = useRef(0);

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((c) => {
      if (soloSinLeer && c.sinLeer === 0) return false;
      if (!q) return true;
      return c.nombre.toLowerCase().includes(q) || (c.ultimo || "").toLowerCase().includes(q);
    });
  }, [lista, busca, soloSinLeer]);

  // El hilo se carga al tocar la marca, no en un efecto: así no se dispara
  // una consulta cada vez que se vuelve a pintar la lista.
  async function abrir(c: Conversacion) {
    if (c.marcaId === sel?.marcaId) return;
    const mio = ++turno.current;
    setSel(c);
    setCargando(true);
    const m = await mensajesDe(c.marcaId);
    if (mio !== turno.current) return;
    setHilo(m);
    setCargando(false);
  }

  const sinLeerTotal = lista.reduce((n, c) => n + c.sinLeer, 0);

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Mensajes</h1>
      <p className="text-sub text-[14px] mt-1">
        Conversaciones del equipo con las marcas.
        {sinLeerTotal > 0 && <b className="text-accent"> {sinLeerTotal} sin leer.</b>}
      </p>

      <div className="grid lg:grid-cols-[360px_1fr] gap-3 mt-5">
        <section className={`bg-surface border border-border rounded-2xl overflow-hidden flex flex-col ${
          sel ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3 border-b border-border flex gap-2">
            <label className="flex-1 min-w-0 flex items-center gap-2 bg-bg border border-border rounded-xl px-3 h-10">
              <span className="text-hint text-[13px]">🔍</span>
              <input value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar marcas o conversaciones…"
                className="flex-1 min-w-0 bg-transparent text-[13px] outline-none" />
            </label>
            <button onClick={() => setSoloSinLeer((v) => !v)}
              className={`shrink-0 rounded-xl px-3 h-10 text-[12.5px] font-bold transition ${
                soloSinLeer ? "bg-accent text-white" : "bg-bg border border-border text-sub"}`}>
              Sin leer
            </button>
          </div>

          <ul className="overflow-y-auto max-h-[62vh] divide-y divide-border">
            {visibles.length === 0 ? (
              <li className="p-8 text-center text-[13px] text-sub">
                {lista.length === 0 ? "Todavía no hay marcas registradas." : "Nada con esa búsqueda."}
              </li>
            ) : (
              visibles.map((c) => (
                <li key={c.marcaId}>
                  <button onClick={() => abrir(c)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition ${
                      sel?.marcaId === c.marcaId ? "bg-accent-soft/60" : "hover:bg-bg"}`}>
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt="" className="w-11 h-11 rounded-xl object-contain bg-bg p-1 shrink-0" />
                    ) : (
                      <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent grid place-items-center text-[12px] font-extrabold shrink-0">
                        {c.nombre.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <b className="text-[13.5px] truncate">{c.nombre}</b>
                        {c.fecha && <span className="text-[11px] text-hint shrink-0">{fechaCorta(c.fecha)}</span>}
                      </span>
                      <span className="block text-[12.5px] text-sub truncate">
                        {c.ultimo || <span className="text-hint">Sin mensajes</span>}
                      </span>
                    </span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      c.sinLeer > 0 ? "bg-accent" : "border border-border"}`} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className={`bg-surface border border-border rounded-2xl flex flex-col min-h-[62vh] ${
          sel ? "flex" : "hidden lg:flex"}`}>
          {!sel ? (
            <div className="flex-1 grid place-items-center text-center p-8">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-accent-soft grid place-items-center text-2xl mx-auto">💬</div>
                <p className="text-[13.5px] text-sub mt-3">Elige una marca para ver la conversación.</p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 p-3.5 border-b border-border">
                <button onClick={() => setSel(null)}
                  className="lg:hidden shrink-0 text-accent text-[13.5px] font-bold">←</button>
                {sel.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sel.logoUrl} alt="" className="w-10 h-10 rounded-xl object-contain bg-bg p-1 shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent grid place-items-center text-[12px] font-extrabold shrink-0">
                    {sel.nombre.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="font-display font-extrabold text-[15px] truncate">{sel.nombre}</div>
                  <div className="text-[12px] text-hint truncate">
                    Marca{sel.categoria ? ` · ${sel.categoria}` : ""}
                  </div>
                </div>
              </header>

              {cargando ? (
                <p className="flex-1 grid place-items-center text-[13px] text-sub">Cargando…</p>
              ) : (
                <HiloMensajes key={sel.marcaId} marcaId={sel.marcaId} inicial={hilo} yoSoy="equipo" />
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
