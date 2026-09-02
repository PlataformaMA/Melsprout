"use client";

import { useEffect, useMemo, useState } from "react";
import { listarEstudiantes, type Estudiante, type EstadoAlumna } from "@/lib/estudiantes-actions";
import { CrearUsuarioModal } from "@/components/CrearUsuarioModal";
import { FichaEstudiante } from "@/components/FichaEstudiante";

const num = (n: number) => n.toLocaleString("es-MX");

function hace(iso: string | null): string {
  if (!iso) return "Nunca";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}

const ESTADOS: Record<EstadoAlumna, { texto: string; clase: string }> = {
  activo: { texto: "Activo", clase: "bg-green/10 text-green" },
  inactivo: { texto: "Inactivo", clase: "bg-amber-100 text-amber-700" },
  riesgo: { texto: "Riesgo", clase: "bg-red-100 text-red-600" },
  certificado: { texto: "⭐ Certificado", clase: "bg-accent-soft text-accent" },
};

type Orden = "xp" | "nombre" | "actividad" | "progreso" | "revisar";

// Tabla de estudiantes del panel: ver, filtrar y abrir la ficha de cada quien.
export function EstudiantesTab() {
  const [lista, setLista] = useState<Estudiante[] | null>(null);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState<EstadoAlumna | "todos">("todos");
  const [nivel, setNivel] = useState("todos");
  const [orden, setOrden] = useState<Orden>("xp");
  const [vista, setVista] = useState<"lista" | "tarjetas">("lista");
  const [crear, setCrear] = useState(false);
  const [abierta, setAbierta] = useState<Estudiante | null>(null);

  const cargar = () => listarEstudiantes().then(setLista);
  useEffect(() => { cargar(); }, []);

  const niveles = useMemo(
    () => [...new Set((lista || []).map((e) => e.nivel))],
    [lista]
  );

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let out = (lista || []).filter((e) => {
      if (estado !== "todos" && e.estado !== estado) return false;
      if (nivel !== "todos" && e.nivel !== nivel) return false;
      if (!q) return true;
      return e.nombre.toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q);
    });
    out = [...out].sort((a, b) => {
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
      if (orden === "progreso") return b.progreso - a.progreso;
      if (orden === "revisar") return b.porRevisar - a.porRevisar;
      if (orden === "actividad")
        return (b.ultimaActividad || "").localeCompare(a.ultimaActividad || "");
      return b.xp - a.xp;
    });
    return out;
  }, [lista, busca, estado, nivel, orden]);

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight">Estudiantes</h1>
          <p className="text-sub text-[13px] mt-0.5">Ver y manejar estudiantes.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={() => setCrear(true)}
            className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
            + Añadir usuario
          </button>
          <div className="flex bg-bg border border-border rounded-xl p-0.5">
            {([["lista", "Lista"], ["tarjetas", "Tarjetas"]] as const).map(([id, txt]) => (
              <button key={id} onClick={() => setVista(id)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold transition ${
                  vista === id ? "bg-surface text-accent shadow-sm" : "text-sub"
                }`}>{txt}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] shrink-0">
          <span className="text-accent">👥</span>
          <span className="text-sub">Total estudiantes:</span>
          <b>{num(filtrada.length)}</b>
        </span>

        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar estudiante…"
          className="flex-1 min-w-[180px] bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-accent" />

        <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoAlumna | "todos")}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Estado: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="riesgo">En riesgo</option>
          <option value="certificado">Certificados</option>
        </select>

        <select value={nivel} onChange={(e) => setNivel(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="todos">Nivel: todos</option>
          {niveles.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="xp">Ordenar: XP</option>
          <option value="nombre">Nombre</option>
          <option value="progreso">Progreso</option>
          <option value="actividad">Última actividad</option>
          <option value="revisar">Retos por revisar</option>
        </select>
      </div>

      {lista === null ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Cargando estudiantes…</p>
      ) : filtrada.length === 0 ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Nadie coincide con esos filtros.</p>
      ) : vista === "tarjetas" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrada.map((e) => <Tarjeta key={e.id} e={e} onAbrir={() => setAbierta(e)} />)}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-bg text-sub">
                <tr>
                  {["Estudiante", "Nivel", "Retos", "Estado", "Mundo actual", "Progreso", "XP", "Racha", "Última actividad", "Renovación", "Comentarios", ""].map((h) => (
                    <th key={h} className="text-left font-bold px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrada.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-bg/60 transition">
                    <td className="px-3 py-2.5">
                      <button onClick={() => setAbierta(e)} className="flex items-center gap-2.5 text-left min-w-0">
                        <Avatar e={e} />
                        <span className="min-w-0">
                          <span className="block font-bold truncate max-w-[170px] hover:text-accent transition">{e.nombre}</span>
                          <span className="block text-[11.5px] text-hint truncate max-w-[170px]">{e.email || "—"}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">{e.nivel}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {e.porRevisar > 0 ? (
                        <span className="text-[11.5px] font-bold text-pink bg-pink-soft rounded-full px-2.5 py-1">
                          {e.porRevisar} por revisar
                        </span>
                      ) : (
                        <span className="text-[11.5px] font-bold text-sub bg-bg rounded-full px-2.5 py-1">Sin pendientes</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 ${ESTADOS[e.estado].clase}`}>
                        {ESTADOS[e.estado].texto}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sub whitespace-nowrap max-w-[160px] truncate">{e.mundo || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 w-[120px]">
                        <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${e.progreso}%` }} />
                        </div>
                        <b className="text-[11.5px] shrink-0">{e.progreso}%</b>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-bold whitespace-nowrap">{num(e.xp)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">🔥 {e.racha}</td>
                    <td className="px-3 py-2.5 text-sub whitespace-nowrap">{hace(e.ultimaActividad)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {e.renovacion === null ? (
                        <span className="text-hint">—</span>
                      ) : (
                        <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 ${
                          e.renovacion ? "bg-green/10 text-green" : "bg-red-100 text-red-600"}`}>
                          {e.renovacion ? "Sí" : "No"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sub max-w-[180px] truncate">{e.notas || "—"}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => setAbierta(e)} className="text-[12px] font-bold text-accent whitespace-nowrap">Ver ficha</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {crear && <CrearUsuarioModal onCerrar={() => setCrear(false)} onCreado={cargar} />}
      {abierta && (
        <FichaEstudiante
          estudiante={abierta}
          onCerrar={() => setAbierta(null)}
          onCambio={() => { cargar(); setAbierta(null); }}
        />
      )}
    </div>
  );
}

function Avatar({ e, size = 34 }: { e: Estudiante; size?: number }) {
  if (e.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={e.avatar} alt={e.nombre} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />;
  }
  return (
    <span style={{ width: size, height: size }}
      className="rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold shrink-0">
      {e.nombre.slice(0, 2).toUpperCase()}
    </span>
  );
}

function Tarjeta({ e, onAbrir }: { e: Estudiante; onAbrir: () => void }) {
  return (
    <button onClick={onAbrir}
      className="bg-surface border border-border rounded-3xl p-4 shadow-sm text-left hover:border-accent/40 transition">
      <div className="flex items-center gap-3">
        <Avatar e={e} size={44} />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[14px] truncate">{e.nombre}</div>
          <div className="text-[11.5px] text-hint truncate">{e.email || "—"}</div>
        </div>
        <span className={`text-[11px] font-bold rounded-full px-2 py-1 shrink-0 ${ESTADOS[e.estado].clase}`}>
          {ESTADOS[e.estado].texto}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-2 rounded-full bg-border/60 overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${e.progreso}%` }} />
        </div>
        <b className="text-[12px] shrink-0">{e.progreso}%</b>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-sub mt-2.5">
        <span className="font-bold text-accent">{e.nivel}</span>
        <span>{num(e.xp)} XP</span>
        <span>🔥 {e.racha}</span>
        {e.porRevisar > 0 && <span className="text-pink font-bold">{e.porRevisar} por revisar</span>}
      </div>
      <div className="text-[11.5px] text-hint mt-1.5">{hace(e.ultimaActividad)}</div>
    </button>
  );
}
