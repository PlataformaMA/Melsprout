"use client";

import { useState, useTransition } from "react";
import { ModalRevisarVideo } from "@/components/ModalRevisarVideo";
import { guardarColaboracion } from "@/lib/marca-colaboraciones";
import type { Colaboracion, Etapa } from "@/lib/marca-colaboraciones";

// Las pestañas de Colaboraciones (seguimiento y pagos) y Envíos.
//
// Las tres leen la MISMA lista de creadoras seleccionadas; cambian las
// columnas. Todo se edita en la propia celda y se guarda al momento.

type Opciones = {
  etapas: { valor: Etapa; texto: string }[];
  cumplimientos: { valor: string; texto: string }[];
  pagos: { valor: string; texto: string }[];
  envios: { valor: string; texto: string }[];
};

const COLOR_ETAPA: Record<Etapa, string> = {
  no_empezado: "bg-bg text-hint border border-border",
  en_proceso: "bg-blue-soft text-blue",
  aprobado: "bg-green/10 text-green",
  por_corregir: "bg-pink-soft text-pink",
};

const COLOR_CUMPLIMIENTO: Record<string, string> = {
  a_tiempo: "bg-green/10 text-green",
  entrega_tardia: "bg-amber-100 text-amber-700",
  entrega_incumplida: "bg-pink-soft text-pink",
};

const COLOR_ENVIO: Record<string, string> = {
  en_preparacion: "bg-bg text-hint border border-border",
  en_transito: "bg-blue-soft text-blue",
  entregado: "bg-green/10 text-green",
  retrasado: "bg-pink-soft text-pink",
};

