"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listarRetosRuta, listarRetosComunidadAdmin, exportarRetos,
  type RetoRuta, type RetoComunidadAdmin, type EstadoReto,
} from "@/lib/retos-admin-actions";
import { FormRetoRuta, FormRetoComunidad } from "@/components/FormRetos";

const ESTADOS: Record<EstadoReto, { texto: string; clase: string }> = {
  publicado: { texto: "Publicado", clase: "bg-green/10 text-green" },
  borrador: { texto: "Borrador", clase: "bg-amber-100 text-amber-700" },
  oculto: { texto: "Oculto", clase: "bg-bg text-hint border border-border" },
};

const TIPO_EMOJI: Record<string, string> = {
  Tarea: "📝", Entrega: "📤", Reto: "🎯", Proyecto: "🚀", "Análisis": "🔍",
};

// Retos: los de la ruta (uno por clase) y los de la comunidad.
export function RetosAdminTab() {
  const [vista, setVista] = useState<"ruta" | "comunidad">("ruta");
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([["ruta", "Retos de la ruta"], ["comunidad", "Retos de la comunidad"]] as const).map(([id, txt]) => (
          <button key={id} onClick={() => setVista(id)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
              vista === id ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:border-accent/40"
            }`}>{txt}</button>
        ))}
      </div>
      {vista === "ruta" ? <RetosDeLaRuta /> : <RetosDeLaComunidad />}
    </div>
  );
}

function RetosDeLaRuta() {
  const [datos, setDatos] = useState<{ retos: RetoRuta[]; mundos: { id: string; nombre: string }[] } | null>(null);
  const [busca, setBusca] = useState("");
  const [mundo, setMundo] = useState("todos");
  const [nivel, setNivel] = useState("todos");
  const [estado, setEstado] = useState<EstadoReto | "todos">("todos");
  const [editando, setEditando] = useState<RetoRuta | null>(null);

  const cargar = () => listarRetosRuta().then(setDatos).catch(() => setDatos({ retos: [], mundos: [] }));
  useEffect(() => { cargar(); }, []);

  const niveles = useMemo(
    () => [...new Set((datos?.retos || []).map((r) => r.nivel).filter(Boolean))] as string[],
    [datos]
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (datos?.retos || []).filter((r) => {
      if (mundo !== "todos" && r.mundo !== (datos?.mundos.find((m) => m.id === mundo)?.nombre || "")) return false;
      if (nivel !== "todos" && r.nivel !== nivel) return false;
      if (estado !== "todos" && r.estado !== estado) return false;
      if (!q) return true;
      return r.texto.toLowerCase().includes(q) || r.claseTitulo.toLowerCase().includes(q);
    });
  }, [datos, busca, mundo, nivel, estado]);

  async function exportar() {
    const r = await exportarRetos();
    if ("error" in r) { alert(r.error); return; }
    const blob = new Blob(["﻿" + r.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = r.nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight">Retos de la ruta de aprendizaje</h1>
          <p className="text-sub text-[13px] mt-0.5">
            Gestiona todos los retos asignados dentro de las clases de la ruta.
          </p>
        </div>
        <button onClick={exportar}
          className="border border-border bg-surface rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-sub hover:border-accent/40 transition">
          ⬇ Exportar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar reto por nombre…"
          className="flex-1 min-w-[200px] bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-accent" />
        <select value={mundo} onChange={(e) => setMundo(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Todos los mundos</option>
          {(datos?.mundos || []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <select value={nivel} onChange={(e) => setNivel(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Todos los niveles</option>
          {niveles.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoReto | "todos")}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Todos los estados</option>
          <option value="publicado">Publicados</option>
          <option value="borrador">Borrador</option>
          <option value="oculto">Ocultos</option>
        </select>
      </div>

      {datos === null ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Cargando retos…</p>
      ) : lista.length === 0 ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Ningún reto coincide con esos filtros.</p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-bg text-sub">
                <tr>
                  {["Reto", "Clase", "Nivel", "Mundo", "Tipo", "Puntos", "Entregas", "Estado", ""].map((h) => (
                    <th key={h} className="text-left font-bold px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.claseId} className="border-t border-border hover:bg-bg/60 transition">
                    <td className="px-3 py-2.5">
                      <button onClick={() => setEditando(r)} className="flex items-center gap-3 text-left min-w-0">
                        <span className="w-12 h-8 rounded-lg overflow-hidden bg-accent-soft grid place-items-center shrink-0">
                          {r.portada ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.portada} alt="" className="w-full h-full object-cover" />
                          ) : <span className="text-[13px]">{TIPO_EMOJI[r.tipo] || "🎯"}</span>}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold truncate max-w-[280px] hover:text-accent transition">
                            {r.texto || <span className="text-hint font-normal">Sin reto todavía</span>}
                          </span>
                          {r.instrucciones && (
                            <span className="block text-[11.5px] text-hint truncate max-w-[280px]">{r.instrucciones}</span>
                          )}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="max-w-[180px]">
                        <div className="truncate text-sub">{r.claseTitulo}</div>
                        <Link href={`/app/clase/${r.claseId}`} target="_blank"
                          className="text-[11.5px] font-bold text-accent">Ver clase →</Link>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.nivel ? (
                        <span className="text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">{r.nivel}</span>
                      ) : <span className="text-hint">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-sub max-w-[160px] truncate">{r.mundo}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-sub">{TIPO_EMOJI[r.tipo] || "🎯"} {r.tipo}</span>
                    </td>
                    <td className="px-3 py-2.5 font-bold whitespace-nowrap">{r.xp} XP</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-sub">{r.entregas}</span>
                      {r.porRevisar > 0 && (
                        <span className="block text-[11.5px] font-bold text-pink">{r.porRevisar} por revisar</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 ${ESTADOS[r.estado].clase}`}>
                        {ESTADOS[r.estado].texto}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => setEditando(r)} aria-label="Editar"
                        className="text-sub hover:text-accent px-1.5 text-[15px]">✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando && (
        <FormRetoRuta reto={editando} onCerrar={() => setEditando(null)} onGuardado={cargar} />
      )}
    </div>
  );
}

