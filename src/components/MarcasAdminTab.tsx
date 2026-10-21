"use client";

import { useState, useEffect, useCallback } from "react";
import { listarEmpresas, aprobarEmpresa } from "@/lib/marca-cuenta";
import { campaniasPendientes, revisarCampania } from "@/lib/marca-campanias";
import type { EmpresaAdmin } from "@/lib/marca-cuenta";

// El equipo revisa a las empresas y a sus campañas antes de que salgan.
export function MarcasAdminTab() {
  const [sub, setSub] = useState<"empresas" | "campanias">("empresas");
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [pend, setPend] = useState<Awaited<ReturnType<typeof campaniasPendientes>>>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [e, c] = await Promise.all([listarEmpresas(), campaniasPendientes()]);
    setEmpresas(e); setPend(c); setCargando(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const sinAprobar = empresas.filter((e) => !e.aprobada).length;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          ["empresas", `Empresas${sinAprobar ? ` · ${sinAprobar} por aprobar` : ` (${empresas.length})`}`],
          ["campanias", `Campañas por revisar${pend.length ? ` · ${pend.length}` : ""}`],
        ] as const).map(([k, txt]) => (
          <button key={k} onClick={() => setSub(k)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
              sub === k ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
            {txt}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-[13.5px] text-sub py-8 text-center">Cargando…</p>
      ) : sub === "empresas" ? (
        empresas.length === 0 ? (
          <Vacio texto="Todavía no se ha registrado ninguna empresa." />
        ) : (
          <div className="space-y-2">
            {empresas.map((e) => (
              <div key={e.id} className={`flex flex-wrap items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 ${e.aprobada ? "" : "border-amber-200 bg-amber-50/40"}`}>
                {e.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.logoUrl} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent grid place-items-center text-[12px] font-extrabold shrink-0">
                    {e.nombre.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="text-[14px]">{e.nombre}</b>
                    {e.aprobada
                      ? <Pill txt="Aprobada" />
                      : <Pill txt="Por aprobar" ambar />}
                  </div>
                  <div className="text-[12px] text-hint truncate">
                    {e.correo ?? "sin correo"}
                    {e.categoria ? ` · ${e.categoria}` : ""}
                    {` · ${e.campanias} ${e.campanias === 1 ? "campaña" : "campañas"}`}
                  </div>
                  {e.sitio && (
                    <a href={e.sitio} target="_blank" rel="noreferrer"
                      className="text-[12px] font-bold text-accent break-all">{e.sitio} →</a>
                  )}
                </div>
                <button onClick={async () => {
                  const r = await aprobarEmpresa(e.id, !e.aprobada);
                  if ("error" in r) { alert(r.error); return; }
                  cargar();
                }}
                  className={`shrink-0 rounded-xl px-4 py-2 text-[12.5px] font-bold transition ${
                    e.aprobada ? "border border-border text-sub hover:border-pink/40" : "bg-green text-white hover:brightness-110"}`}>
                  {e.aprobada ? "Poner en pausa" : "Aprobar"}
                </button>
              </div>
            ))}
          </div>
        )
      ) : pend.length === 0 ? (
        <Vacio texto="No hay campañas esperando revisión." />
      ) : (
        <div className="space-y-3">
          {pend.map((c) => <FilaCampania key={c.id} c={c} onCambio={cargar} />)}
        </div>
      )}
    </div>
  );
}

function FilaCampania({ c, onCambio }: {
  c: { id: string; titulo: string; marca: string; descripcion: string | null; fecha: string };
  onCambio: () => void;
}) {
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function revisar(aprobar: boolean) {
    setOcupado(true);
    const r = await revisarCampania(c.id, aprobar, nota);
    setOcupado(false);
    if ("error" in r) { alert(r.error); return; }
    onCambio();
  }

  return (
    <article className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <b className="text-[14.5px]">{c.titulo}</b>
        <span className="text-[12px] text-hint">· {c.marca}</span>
      </div>
      {c.descripcion && (
        <p className="text-[13px] text-sub leading-relaxed mt-2 whitespace-pre-wrap bg-bg rounded-xl px-3.5 py-3">
          {c.descripcion}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <input value={nota} onChange={(e) => setNota(e.target.value)}
          placeholder="Qué tiene que cambiar (obligatorio si la regresas)"
          className="flex-1 min-w-[200px] bg-bg border border-border rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-accent" />
        <button onClick={() => revisar(true)} disabled={ocupado}
          className="bg-green text-white rounded-xl px-4 py-2 text-[12.5px] font-bold disabled:opacity-50">
          Aprobar
        </button>
        <button onClick={() => revisar(false)} disabled={ocupado}
          className="border border-border text-sub rounded-xl px-4 py-2 text-[12.5px] font-bold disabled:opacity-50">
          Regresar con comentarios
        </button>
      </div>
    </article>
  );
}

function Pill({ txt, ambar }: { txt: string; ambar?: boolean }) {
  return (
    <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
      ambar ? "bg-amber-100 text-amber-700" : "bg-green/10 text-green"}`}>
      {txt}
    </span>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
      <p className="text-[13.5px] text-sub max-w-sm mx-auto leading-snug">{texto}</p>
    </div>
  );
}
