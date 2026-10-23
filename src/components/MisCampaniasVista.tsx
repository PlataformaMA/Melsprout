"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { ProSeccionModal } from "@/components/ProSeccionModal";
import { misPagos } from "@/lib/creador-campanias";
import { fechaCorta, dinero } from "@/lib/formato-campanias";
import type { ColaboracionCreador, ResumenPagos } from "@/lib/creador-campanias";

// «Campañas» del creador: en qué colabora y cómo van sus pagos. Son las dos
// pestañas del diseño; el detalle de cada colaboración vive en su propia
// página.

export function MisCampaniasVista({
  nombre, avatarUrl, xp, racha, colaboraciones, pagos, bloqueado = false,
}: {
  nombre: string; avatarUrl: string | null; xp: number; racha: number;
  colaboraciones: ColaboracionCreador[];
  pagos: ResumenPagos;
  bloqueado?: boolean;
}) {
  const [proAbierto, setProAbierto] = useState(bloqueado);
  const [tab, setTab] = useState<"colaboraciones" | "pagos">("colaboraciones");

  return (
    <div className="min-h-screen bg-bg flex">
      {proAbierto && <ProSeccionModal onClose={() => setProAbierto(false)} />}
      <AppSidebar active="campanias" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5 pb-16">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold">Campañas</h1>
          <p className="text-sub text-[14px] mt-1.5">
            Aquí puedes ver el estado de tus campañas, consultar detalles y dar seguimiento a tus pagos
          </p>

          <div className="flex gap-7 border-b border-border mt-6">
            <Tab txt="Colaboraciones" on={tab === "colaboraciones"} click={() => setTab("colaboraciones")} />
            <Tab txt="Pagos" on={tab === "pagos"} click={() => setTab("pagos")} />
          </div>

          <div className="mt-7">
            {bloqueado ? (
              <Vacio
                titulo="Las campañas son parte de Boost Pro"
                texto="Con el plan puedes postularte a las colaboraciones de las marcas y cobrar por tu contenido."
              />
            ) : tab === "colaboraciones" ? (
              <Colaboraciones lista={colaboraciones} />
            ) : (
              <Pagos inicial={pagos} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ————————————————— Colaboraciones —————————————————

function Colaboraciones({ lista }: { lista: ColaboracionCreador[] }) {
  if (lista.length === 0) {
    return (
      <Vacio
        titulo="Todavía no colaboras con ninguna marca"
        texto="En el Marketplace están las campañas abiertas. Postúlate a la que te quede y aquí vas a ver cómo va."
        accion
      />
    );
  }

  const activas = lista.filter((c) => c.estado === "activa" || c.estado === "en_revision").length;

  return (
    <>
      <h2 className="font-display font-extrabold text-[19px]">
        Campañas activas: <span className="text-accent">{activas}</span>
      </h2>

      <div className="space-y-4 mt-4">
        {lista.map((c) => <TarjetaColaboracion key={c.id} c={c} />)}
      </div>
    </>
  );
}

function TarjetaColaboracion({ c }: { c: ColaboracionCreador }) {
  const completada = c.estado === "completada";
  const revision = c.estado === "en_revision";

  return (
    <article className="bg-surface border border-border rounded-3xl p-4 shadow-sm grid gap-4 md:grid-cols-[180px_1fr_1.1fr] md:items-center">
      {c.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.imagenUrl} alt="" className="w-full h-[130px] rounded-2xl object-cover" />
      ) : (
        <span className="w-full h-[130px] rounded-2xl bg-accent-soft" />
      )}

      <div className="min-w-0">
        <EstadoColab estado={c.estado} />
        <h3 className="font-display font-extrabold text-[19px] leading-tight mt-2">{c.marca}</h3>
        {c.producto && <p className="text-sub text-[14px] mt-0.5">{c.producto}</p>}
        {c.entregable && <p className="text-sub text-[13.5px] mt-1.5">{c.entregable}</p>}
        <Link href={`/app/campanias/${c.id}`}
          className="inline-flex items-center gap-1.5 text-accent font-bold text-[13.5px] mt-2.5 hover:gap-2.5 transition-all">
          Ver detalles <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="md:border-l md:border-border md:pl-5">
        <div className="grid grid-cols-2 gap-4">
          <Dato
            titulo={revision ? "Fecha de postulación" : completada ? "Periodo" : "Inicio"}
            valor={revision
              ? fechaCorta(c.postuladaAt)
              : completada
                ? `${fechaCorta(c.fechaInicio)} – ${fechaCorta(c.fechaEntrega)}`
                : fechaCorta(c.fechaInicio)}
          />
          <Dato
            titulo={revision ? "Inicio estimado" : completada ? "Contenido entregado" : "Entrega de contenido"}
            valor={revision && !c.fechaInicio ? "Por confirmar" : fechaCorta(c.fechaEntrega)}
          />
        </div>

        <div className="border-t border-border mt-4 pt-4">
          <div className="text-[13px] text-sub font-semibold flex items-center gap-1.5">
            <IcoDinero /> {revision ? "Pago estimado" : completada ? "Pago total" : "Pago"}
          </div>
          <div className="flex items-center justify-between gap-3 mt-1.5">
            <span className="font-display font-extrabold text-[18px]">
              {dinero(c.compensacion, c.moneda)}
            </span>
            <EstadoPago estado={c.pagoEstado} completada={completada} revision={revision} />
          </div>
        </div>
      </div>
    </article>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[13px] text-sub font-semibold">{titulo}</div>
      <div className="flex items-center gap-1.5 text-[14px] font-semibold mt-1">
        <IcoCalendario /> <span className="truncate">{valor}</span>
      </div>
    </div>
  );
}

function EstadoColab({ estado }: { estado: string }) {
  const m: Record<string, { txt: string; clase: string; punto: string }> = {
    activa: { txt: "Activa", clase: "bg-green/10 text-green", punto: "bg-green" },
    en_revision: { txt: "En revisión", clase: "bg-accent-soft text-accent", punto: "bg-accent" },
    completada: { txt: "Completada", clase: "bg-bg text-sub border border-border", punto: "bg-hint" },
    cancelada: { txt: "Cancelada", clase: "bg-bg text-hint border border-border", punto: "bg-hint" },
  };
  const e = m[estado] ?? m.activa;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold rounded-full px-3 py-1 ${e.clase}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.punto}`} /> {e.txt}
    </span>
  );
}

function EstadoPago({ estado, completada, revision }: {
  estado: string; completada: boolean; revision: boolean;
}) {
  if (revision) {
    return <span className="text-[12.5px] font-bold rounded-full px-3 py-1.5 bg-bg text-sub border border-border">● En revisión</span>;
  }
  if (completada || estado === "pagado") {
    return <span className="text-[12.5px] font-bold rounded-full px-3 py-1.5 bg-green/10 text-green">✓ Pagado</span>;
  }
  if (estado === "en_proceso") {
    return <span className="text-[12.5px] font-bold rounded-full px-3 py-1.5 bg-amber-100 text-amber-700">● En proceso</span>;
  }
  return <span className="text-[12.5px] font-bold rounded-full px-3 py-1.5 bg-bg text-hint border border-border">● Pendiente</span>;
}

// ————————————————— Pagos —————————————————

const FILTROS = [
  { id: "proceso", txt: "Pagos en proceso" },
  { id: "finalizados", txt: "Pagos finalizados" },
  { id: "todos", txt: "Todos los pagos" },
] as const;

function Pagos({ inicial }: { inicial: ResumenPagos }) {
  const [filtro, setFiltro] = useState<"proceso" | "finalizados" | "todos">("proceso");
  const [datos, setDatos] = useState(inicial);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  // Cada carga lleva número: si se cambia de filtro dos veces seguidas, la
  // respuesta vieja que llegue tarde no pisa a la nueva.
  const turno = useRef(0);

  async function cambiar(f: "proceso" | "finalizados" | "todos") {
    setAbierto(false);
    if (f === filtro) return;
    setFiltro(f);
    // El primer render ya trae los pagos en proceso desde el servidor.
    if (f === "proceso") { setDatos(inicial); setCargando(false); return; }

    const mio = ++turno.current;
    setCargando(true);
    const r = await misPagos(f);
    if (mio !== turno.current) return;
    setDatos(r);
    setCargando(false);
  }

  const etiqueta = FILTROS.find((f) => f.id === filtro)!.txt;

  return (
    <>
      <div className="bg-accent-soft/60 rounded-3xl px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[14px] font-bold text-sub">Ganancias obtenidas este mes</div>
          <div className="font-display text-3xl sm:text-4xl font-extrabold mt-1">
            {dinero(datos.esteMes, datos.moneda)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Linea serie={datos.serie} />
          {datos.variacion != null && (
            <div className="text-right">
              <span className={`inline-block text-[13px] font-extrabold rounded-full px-3 py-1 ${
                datos.variacion >= 0 ? "bg-surface text-green" : "bg-surface text-pink"}`}>
                {datos.variacion >= 0 ? "↑" : "↓"} {Math.abs(datos.variacion)}%
              </span>
              <div className="text-[12px] text-sub mt-1">vs. mes anterior</div>
            </div>
          )}
        </div>
      </div>

      <div className="relative inline-block mt-6">
        <button onClick={() => setAbierto((v) => !v)}
          className="font-display font-extrabold text-[19px] flex items-center gap-2">
          {etiqueta}: <span className="text-accent">{filtro === "proceso" ? datos.enCurso : datos.filas.length}</span>
          <span className="text-accent text-[13px]" aria-hidden>▾</span>
        </button>
        {abierto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
            <div className="absolute left-0 top-full mt-2 z-20 bg-surface border border-border rounded-2xl shadow-xl py-1.5 w-56">
              {FILTROS.map((f) => (
                <button key={f.id} onClick={() => void cambiar(f.id)}
                  className={`block w-full text-left px-4 py-2.5 text-[14px] hover:bg-bg transition ${
                    filtro === f.id ? "font-extrabold text-accent" : "text-sub"}`}>
                  {f.txt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {cargando ? (
        <p className="text-[14px] text-sub py-10 text-center">Cargando…</p>
      ) : datos.filas.length === 0 ? (
        <div className="mt-4">
          <Vacio
            titulo="Nada por aquí todavía"
            texto="Cuando una marca te seleccione y acuerden el pago, el calendario de cobros va a aparecer en esta tabla."
          />
        </div>
      ) : (
        <TablaPagos filas={datos.filas} />
      )}
    </>
  );
}

function TablaPagos({ filas }: { filas: ResumenPagos["filas"] }) {
  // Las filas vienen ordenadas por colaboración: se agrupan para que el nombre
  // de la campaña y el resumen se pinten una sola vez por bloque.
  const grupos: { id: string; filas: typeof filas }[] = [];
  for (const f of filas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.id === f.colaboracionId) ultimo.filas.push(f);
    else grupos.push({ id: f.colaboracionId, filas: [f] });
  }

  return (
    <div className="bg-surface border border-border rounded-3xl mt-4 overflow-x-auto shadow-sm">
      <table className="w-full min-w-[920px] text-left">
        <thead>
          <tr className="text-[13px] text-sub font-semibold">
            <th className="px-6 py-4 font-semibold">Campaña</th>
            <th className="px-3 py-4 font-semibold">Pago</th>
            <th className="px-3 py-4 font-semibold">Tipo de pago</th>
            <th className="px-3 py-4 font-semibold">Monto / Valor</th>
            <th className="px-3 py-4 font-semibold">Fecha estimada de pago</th>
            <th className="px-3 py-4 font-semibold">Estatus</th>
            <th className="px-6 py-4 font-semibold">Estatus general de pagos</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => g.filas.map((f, i) => (
            <tr key={`${g.id}-${f.numero}`} className={i === 0 && grupos[0] !== g ? "border-t border-border" : ""}>
              <td className="px-6 py-3.5 align-top">
                {i === 0 && (
                  <>
                    <div className="font-display font-extrabold text-[15px]">{f.campania}</div>
                    {f.producto && <div className="text-[13px] text-sub mt-0.5">{f.producto}</div>}
                  </>
                )}
              </td>
              <td className="px-3 py-3.5 text-[13.5px] text-sub">Pago {f.numero}</td>
              <td className="px-3 py-3.5 text-[13.5px] text-sub">{TIPO_PAGO[f.tipo] ?? f.tipo}</td>
              <td className="px-3 py-3.5 text-[13.5px] font-semibold">
                {f.valor || dinero(f.monto, f.moneda)}
              </td>
              <td className="px-3 py-3.5 text-[13.5px] text-sub">{fechaCorta(f.fecha)}</td>
              <td className="px-3 py-3.5"><EstadoFila estado={f.estado} /></td>
              <td className="px-6 py-3.5 align-top">
                {i === 0 && (
                  <div className={`rounded-xl px-4 py-3 ${
                    f.pagados === f.totalPagos ? "bg-green/10" : "bg-bg"}`}>
                    <div className="flex items-center gap-2 font-bold text-[13.5px]">
                      <span className={`w-2 h-2 rounded-full ${
                        f.pagados === f.totalPagos ? "bg-green" : "bg-accent"}`} />
                      {f.pagados} de {f.totalPagos} {f.totalPagos === 1 ? "pago" : "pagos"}
                    </div>
                    <div className="text-[12.5px] text-sub mt-0.5 pl-4">
                      {f.pagados === f.totalPagos ? "Completado" : "En curso"}
                    </div>
                  </div>
                )}
              </td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
}

const TIPO_PAGO: Record<string, string> = {
  economico: "Económico",
  intercambio: "Intercambio de producto",
  afiliados: "Afiliados",
};

function EstadoFila({ estado }: { estado: string }) {
  const m: Record<string, string> = {
    pagado: "bg-green/10 text-green",
    entregado: "bg-green/10 text-green",
    en_proceso: "bg-amber-100 text-amber-700",
    pendiente: "bg-bg text-hint border border-border",
  };
  const txt: Record<string, string> = {
    pagado: "Pagado", entregado: "Entregado", en_proceso: "En proceso", pendiente: "Pendiente",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold rounded-full px-3 py-1.5 whitespace-nowrap ${m[estado] ?? m.pendiente}`}>
      ● {txt[estado] ?? "Pendiente"}
    </span>
  );
}

