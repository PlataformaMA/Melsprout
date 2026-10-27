"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Solicitud } from "@/lib/mkt-admin";

// Las campañas que las marcas mandaron a revisión. El equipo entra a cada una
// y decide: aprobar (sale al Marketplace) o regresarla con comentarios.
export function MktSolicitudes({ lista }: { lista: Solicitud[] }) {
  const [busca, setBusca] = useState("");
  const [orden, setOrden] = useState<"recientes" | "antiguas">("recientes");

  // Se filtra y ordena aquí: son pocas y así no hay viaje al servidor por letra.
  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtradas = q
      ? lista.filter((s) =>
          s.titulo.toLowerCase().includes(q) || s.marca.toLowerCase().includes(q))
      : lista;
    const copia = [...filtradas];
    copia.sort((a, b) => {
      const x = a.fecha || "", y = b.fecha || "";
      return orden === "recientes" ? y.localeCompare(x) : x.localeCompare(y);
    });
    return copia;
  }, [lista, busca, orden]);

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Solicitudes de campañas</h1>
      <p className="text-sub text-[14px] mt-1">
        Lo que las marcas mandaron a revisión. Nada sale al Marketplace sin pasar por aquí.
      </p>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <label className="flex-1 min-w-[220px] flex items-center gap-2 bg-surface border border-border rounded-2xl px-3.5 h-11">
          <span className="text-hint text-[14px]">🔍</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar marca o campaña…"
            className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        </label>
        <label className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-3.5 h-11">
          <span className="text-hint text-[13px]">↕</span>
          <select value={orden} onChange={(e) => setOrden(e.target.value as "recientes" | "antiguas")}
            className="bg-transparent text-[13.5px] font-semibold outline-none cursor-pointer">
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
          </select>
        </label>
      </div>

      <div className="mt-5 space-y-3">
        {visibles.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
            <h2 className="font-display font-extrabold text-[16px] mt-3">
              {lista.length === 0 ? "No hay nada por revisar" : "Nada con esa búsqueda"}
            </h2>
            <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
              {lista.length === 0
                ? "Cuando una marca publique una campaña, te va a aparecer aquí."
                : "Prueba con otro nombre de marca o de campaña."}
            </p>
          </div>
        ) : (
          visibles.map((s) => (
            <article key={s.id}
              className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4 flex-wrap sm:flex-nowrap">
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt="" className="w-16 h-16 rounded-xl object-contain bg-bg p-1.5 shrink-0" />
              ) : (
                <span className="w-16 h-16 rounded-xl bg-accent-soft text-accent grid place-items-center text-[15px] font-extrabold shrink-0">
                  {s.marca.slice(0, 2).toUpperCase()}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="font-display font-extrabold text-[15px] leading-tight">{s.titulo}</h3>
                {s.descripcion && (
                  <p className="text-[13px] text-sub leading-snug mt-1 line-clamp-2">{s.descripcion}</p>
                )}
                <p className="text-[12px] text-hint mt-1">{s.marca}</p>
              </div>

              <div className="font-display font-extrabold text-[15px] shrink-0 sm:text-right sm:w-[130px]">
                {s.compensacion}
              </div>

              <Link href={`/app/admin/marketplace/solicitudes/${s.id}`}
                className="shrink-0 bg-accent-soft text-accent rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:bg-accent hover:text-white transition">
                Revisar
              </Link>
            </article>
          ))
        )}
      </div>
    </>
  );
}