export function MarcaColaboraciones({
  lista, opciones, vista,
}: {
  lista: Colaboracion[]; opciones: Opciones; vista: "colaboraciones" | "envios";
}) {
  const [filas, setFilas] = useState(lista);
  const [sub, setSub] = useState<"seguimiento" | "pagos">("seguimiento");
  // La colaboración cuyo video se está revisando, si hay alguna abierta.
  const [revisando, setRevisando] = useState<Colaboracion | null>(null);
  const [busca, setBusca] = useState("");
  const [, startTransition] = useTransition();

  function cambiar(aplicacionId: string, campos: Partial<Colaboracion>) {
    setFilas((f) => f.map((x) => (x.aplicacionId === aplicacionId ? { ...x, ...campos } : x)));
    startTransition(async () => { await guardarColaboracion(aplicacionId, campos); });
  }

  const q = busca.trim().toLowerCase();
  const visibles = filas.filter((f) => !q || f.nombre.toLowerCase().includes(q));

  if (filas.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
        <p className="text-[13.5px] text-sub max-w-md mx-auto leading-snug">
          Todavía no has seleccionado a ninguna creadora. En la pestaña <b>Creadores</b> eliges
          con quién vas a trabajar, y aquí les das seguimiento.
        </p>
      </div>
    );
  }

  return (
    <div>
      {revisando && (
        <ModalRevisarVideo colaboracionId={revisando.id} creador={revisando.nombre}
          onCerrar={() => setRevisando(null)} />
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {vista === "colaboraciones" &&
          ([["seguimiento", "Seguimiento"], ["pagos", "Pagos"]] as const).map(([k, txt]) => (
            <button key={k} onClick={() => setSub(k)}
              className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition ${
                sub === k ? "bg-accent-soft text-accent" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
              {txt}
            </button>
          ))}
        <label className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2 ml-auto min-w-[200px]">
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nombre o usuario…"
            className="flex-1 min-w-0 bg-transparent text-[13px] outline-none" />
        </label>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[11.5px] text-hint border-b border-border">
              <tr>
                <th className="font-semibold px-4 py-2.5">Creador</th>
                {vista === "envios" ? (
                  <>
                    <th className="font-semibold px-3 py-2.5">Dirección de envío</th>
                    <th className="font-semibold px-3 py-2.5">Paquetería / Guía</th>
                    <th className="font-semibold px-3 py-2.5">Fecha de envío</th>
                    <th className="font-semibold px-3 py-2.5">Estatus</th>
                    <th className="font-semibold px-3 py-2.5">Fecha de entrega</th>
                  </>
                ) : sub === "pagos" ? (
                  <>
                    <th className="font-semibold px-3 py-2.5">Pago 1</th>
                    <th className="font-semibold px-3 py-2.5">Fecha pago 1</th>
                    <th className="font-semibold px-3 py-2.5">Pago 2</th>
                    <th className="font-semibold px-3 py-2.5">Fecha pago 2</th>
                    <th className="font-semibold px-3 py-2.5">Completado</th>
                    <th className="font-semibold px-3 py-2.5">Estatus</th>
                  </>
                ) : (
                  <>
                    <th className="font-semibold px-3 py-2.5">Guion</th>
                    <th className="font-semibold px-3 py-2.5">Grabación</th>
                    <th className="font-semibold px-3 py-2.5">Entrega final</th>
                    <th className="font-semibold px-3 py-2.5">Material</th>
                    <th className="font-semibold px-3 py-2.5">Fecha de entrega</th>
                    <th className="font-semibold px-3 py-2.5">Cumplimiento</th>
                    <th className="font-semibold px-3 py-2.5">Calificación</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibles.map((f) => (
                <tr key={f.aplicacionId} className="hover:bg-bg/60 transition">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {f.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center text-[10px] font-bold shrink-0">
                          {f.nombre.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-[12.5px] truncate max-w-[130px]">{f.nombre}</div>
                        {f.usuario && <div className="text-[11px] text-hint truncate">@{f.usuario}</div>}
                      </div>
                    </div>
                  </td>

                  {vista === "envios" ? (
                    <>
                      <td className="px-3 py-2.5">
                        <Texto valor={f.direccion} marcador="Ciudad, calle, CP…"
                          onCambio={(v) => cambiar(f.aplicacionId, { direccion: v })} ancho={170} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Texto valor={f.paqueteria} marcador="DHL, Estafeta…"
                          onCambio={(v) => cambiar(f.aplicacionId, { paqueteria: v })} ancho={110} />
                        <Texto valor={f.guia} marcador="Nº de guía"
                          onCambio={(v) => cambiar(f.aplicacionId, { guia: v })} ancho={110} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Fecha valor={f.envioFecha} onCambio={(v) => cambiar(f.aplicacionId, { envioFecha: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Selector valor={f.envioEstado} opciones={opciones.envios}
                          color={COLOR_ENVIO[f.envioEstado]}
                          onCambio={(v) => cambiar(f.aplicacionId, { envioEstado: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Fecha valor={f.entregaFecha} onCambio={(v) => cambiar(f.aplicacionId, { entregaFecha: v })} />
                      </td>
                    </>
                  ) : sub === "pagos" ? (
                    <>
                      <td className="px-3 py-2.5">
                        <Numero valor={f.pago1} onCambio={(v) => cambiar(f.aplicacionId, { pago1: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Fecha valor={f.pago1Fecha} onCambio={(v) => cambiar(f.aplicacionId, { pago1Fecha: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Numero valor={f.pago2} onCambio={(v) => cambiar(f.aplicacionId, { pago2: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Fecha valor={f.pago2Fecha} onCambio={(v) => cambiar(f.aplicacionId, { pago2Fecha: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => cambiar(f.aplicacionId, { pagoCompletado: !f.pagoCompletado })}
                          className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 transition ${
                            f.pagoCompletado ? "bg-green/10 text-green" : "bg-bg text-hint border border-border"}`}>
                          {f.pagoCompletado ? "Sí" : "No"}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <Selector valor={f.pagoEstado} opciones={opciones.pagos}
                          color={f.pagoEstado === "pagado" ? "bg-green/10 text-green" : "bg-pink-soft text-pink"}
                          onCambio={(v) => cambiar(f.aplicacionId, { pagoEstado: v })} />
                      </td>
                    </>
                  ) : (
                    <>
                      {(["guion", "grabacion", "entregaFinal"] as const).map((k) => (
                        <td key={k} className="px-3 py-2.5">
                          <Selector valor={f[k]} opciones={opciones.etapas} color={COLOR_ETAPA[f[k]]}
                            onCambio={(v) => cambiar(f.aplicacionId, { [k]: v as Etapa })} />
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {/* Lo que subió la creadora se revisa aquí dentro; el
                              enlace de al lado es por si lo mandó por fuera. */}
                          <button onClick={() => setRevisando(f)}
                            className="text-[11.5px] font-bold text-accent bg-accent-soft rounded-lg px-2 py-1 whitespace-nowrap hover:bg-accent hover:text-white transition">
                            ▶ Revisar
                          </button>
                          {f.materialUrl ? (
                            <a href={f.materialUrl} target="_blank" rel="noreferrer"
                              className="text-[11.5px] font-bold text-accent whitespace-nowrap">⬇</a>
                          ) : (
                            <Texto valor={f.materialUrl} marcador="Enlace"
                              onCambio={(v) => cambiar(f.aplicacionId, { materialUrl: v })} ancho={90} />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Fecha valor={f.fechaEntrega} onCambio={(v) => cambiar(f.aplicacionId, { fechaEntrega: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Selector valor={f.cumplimiento ?? ""} opciones={opciones.cumplimientos}
                          color={COLOR_CUMPLIMIENTO[f.cumplimiento ?? ""] ?? "bg-bg text-hint border border-border"}
                          vacio="—" onCambio={(v) => cambiar(f.aplicacionId, { cumplimiento: v })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Estrellas valor={f.calificacion}
                          onCambio={(v) => cambiar(f.aplicacionId, { calificacion: v })} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11.5px] text-hint mt-2.5 leading-snug">
        Todo se guarda solo. Al marcar un envío «En tránsito» con su guía, o un pago como
        completado, a la creadora le llega el aviso.
      </p>
    </div>
  );
}

// ————— Celdas editables —————
function Selector({ valor, opciones, color, onCambio, vacio }: {
  valor: string; opciones: { valor: string; texto: string }[]; color: string;
  onCambio: (v: string) => void; vacio?: string;
}) {
  return (
    <select value={valor} onChange={(e) => onCambio(e.target.value)}
      className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 outline-none cursor-pointer appearance-none ${color}`}>
      {vacio && <option value="">{vacio}</option>}
      {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
    </select>
  );
}

function Texto({ valor, marcador, onCambio, ancho = 140 }: {
  valor: string | null; marcador: string; onCambio: (v: string) => void; ancho?: number;
}) {
  const [v, setV] = useState(valor ?? "");
  return (
    <input value={v} style={{ width: ancho }} placeholder={marcador}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== (valor ?? "")) onCambio(v); }}
      className="bg-transparent border border-transparent hover:border-border focus:border-accent rounded-lg px-2 py-1 text-[12px] outline-none transition" />
  );
}

function Numero({ valor, onCambio }: { valor: number | null; onCambio: (v: number | null) => void }) {
  const [v, setV] = useState(valor != null ? String(valor) : "");
  return (
    <div className="flex items-center gap-1">
      <span className="text-[12px] text-hint">$</span>
      <input value={v} type="number" min={0} style={{ width: 70 }}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = v ? Number(v) : null;
          if (n !== valor) onCambio(n);
        }}
        className="bg-transparent border border-transparent hover:border-border focus:border-accent rounded-lg px-1.5 py-1 text-[12px] outline-none transition" />
    </div>
  );
}

function Fecha({ valor, onCambio }: { valor: string | null; onCambio: (v: string | null) => void }) {
  return (
    <input type="date" value={(valor ?? "").slice(0, 10)}
      onChange={(e) => onCambio(e.target.value || null)}
      className="bg-transparent border border-transparent hover:border-border focus:border-accent rounded-lg px-1.5 py-1 text-[11.5px] outline-none transition w-[120px]" />
  );
}

function Estrellas({ valor, onCambio }: { valor: number | null; onCambio: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onCambio(n)} onMouseEnter={() => setHover(n)}
          aria-label={`${n} de 5`}
          className={`text-[14px] leading-none transition ${
            (hover || valor || 0) >= n ? "text-accent" : "text-border"}`}>
          ★
        </button>
      ))}
    </div>
  );
}