// Línea de ganancias de los últimos 12 meses. Sin librería: son 12 puntos.
function Linea({ serie }: { serie: number[] }) {
  if (serie.length < 2 || serie.every((n) => n === 0)) return null;
  const alto = 46, ancho = 150;
  const max = Math.max(...serie);
  const paso = ancho / (serie.length - 1);
  const punto = (v: number, i: number) => `${i * paso},${alto - (v / max) * (alto - 6) - 3}`;
  const d = serie.map(punto).join(" L ");

  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden className="shrink-0">
      <path d={`M ${d} L ${ancho},${alto} L 0,${alto} Z`} fill="currentColor" className="text-accent/15" />
      <path d={`M ${d}`} fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
    </svg>
  );
}

// ————————————————— Piezas —————————————————

function Tab({ txt, on, click }: { txt: string; on: boolean; click: () => void }) {
  return (
    <button onClick={click}
      className={`font-display text-[20px] sm:text-[22px] font-extrabold pb-3 -mb-px border-b-[3px] transition ${
        on ? "text-accent border-accent" : "text-sub border-transparent hover:text-ink"}`}>
      {txt}
    </button>
  );
}

function Vacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: boolean }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
      <h3 className="font-display font-extrabold text-[16px] mt-3">{titulo}</h3>
      <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">{texto}</p>
      {accion && (
        <Link href="/app/marketplace"
          className="inline-block mt-4 bg-accent text-white rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
          Ver el Marketplace
        </Link>
      )}
    </div>
  );
}

const ICO = {
  width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round",
} as const;

function IcoCalendario() {
  return <svg {...ICO} className="text-hint shrink-0"><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /></svg>;
}
function IcoDinero() {
  return <svg {...ICO} className="text-hint shrink-0"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M14.3 9.8c0-1-1-1.6-2.3-1.6s-2.3.6-2.3 1.5 1 1.4 2.3 1.6 2.3.7 2.3 1.6-1 1.5-2.3 1.5-2.3-.6-2.3-1.6" /></svg>;
}
