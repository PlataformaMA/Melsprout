"use client";

import { useMemo, useState } from "react";
import { marcarDestacado } from "@/lib/mkt-admin";
import type { CreadorEquipo } from "@/lib/mkt-admin";

// Los creadores de la plataforma, con lo que una marca querría saber de ellos.
// Aquí el equipo decide a quién pone al frente.

const ORDENES = [
  ["destacados", "Destacados primero"],
  ["seguidores", "Más seguidores"],
  ["engagement", "Mejor engagement"],
  ["campanias", "Más campañas"],
  ["nombre", "Por nombre"],
] as const;

export function MktCreadores({ lista }: { lista: CreadorEquipo[] }) {
  const [datos, setDatos] = useState(lista);
  const [busca, setBusca] = useState("");
  const [nicho, setNicho] = useState("");
  const [soloDestacados, setSoloDestacados] = useState(false);
  const [orden, setOrden] = useState<(typeof ORDENES)[number][0]>("destacados");
  const [error, setError] = useState("");

  const nichos = useMemo(
    () => [...new Set(datos.map((c) => c.nicho).filter(Boolean) as string[])].sort(),
    [datos],
  );

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtrados = datos.filter((c) => {
      if (nicho && c.nicho !== nicho) return false;
      if (soloDestacados && !c.destacado) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        (c.usuario || "").toLowerCase().includes(q) ||
        (c.titular || "").toLowerCase().includes(q)
      );
    });
    const copia = [...filtrados];
    copia.sort((a, b) => {
      if (orden === "seguidores") return b.seguidores - a.seguidores;
      if (orden === "engagement") return (b.engagement ?? 0) - (a.engagement ?? 0);
      if (orden === "campanias") return b.campanias - a.campanias;
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      return b.seguidores - a.seguidores;
    });
    return copia;
  }, [datos, busca, nicho, soloDestacados, orden]);

  async function alternar(c: CreadorEquipo) {
    // Se pinta de inmediato y se guarda detrás: si falla, se regresa solo.
    setDatos((d) => d.map((x) => (x.id === c.id ? { ...x, destacado: !x.destacado } : x)));
    const r = await marcarDestacado(c.id, !c.destacado);
    if ("error" in r) {
      setError(r.error);
      setDatos((d) => d.map((x) => (x.id === c.id ? { ...x, destacado: c.destacado } : x)));
    }
  }

  // El CSV se arma aquí con lo que ya está cargado: no hace falta otro viaje.
  function exportar() {
    const filas = [
      ["Nombre", "Usuario", "Nicho", "Ciudad", "País", "Seguidores", "Engagement", "Campañas", "Destacado"],
      ...visibles.map((c) => [
        c.nombre, c.usuario ?? "", c.nicho ?? "", c.ciudad ?? "", c.pais ?? "",
        String(c.seguidores), c.engagement != null ? `${c.engagement}%` : "",
        String(c.campanias), c.destacado ? "sí" : "no",
      ]),
    ];
    const csv = filas
      .map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    // El BOM es para que Excel en Windows no destroce los acentos.
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `creadores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const destacados = datos.filter((c) => c.destacado).length;

  return (
    <>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Creadores destacados</h1>
          <p className="text-sub text-[14px] mt-1">
            {destacados > 0
              ? `${destacados} ${destacados === 1 ? "creador destacado" : "creadores destacados"} de ${datos.length}.`
              : "Marca con la estrella a quién quieres poner al frente de las marcas."}
          </p>
        </div>
        <button onClick={exportar} disabled={visibles.length === 0}
          className="bg-accent text-white rounded-2xl px-5 h-11 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
          ⤓ Exportar
        </button>
      </div>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <label className="flex-1 min-w-[220px] flex items-center gap-2 bg-surface border border-border rounded-2xl px-3.5 h-11">
          <span className="text-hint text-[14px]">🔍</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar"
            className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        </label>
        <select value={nicho} onChange={(e) => setNicho(e.target.value)}
          className={`bg-surface border border-border rounded-2xl px-3.5 h-11 text-[13.5px] font-semibold outline-none cursor-pointer ${
            nicho ? "text-accent border-accent/40" : "text-sub"}`}>
          <option value="">Todos los nichos</option>
          {nichos.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)}
          className="bg-surface border border-border rounded-2xl px-3.5 h-11 text-[13.5px] font-semibold text-sub outline-none cursor-pointer">
          {ORDENES.map(([k, txt]) => <option key={k} value={k}>{txt}</option>)}
        </select>
        <button onClick={() => setSoloDestacados((v) => !v)}
          className={`rounded-2xl px-4 h-11 text-[13.5px] font-bold transition ${
            soloDestacados ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
          ⭐ Solo destacados
        </button>
      </div>

      {error && <p className="text-[13px] text-pink bg-pink-soft rounded-xl px-3.5 py-3 mt-3">{error}</p>}

      {visibles.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
          <h2 className="font-display font-extrabold text-[16px] mt-3">
            {datos.length === 0 ? "Todavía no hay creadores" : "Nada con esos filtros"}
          </h2>
          <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
            {datos.length === 0
              ? "Aquí van las alumnas que ya terminaron su perfil."
              : "Prueba con otro nicho o quita «solo destacados»."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
          {visibles.map((c) => (
            <article key={c.id}
              className={`bg-surface border rounded-2xl p-4 shadow-sm transition ${
                c.destacado ? "border-accent/50" : "border-border"}`}>
              <div className="flex items-start gap-3">
                {c.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar} alt="" className="w-[62px] h-[62px] rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-[62px] h-[62px] rounded-full bg-accent-soft text-accent grid place-items-center text-[16px] font-extrabold shrink-0">
                    {c.nombre.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-extrabold text-[14.5px] leading-tight truncate">{c.nombre}</h3>
                  {c.usuario && <p className="text-[12px] text-hint truncate">@{c.usuario}</p>}
                  {c.titular && <p className="text-[12.5px] text-sub leading-snug mt-1 line-clamp-2">{c.titular}</p>}
                </div>
                <button onClick={() => alternar(c)} title={c.destacado ? "Quitar de destacados" : "Destacar"}
                  className={`shrink-0 w-8 h-8 rounded-lg border grid place-items-center text-[14px] transition ${
                    c.destacado
                      ? "bg-accent border-accent text-white"
                      : "border-border text-hint hover:border-accent/50 hover:text-accent"}`}>
                  ★
                </button>
              </div>

              <div className="flex gap-1.5 flex-wrap mt-3">
                {c.nicho && (
                  <span className="text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
                    {c.nicho}
                  </span>
                )}
                {c.pro && (
                  <span className="text-[11.5px] font-bold text-green bg-green/10 rounded-full px-2.5 py-1">Pro</span>
                )}
                {(c.ciudad || c.pais) && (
                  <span className="text-[11.5px] text-sub bg-bg border border-border rounded-full px-2.5 py-1">
                    📍 {[c.ciudad, c.pais].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>

              {c.redes.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {c.redes.slice(0, 3).map((r) => (
                    <li key={r.red} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-sub capitalize">{r.red}</span>
                      <b>{abreviar(r.seguidores)}</b>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-center">
                <Num n={abreviar(c.seguidores)} t="SEGUIDORES" />
                <Num n={c.engagement != null ? `${c.engagement}%` : "—"} t="ENGAGEMENT" />
                <Num n={String(c.campanias)} t="CAMPAÑAS" />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Num({ n, t }: { n: string; t: string }) {
  return (
    <div className="min-w-0">
      <div className="font-display text-[15px] font-extrabold">{n}</div>
      <div className="text-[10px] text-hint tracking-wide truncate">{t}</div>
    </div>
  );
}

// 158000 → "158K", 2300000 → "2.3M".
function abreviar(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}