function RetosDeLaComunidad() {
  const [lista, setLista] = useState<RetoComunidadAdmin[] | null>(null);
  const [editando, setEditando] = useState<RetoComunidadAdmin | null | undefined>(undefined);

  const cargar = () => listarRetosComunidadAdmin().then(setLista).catch(() => setLista([]));
  useEffect(() => { cargar(); }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight">Retos de la comunidad</h1>
          <p className="text-sub text-[13px] mt-0.5">Los retos de varios días en los que participan todas juntas.</p>
        </div>
        <button onClick={() => setEditando(null)}
          className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
          + Nuevo reto
        </button>
      </div>

      {lista === null ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Cargando retos…</p>
      ) : lista.length === 0 ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Todavía no hay retos de comunidad.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {lista.map((r, i) => {
            const restantes = Math.max(0, r.dias - r.diaActual);
            const pct = r.dias ? Math.round((r.diaActual / r.dias) * 100) : 0;
            return (
              <article key={r.id} className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-[#3b0764] to-[#7c3aed] grid place-items-center">
                  {r.portada ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.portada} alt="" className="w-full h-full object-cover" />
                  ) : <span className="text-white text-3xl">{r.emoji}</span>}
                  <span className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-white/95 grid place-items-center text-[12px] font-extrabold">
                    {i + 1}
                  </span>
                  {!r.activo && (
                    <span className="absolute top-2.5 right-2.5 text-[11px] font-bold bg-black/60 text-white rounded-full px-2.5 py-1">
                      Oculto
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-display font-extrabold text-[15px] leading-tight">{r.titulo}</h2>
                  {r.descripcion && (
                    <p className="text-[12.5px] text-sub mt-1 leading-snug line-clamp-2">{r.descripcion}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-2 rounded-full bg-border/60 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11.5px] font-bold text-sub shrink-0">{r.diaActual}/{r.dias} días</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
                      👥 {r.inscritos} {r.inscritos === 1 ? "inscrita" : "inscritas"}
                    </span>
                    <span className="text-[11.5px] font-bold text-sub bg-bg border border-border rounded-full px-2.5 py-1">
                      +{r.xpDia} XP al día
                    </span>
                    {r.xpBonus > 0 && (
                      <span className="text-[11.5px] font-bold text-sub bg-bg border border-border rounded-full px-2.5 py-1">
                        +{r.xpBonus} bonus
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
                    <span className="text-[11.5px] text-hint">
                      {!r.iniciaAt ? "Sin fecha de inicio"
                        : restantes > 0 ? `${restantes} ${restantes === 1 ? "día restante" : "días restantes"}`
                        : "Terminado"}
                    </span>
                    <button onClick={() => setEditando(r)}
                      className="text-[12.5px] font-bold text-accent">Ajustes</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editando !== undefined && (
        <FormRetoComunidad reto={editando} onCerrar={() => setEditando(undefined)} onGuardado={cargar} />
      )}
    </div>
  );
}
