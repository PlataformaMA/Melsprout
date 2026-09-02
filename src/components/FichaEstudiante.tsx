"use client";

import { useEffect, useState } from "react";
import type { Estudiante } from "@/lib/estudiantes-actions";
import { guardarNotas, setRenovacion } from "@/lib/estudiantes-actions";
import { listarAvances, revisarReto, type Avance } from "@/lib/admin-actions";

const num = (n: number) => n.toLocaleString("es-MX");
const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—";

// Ficha completa de una alumna: sus datos y sus retos.
export function FichaEstudiante({
  estudiante, onCerrar, onCambio,
}: {
  estudiante: Estudiante; onCerrar: () => void; onCambio: () => void;
}) {
  const [tab, setTab] = useState<"resumen" | "retos">("resumen");
  const [retos, setRetos] = useState<Avance[] | null>(null);

  useEffect(() => {
    listarAvances().then((todos) => setRetos(todos.filter((a) => a.userId === estudiante.id)));
  }, [estudiante.id]);

  const pendientes = (retos || []).filter((r) => r.revision === "pendiente" && r.estado === "publicado");
  const revisados = (retos || []).filter((r) => r.revision !== "pendiente");

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[720px] shadow-2xl my-6">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3.5 min-w-0">
            {estudiante.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={estudiante.avatar} alt={estudiante.nombre} className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-14 h-14 rounded-full bg-accent/15 text-accent grid place-items-center text-[16px] font-bold shrink-0">
                {estudiante.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-lg leading-tight truncate">{estudiante.nombre}</h2>
              <div className="text-[12.5px] text-sub truncate">{estudiante.email || "—"}</div>
              <span className="inline-block mt-1 text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-0.5">
                {estudiante.nivel}
              </span>
            </div>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none shrink-0">×</button>
        </div>

        <div className="flex gap-6 border-b border-border px-6">
          {([["resumen", "Resumen"], ["retos", `Retos de la ruta (${(retos || []).length})`]] as const).map(([id, txt]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`py-3 text-[13.5px] font-bold transition -mb-px border-b-2 whitespace-nowrap ${
                tab === id ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
              }`}>
              {txt}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {tab === "resumen" ? (
            <Resumen e={estudiante} onCambio={onCambio} />
          ) : retos === null ? (
            <p className="text-[13.5px] text-hint py-6 text-center">Cargando retos…</p>
          ) : (
            <RetosDeLaRuta
              pendientes={pendientes}
              revisados={revisados}
              onRevisado={() => listarAvances().then((t) => setRetos(t.filter((a) => a.userId === estudiante.id)))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Resumen({ e, onCambio }: { e: Estudiante; onCambio: () => void }) {
  const [notas, setNotas] = useState(e.notas || "");
  const [renov, setRenov] = useState<boolean | null>(e.renovacion);
  const [estado, setEstado] = useState("");

  async function guardar() {
    setEstado("Guardando…");
    const [a, b] = await Promise.all([guardarNotas(e.id, notas), setRenovacion(e.id, renov)]);
    setEstado("error" in a || "error" in b ? "No se pudo guardar." : "Guardado ✓");
    if (!("error" in a) && !("error" in b)) setTimeout(onCambio, 700);
  }

  const datos: [string, string][] = [
    ["Edad", e.edad ? `${e.edad} años` : "—"],
    ["País", e.pais || "—"],
    ["Nivel actual", e.nivel],
    ["Mundo actual", e.mundo || "—"],
    ["Miembro desde", fecha(e.miembroDesde)],
    ["Última actividad", fecha(e.ultimaActividad)],
    ["Clases completadas", `${e.clasesHechas} de ${e.clasesTotal}`],
    ["XP total", num(e.xp)],
    ["Racha actual", `${e.racha} ${e.racha === 1 ? "día" : "días"}`],
    ["Certificación", e.certificado ? "Obtenida ⭐" : "Todavía no"],
  ];

  return (
    <div className="space-y-5">
      <dl className="divide-y divide-border">
        {datos.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-sub">{k}</dt>
            <dd className="text-[13.5px] font-semibold text-right">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <label className="text-[12.5px] font-bold text-sub">¿Renovó?</label>
        <div className="flex gap-2 mt-1.5">
          {([[true, "Sí"], [false, "No"], [null, "Sin definir"]] as [boolean | null, string][]).map(([v, txt]) => (
            <button key={txt} onClick={() => setRenov(v)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold border transition ${
                renov === v ? "bg-accent-soft border-accent text-accent" : "bg-bg border-border text-sub"
              }`}>{txt}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[12.5px] font-bold text-sub">Notas del equipo</label>
        <textarea value={notas} onChange={(ev) => setNotas(ev.target.value)} rows={3} maxLength={2000}
          placeholder="Lo que el equipo necesita recordar de esta alumna…"
          className="w-full mt-1.5 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-accent resize-none" />
        <p className="text-[11.5px] text-hint mt-1">Solo la ve el equipo, nunca la alumna.</p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={guardar}
          className="bg-accent text-white rounded-xl px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
          Guardar
        </button>
        {estado && <span className="text-[12.5px] font-semibold text-sub">{estado}</span>}
      </div>
    </div>
  );
}

function RetosDeLaRuta({ pendientes, revisados, onRevisado }: {
  pendientes: Avance[]; revisados: Avance[]; onRevisado: () => void;
}) {
  const [ver, setVer] = useState<"pendientes" | "revisados">(pendientes.length ? "pendientes" : "revisados");
  const [abierto, setAbierto] = useState<Avance | null>(null);
  const lista = ver === "pendientes" ? pendientes : revisados;

  return (
    <div>
      <p className="text-[13px] text-sub leading-relaxed mb-3">
        Revisa las respuestas de los retos que entregó en su ruta.
      </p>

      <div className="flex gap-2 mb-4">
        {([["pendientes", `Pendientes (${pendientes.length})`], ["revisados", `Revisados (${revisados.length})`]] as const).map(([id, txt]) => (
          <button key={id} onClick={() => setVer(id)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
              ver === id ? "bg-accent text-white" : "bg-bg border border-border text-sub"
            }`}>{txt}</button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="text-[13.5px] text-hint py-6 text-center">
          {ver === "pendientes" ? "No tiene retos esperando revisión." : "Todavía no le han revisado ninguno."}
        </p>
      ) : (
        <div className="space-y-2.5">
          {lista.map((a) => (
            <div key={a.retoId} className="flex items-center gap-3 bg-bg border border-border rounded-2xl px-3.5 py-3">
              <span className="w-9 h-9 rounded-xl bg-accent-soft grid place-items-center text-[15px] shrink-0">
                {a.retoEmoji || "🎯"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[13.5px] truncate">{a.retoTitulo}</div>
                <div className="text-[11.5px] text-hint">Entregado {fecha(a.actualizado)}</div>
              </div>
              <Etiqueta revision={a.revision} />
              <button onClick={() => setAbierto(a)} className="text-[12.5px] font-bold text-accent shrink-0">Ver</button>
            </div>
          ))}
        </div>
      )}

      {abierto && (
        <RevisarReto avance={abierto} onCerrar={() => setAbierto(null)} onListo={() => { setAbierto(null); onRevisado(); }} />
      )}
    </div>
  );
}

function Etiqueta({ revision }: { revision: Avance["revision"] }) {
  const m = {
    pendiente: { t: "Pendiente", c: "bg-pink-soft text-pink" },
    aprobado: { t: "Aprobado ✓", c: "bg-green/10 text-green" },
    rechazado: { t: "Necesita ajustes", c: "bg-red-100 text-red-600" },
  }[revision];
  return <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 shrink-0 ${m.c}`}>{m.t}</span>;
}

// Revisión de una entrega: se lee su respuesta y se aprueba o se regresa.
function RevisarReto({ avance, onCerrar, onListo }: {
  avance: Avance; onCerrar: () => void; onListo: () => void;
}) {
  const [guardando, setGuardando] = useState<"aprobado" | "rechazado" | null>(null);

  async function decidir(revision: "aprobado" | "rechazado") {
    setGuardando(revision);
    const r = await revisarReto(avance.userId, avance.retoId, revision);
    setGuardando(null);
    if ("error" in r) { alert(r.error); return; }
    onListo();
  }

  const respuestas = Object.entries(avance.respuestas || {}).filter(([, v]) => (v || "").trim());

  return (
    <div className="fixed inset-0 z-[95] bg-black/50 grid place-items-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl w-full max-w-[560px] shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display font-extrabold text-[16px] truncate">{avance.retoTitulo}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <Etiqueta revision={avance.revision} />
            <span className="text-[12px] text-hint">Entregado {fecha(avance.actualizado)}</span>
          </div>

          {respuestas.length === 0 ? (
            <p className="text-[13.5px] text-hint">No escribió texto en este reto.</p>
          ) : respuestas.map(([k, v], i) => (
            <div key={k}>
              <div className="text-[12px] font-bold text-accent">Respuesta {respuestas.length > 1 ? i + 1 : ""}</div>
              <p className="text-[13.5px] text-text whitespace-pre-wrap leading-relaxed mt-1 bg-bg rounded-2xl px-3.5 py-3">{v}</p>
            </div>
          ))}

          {avance.archivoUrl && (
            /\.(mp4|mov|webm|m4v)(\?|$)/i.test(avance.archivoUrl) ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={avance.archivoUrl} controls className="w-full rounded-2xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avance.archivoUrl} alt="Entrega" className="w-full rounded-2xl border border-border" />
            )
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 px-6 py-4 border-t border-border">
          <button onClick={() => decidir("rechazado")} disabled={!!guardando}
            className="flex-1 rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-[13.5px] font-bold hover:bg-red-50 transition disabled:opacity-50">
            {guardando === "rechazado" ? "Guardando…" : "Pedir ajustes"}
          </button>
          <button onClick={() => decidir("aprobado")} disabled={!!guardando}
            className="flex-1 rounded-xl bg-accent text-white px-4 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {guardando === "aprobado" ? "Guardando…" : "Aprobar reto"}
          </button>
        </div>
      </div>
    </div>
  );
}
