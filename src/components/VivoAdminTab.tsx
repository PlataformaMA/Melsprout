"use client";

import { useEffect, useMemo, useState } from "react";
import { listarVivoAdmin, exportarVivo, type ClaseVivoAdmin, type EstadoVivo } from "@/lib/vivo-admin-actions";
import { FormVivoClase } from "@/components/FormVivoClase";

const ESTADOS: Record<EstadoVivo, { texto: string; clase: string }> = {
  en_vivo: { texto: "En vivo", clase: "bg-red-100 text-red-600" },
  programada: { texto: "Programada", clase: "bg-blue-soft text-blue" },
  terminada: { texto: "Terminada", clase: "bg-green/10 text-green" },
  borrador: { texto: "Borrador", clase: "bg-amber-100 text-amber-700" },
};

function cuando(iso: string, zona: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: zona || "America/Mexico_City",
  });
}
function dur(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m} min`;
}

// Clases en vivo: agendar, publicar y ver cómo salieron.
export function VivoAdminTab() {
  const [datos, setDatos] = useState<{ clases: ClaseVivoAdmin[]; mundos: { id: string; nombre: string }[] } | null>(null);
  const [busca, setBusca] = useState("");
  const [mundo, setMundo] = useState("todos");
  const [estado, setEstado] = useState<EstadoVivo | "todos">("todos");
  const [editando, setEditando] = useState<ClaseVivoAdmin | null | undefined>(undefined);

  const cargar = () => fetch(`/api/admin/datos?que=vivo`, { cache: "no-store" }).then((r) => r.json())
    .then((d) => setDatos(d.error ? { clases: [], mundos: [] } : d))
    .catch(() => setDatos({ clases: [], mundos: [] }));
  useEffect(() => { cargar(); }, []);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (datos?.clases || []).filter((c) => {
      if (mundo !== "todos" && c.moduloId !== mundo) return false;
      if (estado !== "todos" && c.estado !== estado) return false;
      if (!q) return true;
      return c.titulo.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
    });
  }, [datos, busca, mundo, estado]);

  async function exportar() {
    const r = await exportarVivo();
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
          <h1 className="font-display text-2xl font-extrabold leading-tight">Clases en vivo</h1>
          <p className="text-sub text-[13px] mt-0.5">Agenda las sesiones y comparte su grabación después.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar clase por nombre…"
          className="flex-1 min-w-[200px] bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-accent" />
        <select value={mundo} onChange={(e) => setMundo(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Todos los mundos</option>
          {(datos?.mundos || []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoVivo | "todos")}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Todos los estados</option>
          <option value="programada">Programadas</option>
          <option value="en_vivo">En vivo</option>
          <option value="terminada">Terminadas</option>
          <option value="borrador">Borrador</option>
        </select>
      </div>

      {datos === null ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Cargando clases…</p>
      ) : lista.length === 0 ? (
        <p className="text-[13.5px] text-hint py-8 text-center">
          Todavía no hay clases en vivo. Crea la primera con &laquo;+ Nueva clase&raquo;.
        </p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-bg text-sub">
                <tr>
                  {["Clase", "Instructor", "Cuándo", "Duración", "Recursos", "Asistentes", "Estado", ""].map((h) => (
                    <th key={h} className="text-left font-bold px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-bg/60 transition">
                    <td className="px-3 py-2.5">
                      <button onClick={() => setEditando(c)} className="flex items-center gap-3 text-left min-w-0">
                        <span className="w-14 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-[#3b0764] to-[#7c3aed] grid place-items-center shrink-0">
                          {c.portada ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.portada} alt="" className="w-full h-full object-cover" />
                          ) : <span className="text-white/80 text-[11px]">🎥</span>}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold truncate max-w-[240px] hover:text-accent transition">{c.titulo}</span>
                          <span className="block text-[11.5px] text-hint truncate max-w-[240px]">
                            {c.categoria || c.mundo || "Sin categoría"}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="max-w-[150px]">
                        <div className="truncate">{c.instructor}</div>
                        {c.instructorRol && <div className="text-[11.5px] text-hint truncate">{c.instructorRol}</div>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-sub whitespace-nowrap">{cuando(c.iniciaAt, c.zonaHoraria)}</td>
                    <td className="px-3 py-2.5 text-sub whitespace-nowrap">⏱ {dur(c.duracionMin)}</td>
                    <td className="px-3 py-2.5 text-sub whitespace-nowrap">
                      {c.recursos}
                      {c.grabacionUrl && <span className="block text-[11.5px] text-hint">🎬 grabación</span>}
                    </td>
                    <td className="px-3 py-2.5 font-bold whitespace-nowrap">{c.asistentes}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 ${ESTADOS[c.estado].clase}`}>
                        {ESTADOS[c.estado].texto}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => setEditando(c)} aria-label="Editar"
                        className="text-sub hover:text-accent px-1.5 text-[15px]">✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando !== undefined && (
        <FormVivoClase
          clase={editando}
          mundos={datos?.mundos || []}
          onCerrar={() => setEditando(undefined)}
          onGuardado={cargar}
        />
      )}
    </div>
  );
}
