"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MarcaEquipo } from "@/lib/mkt-admin";

// Todas las marcas registradas. Las que todavía no tienen dueño son las de
// ejemplo que vinieron con la plataforma: se marcan para no confundirlas con
// una empresa de verdad que se dio de alta.

export function MktMarcas({ lista }: { lista: MarcaEquipo[] }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estatus, setEstatus] = useState("");
  const [pais, setPais] = useState("");

  const categorias = useMemo(
    () => [...new Set(lista.map((m) => m.categoria).filter(Boolean) as string[])].sort(),
    [lista],
  );
  const paises = useMemo(
    () => [...new Set(lista.map((m) => m.pais).filter(Boolean) as string[])].sort(),
    [lista],
  );

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((m) => {
      if (categoria && m.categoria !== categoria) return false;
      if (pais && m.pais !== pais) return false;
      if (estatus === "activa" && !(m.activa && m.aprobada)) return false;
      if (estatus === "revision" && m.aprobada) return false;
      if (estatus === "pausada" && m.activa) return false;
      if (!q) return true;
      return (
        m.nombre.toLowerCase().includes(q) ||
        (m.categoria || "").toLowerCase().includes(q) ||
        (m.lema || "").toLowerCase().includes(q)
      );
    });
  }, [lista, busca, categoria, estatus, pais]);

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Marcas</h1>
      <p className="text-sub text-[14px] mt-1">Todas las marcas registradas en la plataforma.</p>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <label className="flex-1 min-w-[240px] flex items-center gap-2 bg-surface border border-border rounded-2xl px-3.5 h-11">
          <span className="text-hint text-[14px]">🔍</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar marca, categoría o palabra clave…"
            className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        </label>
        <Filtro valor={categoria} set={setCategoria} vacio="Categoría" opciones={categorias} />
        <Filtro valor={estatus} set={setEstatus} vacio="Estatus"
          opciones={[["activa", "Activa"], ["revision", "En revisión"], ["pausada", "Pausada"]]} />
        {paises.length > 0 && <Filtro valor={pais} set={setPais} vacio="País" opciones={paises} />}
      </div>

      <p className="text-[14px] mt-4">
        Marcas totales: <b className="text-accent">{visibles.length}</b>
      </p>

      {visibles.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
          <h2 className="font-display font-extrabold text-[16px] mt-3">Nada con esos filtros</h2>
          <p className="text-sub text-[13.5px] mt-1.5">Prueba quitando alguno.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
          {visibles.map((m) => (
            <Link key={m.id} href={`/app/admin/marketplace/marcas/${m.id}`}
              className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:border-accent/40 transition flex flex-col">
              <div className="flex items-start gap-3">
                {m.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.logoUrl} alt="" className="w-[70px] h-[70px] rounded-xl object-contain bg-bg p-2 shrink-0" />
                ) : (
                  <span className="w-[70px] h-[70px] rounded-xl bg-accent-soft text-accent grid place-items-center text-[17px] font-extrabold shrink-0">
                    {m.nombre.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-extrabold text-[15.5px] leading-tight truncate">{m.nombre}</h3>
                    <Estatus activa={m.activa} aprobada={m.aprobada} />
                  </div>
                  {m.categoria && (
                    <span className="inline-block mt-1.5 text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
                      {m.categoria}
                    </span>
                  )}
                  {m.lema && <p className="text-[13px] text-sub leading-snug mt-1.5 line-clamp-2">{m.lema}</p>}
                </div>
              </div>

              {!m.tieneDueno && (
                <p className="text-[11.5px] text-hint mt-2.5">Marca de ejemplo · todavía sin cuenta de empresa</p>
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border text-center">
                <Num icono="📣" n={m.campanias} t="Campañas" />
                <Num icono="👥" n={m.creadores} t="Creadores" />
                <Num icono="⭐" n={m.calificacion ?? "—"} t="Calificación" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Filtro({ valor, set, vacio, opciones }: {
  valor: string;
  set: (v: string) => void;
  vacio: string;
  opciones: string[] | [string, string][];
}) {
  const pares: [string, string][] = opciones.map((o) =>
    Array.isArray(o) ? o : [o, o],
  );
  return (
    <select value={valor} onChange={(e) => set(e.target.value)}
      className={`bg-surface border border-border rounded-2xl px-3.5 h-11 text-[13.5px] font-semibold outline-none cursor-pointer ${
        valor ? "text-accent border-accent/40" : "text-sub"}`}>
      <option value="">{vacio}</option>
      {pares.map(([k, txt]) => <option key={k} value={k}>{txt}</option>)}
    </select>
  );
}

function Estatus({ activa, aprobada }: { activa: boolean; aprobada: boolean }) {
  const [txt, clase, punto] = !aprobada
    ? ["En revisión", "bg-accent-soft text-accent", "bg-accent"]
    : !activa
      ? ["Pausada", "bg-amber-100 text-amber-700", "bg-amber-500"]
      : ["Activa", "bg-green/10 text-green", "bg-green"];
  return (
    <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1 ${clase}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${punto}`} />{txt}
    </span>
  );
}

function Num({ icono, n, t }: { icono: string; n: number | string; t: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[14px] font-extrabold flex items-center justify-center gap-1">
        <span className="text-[12px]">{icono}</span>{n}
      </div>
      <div className="text-[11px] text-hint truncate">{t}</div>
    </div>
  );
}
