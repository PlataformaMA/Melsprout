import Link from "next/link";
import type { ResumenMkt } from "@/lib/mkt-admin";
import { fechaCorta, dinero } from "@/lib/formato-campanias";

// El resumen de la operación del Marketplace: cuánto hay, cómo va y qué falta.
// Todo sale de la base; si una marca no tiene categoría cae en "Sin categoría"
// en vez de desaparecer de la gráfica.

const COLORES = ["#7C3AED", "#A78BFA", "#86EFAC", "#FDBA9B"] as const;

export function MktInicio({ r }: { r: ResumenMkt }) {
  const aro = [
    { texto: "Activas", n: r.estados.activas, color: COLORES[0] },
    { texto: "En revisión", n: r.estados.revision, color: COLORES[1] },
    { texto: "Completadas", n: r.estados.completadas, color: COLORES[2] },
    { texto: "Pausadas", n: r.estados.pausadas, color: COLORES[3] },
  ];
  const totalAro = aro.reduce((s, x) => s + x.n, 0);

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Inicio</h1>
      <p className="text-sub text-[14px] mt-1">Aquí tienes un resumen general de la plataforma.</p>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
        <Kpi icono="📣" texto="Campañas totales" n={r.campanias} href="/app/admin/marketplace/campanias" />
        <Kpi icono="🏷️" texto="Marcas registradas" n={r.marcas} href="/app/admin/marketplace/marcas" />
        <Kpi icono="👥" texto="Creadores registrados" n={r.creadores} href="/app/admin/marketplace/creadores" />
        <Kpi icono="📄" texto="Solicitudes pendientes" n={r.pendientes} href="/app/admin/marketplace/solicitudes" />
      </div>

      <div className="grid lg:grid-cols-2 gap-3 mt-3">
        <Tarjeta titulo="Estado de campañas">
          {totalAro === 0 ? (
            <Vacio texto="Todavía no hay campañas." />
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <Dona partes={aro} total={totalAro} />
              <ul className="space-y-2.5 flex-1 min-w-[180px]">
                {aro.map((x) => (
                  <li key={x.texto} className="flex items-center gap-2.5 text-[13.5px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.color }} />
                    <span className="text-sub flex-1">{x.texto}</span>
                    <b className="w-7 text-right">{x.n}</b>
                    <span className="text-hint w-10 text-right">
                      {Math.round((x.n / totalAro) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Marcas por categoría">
          {r.categorias.length === 0 ? (
            <Vacio texto="Todavía no hay marcas registradas." />
          ) : (
            <Barras datos={r.categorias.map((c) => ({ etiqueta: c.nombre, valor: c.total }))} />
          )}
        </Tarjeta>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 mt-3">
        <Tarjeta titulo="Estatus de pagos" accion={{ texto: "Ver todos", href: "/app/admin/marketplace/campanias" }}>
          {r.pagos.length === 0 ? (
            <Vacio texto="Todavía no hay pagos registrados." />
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-[12.5px] min-w-[460px]">
                <thead>
                  <tr className="text-hint text-left">
                    <th className="font-semibold pb-2">Marca</th>
                    <th className="font-semibold pb-2">Campaña</th>
                    <th className="font-semibold pb-2">Monto</th>
                    <th className="font-semibold pb-2">Fecha</th>
                    <th className="font-semibold pb-2">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {r.pagos.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="py-2.5">
                        <span className="flex items-center gap-2">
                          <Logo url={p.logoUrl} nombre={p.marca} />
                          <b className="truncate">{p.marca}</b>
                        </span>
                      </td>
                      <td className="py-2.5 text-sub truncate max-w-[140px]">{p.campania}</td>
                      <td className="py-2.5 font-bold whitespace-nowrap">
                        {p.monto ? dinero(p.monto, p.moneda) : "—"}
                      </td>
                      <td className="py-2.5 text-sub whitespace-nowrap">
                        {p.fecha ? fechaCorta(p.fecha) : "—"}
                      </td>
                      <td className="py-2.5"><EstadoPago estado={p.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Pagos en el mes"
          pie={`${fechaCorta(r.mes.desde)} – ${fechaCorta(r.mes.hasta)}`}>
          <div className="flex items-start gap-3 flex-wrap">
            <div>
              <div className="font-display text-3xl font-extrabold">
                ${r.mes.total.toLocaleString("en-US")} <span className="text-[16px] text-sub">MXN</span>
              </div>
              <p className="text-[12.5px] text-sub mt-0.5">Total pagado en el mes</p>
            </div>
            {r.mes.variacion !== null && (
              <span className={`text-[12px] font-bold rounded-full px-2.5 py-1 ${
                r.mes.variacion >= 0 ? "bg-green/10 text-green" : "bg-pink-soft text-pink"}`}>
                {r.mes.variacion >= 0 ? "↑" : "↓"} {Math.abs(r.mes.variacion)}%
                <span className="font-semibold"> vs. mes anterior</span>
              </span>
            )}
          </div>
          <div className="mt-5">
            <Barras datos={r.mes.semanas.map((s) => ({ etiqueta: s.etiqueta, valor: s.total }))} dinero />
          </div>
        </Tarjeta>
      </div>

      <div className="mt-3">
        <Tarjeta titulo="Últimas campañas" accion={{ texto: "Ver todas", href: "/app/admin/marketplace/campanias" }}>
          {r.ultimas.length === 0 ? (
            <Vacio texto="Todavía no hay campañas." />
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-[12.5px] min-w-[520px]">
                <thead>
                  <tr className="text-hint text-left">
                    <th className="font-semibold pb-2">Campaña</th>
                    <th className="font-semibold pb-2">Marca</th>
                    <th className="font-semibold pb-2">Estado</th>
                    <th className="font-semibold pb-2">Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {r.ultimas.map((c) => (
                    <tr key={c.id} className="border-t border-border/60">
                      <td className="py-2.5">
                        <Link href={`/app/admin/marketplace/campanias/${c.id}`}
                          className="flex items-center gap-2.5 hover:text-accent transition">
                          {c.imagenUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.imagenUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <span className="w-8 h-8 rounded-lg bg-accent-soft shrink-0" />
                          )}
                          <b className="truncate">{c.titulo}</b>
                        </Link>
                      </td>
                      <td className="py-2.5 text-sub truncate max-w-[160px]">{c.marca}</td>
                      <td className="py-2.5"><EstadoCampania estado={c.estado} activa={c.activa} /></td>
                      <td className="py-2.5 text-sub whitespace-nowrap">
                        {c.inicio ? fechaCorta(c.inicio.slice(0, 10)) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      </div>
    </>
  );
}

function Kpi({ icono, texto, n, href }: { icono: string; texto: string; n: number; href: string }) {
  return (
    <Link href={href}
      className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:border-accent/40 transition group">
      <div className="flex items-start justify-between">
        <span className="w-9 h-9 rounded-xl bg-accent-soft grid place-items-center text-[16px]">{icono}</span>
        <span className="text-hint group-hover:text-accent transition text-[13px]">›</span>
      </div>
      <p className="text-[12.5px] text-sub mt-3">{texto}</p>
      <div className="font-display text-2xl font-extrabold leading-tight">{n}</div>
    </Link>
  );
}

function Tarjeta({ titulo, accion, pie, children }: {
  titulo: string;
  accion?: { texto: string; href: string };
  pie?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-extrabold text-[15.5px]">{titulo}</h2>
        {accion && (
          <Link href={accion.href} className="text-[12.5px] font-bold text-accent shrink-0">
            {accion.texto} →
          </Link>
        )}
        {pie && <span className="text-[12px] text-hint shrink-0">📅 {pie}</span>}
      </div>
      {children}
    </section>
  );
}

// La dona de estados. Se dibuja con un solo círculo por parte y el truco del
// guion: cada arco ocupa su porcentaje de la circunferencia y empieza donde
// terminó el anterior.
function Dona({ partes, total }: { partes: { n: number; color: string }[]; total: number }) {
  const r = 54;
  const circunferencia = 2 * Math.PI * r;

  // Cada arco se dibuja completo y luego se corre hasta donde acabó el
  // anterior, así que el desfase se calcula antes de pintar, no al vuelo.
  const arcos: { largo: number; desfase: number; color: string }[] = [];
  let recorrido = 0;
  for (const p of partes) {
    if (p.n <= 0) continue;
    const largo = (p.n / total) * circunferencia;
    arcos.push({ largo, desfase: -recorrido, color: p.color });
    recorrido += largo;
  }

  return (
    <div className="relative w-[150px] h-[150px] shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        {arcos.map((a, i) => (
          <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={a.color} strokeWidth="18"
            strokeDasharray={`${a.largo} ${circunferencia - a.largo}`} strokeDashoffset={a.desfase} />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-2xl font-extrabold leading-none">{total}</div>
          <div className="text-[11.5px] text-hint">campañas</div>
        </div>
      </div>
    </div>
  );
}

function Barras({ datos, dinero: esDinero }: {
  datos: { etiqueta: string; valor: number }[];
  dinero?: boolean;
}) {
  const tope = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-[150px]">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1.5 h-full">
          <span className="text-[11.5px] font-bold">
            {esDinero ? (d.valor ? abreviar(d.valor) : "") : d.valor}
          </span>
          <div className="w-full bg-[#C4B5FD] rounded-lg transition-all"
            style={{ height: `${Math.max((d.valor / tope) * 100, d.valor > 0 ? 6 : 2)}%` }} />
          <span className="text-[11px] text-sub text-center leading-tight line-clamp-2">{d.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}

// 15000 → "15K". En la gráfica no cabe el número completo.
function abreviar(n: number): string {
  if (n >= 1000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

function EstadoPago({ estado }: { estado: string }) {
  const mapa: Record<string, [string, string]> = {
    pagado: ["Pagado", "bg-green/10 text-green"],
    en_proceso: ["En proceso", "bg-amber-100 text-amber-700"],
    pendiente: ["Pendiente", "bg-bg text-sub border border-border"],
    cancelado: ["Cancelado", "bg-pink-soft text-pink"],
  };
  const [texto, clase] = mapa[estado] ?? ["Pendiente", "bg-bg text-sub border border-border"];
  return <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${clase}`}>{texto}</span>;
}

function EstadoCampania({ estado, activa }: { estado: string; activa: boolean }) {
  const mapa: Record<string, [string, string]> = {
    aprobada: activa ? ["Activa", "bg-green/10 text-green"] : ["Pausada", "bg-amber-100 text-amber-700"],
    pendiente: ["En revisión", "bg-accent-soft text-accent"],
    cerrada: ["Completada", "bg-bg text-sub border border-border"],
    rechazada: ["Con comentarios", "bg-pink-soft text-pink"],
    borrador: ["Borrador", "bg-bg text-sub border border-border"],
  };
  const [texto, clase] = mapa[estado] ?? ["Borrador", "bg-bg text-sub border border-border"];
  return <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${clase}`}>{texto}</span>;
}

function Logo({ url, nombre }: { url: string | null; nombre: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />;
  }
  return (
    <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent grid place-items-center text-[10px] font-extrabold shrink-0">
      {nombre.slice(0, 2).toUpperCase()}
    </span>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="text-[13px] text-sub text-center py-10">{texto}</p>;
}
