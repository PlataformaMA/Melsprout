"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listarClasesAdmin, alternarVisibilidad, exportarClases,
  type ClaseAdmin, type MundoAdmin, type EstadoClase,
} from "@/lib/clases-admin-actions";
import { DetalleClase } from "@/components/DetalleClase";
import { FormClase } from "@/components/FormClase";
import { VistaPreviaRuta } from "@/components/VistaPreviaRuta";

const ESTADOS: Record<EstadoClase, { texto: string; clase: string }> = {
  publicada: { texto: "Publicada", clase: "bg-green/10 text-green" },
  borrador: { texto: "Borrador", clase: "bg-amber-100 text-amber-700" },
  programada: { texto: "Programada", clase: "bg-blue-soft text-blue" },
  oculta: { texto: "Oculta", clase: "bg-bg text-hint border border-border" },
};

function dur(min: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m} min`;
}

// Clases y recursos: la tabla del panel, con filtros y acciones.
export function ClasesRecursosTab() {
  const [datos, setDatos] = useState<{ clases: ClaseAdmin[]; mundos: MundoAdmin[] } | null>(null);
  const [busca, setBusca] = useState("");
  const [mundo, setMundo] = useState("todos");
  const [nivel, setNivel] = useState("todos");
  const [estado, setEstado] = useState<EstadoClase | "todos">("todos");
  const [menu, setMenu] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<ClaseAdmin | null>(null);
  const [editando, setEditando] = useState<ClaseAdmin | null | undefined>(undefined); // undefined = cerrado
  const [previa, setPrevia] = useState(false);

  const cargar = () => listarClasesAdmin().then(setDatos);
  useEffect(() => { cargar(); }, []);

  const niveles = useMemo(
    () => [...new Set((datos?.clases || []).map((c) => c.nivel).filter(Boolean))] as string[],
    [datos]
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (datos?.clases || []).filter((c) => {
      if (mundo !== "todos" && c.moduloId !== mundo) return false;
      if (nivel !== "todos" && c.nivel !== nivel) return false;
      if (estado !== "todos" && c.estado !== estado) return false;
      if (!q) return true;
      return c.titulo.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
    });
  }, [datos, busca, mundo, nivel, estado]);

  async function ocultar(c: ClaseAdmin) {
    setMenu(null);
    const r = await alternarVisibilidad(c.id, c.estado === "oculta");
    if ("error" in r) { alert(r.error); return; }
    cargar();
  }

  async function exportar() {
    const r = await exportarClases();
    if ("error" in r) { alert(r.error); return; }
    const blob = new Blob(["﻿" + r.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = r.nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div onClick={() => setMenu(null)}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight">Clases de la ruta</h1>
          <p className="text-sub text-[13px] mt-0.5">Gestiona todas las clases y los recursos de aprendizaje.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={() => setPrevia(true)}
            className="border border-border bg-surface rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-sub hover:border-accent/40 transition">
            👁 Vista previa
          </button>
          <button onClick={exportar}
            className="border border-border bg-surface rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-sub hover:border-accent/40 transition">
            ⬇ Exportar
          </button>
          <button onClick={() => setEditando(null)}
            className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
            + Nueva clase
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar clase por nombre…"
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

        <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoClase | "todos")}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Todos los estados</option>
          <option value="publicada">Publicadas</option>
          <option value="borrador">Borrador</option>
          <option value="programada">Programadas</option>
          <option value="oculta">Ocultas</option>
        </select>
      </div>

      {datos === null ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Cargando clases…</p>
      ) : lista.length === 0 ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Ninguna clase coincide con esos filtros.</p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-bg text-sub">
                <tr>
                  {["#", "Clase", "Nivel", "Mundo", "Duración", "Recursos", "Estado", "AVD", "Calificación", "Comentarios", ""].map((h) => (
                    <th key={h} className="text-left font-bold px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-bg/60 transition">
                    <td className="px-3 py-2.5 text-hint font-bold">{c.orden}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => setAbierta(c)} className="flex items-center gap-3 text-left min-w-0">
                        <span className="w-14 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-[#3b0764] to-[#7c3aed] grid place-items-center shrink-0">
                          {c.portada ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.portada} alt="" className="w-full h-full object-cover" />
                          ) : <span className="text-white/80 text-[11px]">▶</span>}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold truncate max-w-[260px] hover:text-accent transition">{c.titulo}</span>
                          <span className="block text-[11.5px] text-hint truncate max-w-[260px]">
                            {c.instructor}{c.instructorRol ? ` · ${c.instructorRol}` : ""}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.nivel ? (
                        <span className="text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">{c.nivel}</span>
                      ) : <span className="text-hint">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-sub max-w-[170px] truncate">{c.mundo}</td>
                    <td className="px-3 py-2.5 text-sub whitespace-nowrap">⏱ {dur(c.duracionMin)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-sub">{c.recursos} {c.recursos === 1 ? "recurso" : "recursos"}</span>
                      {c.tieneVideo && <span className="block text-[11.5px] text-hint">1 video{c.tieneSubtitulos ? " · subtítulos" : ""}</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 ${ESTADOS[c.estado].clase}`}>
                        {ESTADOS[c.estado].texto}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 w-[92px]">
                        <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${c.avd}%` }} />
                        </div>
                        <b className="text-[11.5px] shrink-0">{c.avd}%</b>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.calificacion
                        ? <span className="font-bold">{c.calificacion} <span className="text-[#F5B301]">★</span>
                            <span className="text-hint font-normal text-[11.5px]"> ({c.votos})</span></span>
                        : <span className="text-hint">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-sub whitespace-nowrap">{c.comentarios || "—"}</td>
                    <td className="px-3 py-2.5 relative">
                      <button onClick={(e) => { e.stopPropagation(); setEditando(c); }}
                        aria-label="Editar" className="text-sub hover:text-accent px-1.5 text-[15px]">✎</button>
                      <button onClick={(e) => { e.stopPropagation(); setMenu(menu === c.id ? null : c.id); }}
                        aria-label="Acciones" className="text-sub hover:text-accent px-2 text-lg leading-none">⋮</button>
                      {menu === c.id && (
                        <div onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-10 z-20 w-[210px] bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
                          <button onClick={() => { setAbierta(c); setMenu(null); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-bg transition">
                            Ver detalle
                          </button>
                          <button onClick={() => { setEditando(c); setMenu(null); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-bg transition">
                            Editar clase
                          </button>
                          <button onClick={() => ocultar(c)}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-bg transition">
                            {c.estado === "oculta" ? "Mostrar en la plataforma" : "Ocultar de la plataforma"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abierta && (
        <DetalleClase clase={abierta} onCerrar={() => setAbierta(null)} onCambio={() => { cargar(); }} />
      )}
      {editando !== undefined && (
        <FormClase
          clase={editando}
          mundos={datos?.mundos || []}
          onCerrar={() => setEditando(undefined)}
          onGuardado={cargar}
        />
      )}
      {previa && (
        <VistaPreviaRuta
          clases={datos?.clases || []}
          mundos={datos?.mundos || []}
          onCerrar={() => setPrevia(false)}
        />
      )}
    </div>
  );
}
