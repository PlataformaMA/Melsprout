"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { Rango, Resumen, Barra, ResumenRes } from "@/lib/superadmin-actions";

const num = (n: number) => n.toLocaleString("es-MX");

// Tablero del superadmin: cómo va la escuela de un vistazo.
export function SuperadminResumen({ irA }: { irA?: (tab: string) => void }) {
  const [rango, setRango] = useState<Rango>("7d");
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [cargando, empezar] = useTransition();

  useEffect(() => {
    empezar(async () => {
      try {
        const res = await fetch(`/api/admin/resumen?rango=${rango}`, { cache: "no-store" });
        const r: ResumenRes = await res.json();
        if (r.ok) {
          setDatos(r.datos);
          setMotivo(null);
          try { sessionStorage.removeItem("melsprout_recargado"); } catch {}
        } else {
          setDatos(null);
          setMotivo(r.motivo);
        }
      } catch (e) {
        setDatos(null);
        setMotivo(e instanceof Error ? e.message : "No se pudo hablar con el servidor.");
      }
    });
  }, [rango]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight">Resumen</h1>
          <p className="text-sub text-[13px] mt-0.5">Vista general del desempeño de los estudiantes.</p>
        </div>
        <div className="flex items-center gap-2">
          {([["hoy", "Hoy"], ["7d", "Últimos 7 días"], ["30d", "Últimos 30 días"]] as const).map(([id, txt]) => (
            <button key={id} onClick={() => setRango(id)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
                rango === id ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:border-accent/40"
              }`}>
              {txt}
            </button>
          ))}
        </div>
      </div>

      {!datos ? (
        <div className="bg-surface border border-border rounded-3xl p-8 text-center">
          {cargando ? (
            <p className="text-sub text-[13.5px]">Cargando datos…</p>
          ) : (
            <>
              <div className="text-3xl mb-2">😕</div>
              <p className="font-bold text-[14px]">No pudimos cargar el resumen</p>
              {motivo && (
                /Failed to find Server Action/i.test(motivo) ? (
                  <p className="text-[13px] text-sub mt-2 max-w-md mx-auto leading-snug">
                    Tu navegador tiene guardada una versión anterior de la plataforma.
                    Recarga con <b>⌘ + Shift + R</b> (o Ctrl + Shift + R en Windows) y listo.
                  </p>
                ) : (
                  <p className="text-[12.5px] text-pink mt-2 max-w-lg mx-auto break-words">{motivo}</p>
                )
              )}
              <button onClick={() => window.location.reload()}
                className="mt-4 bg-accent text-white rounded-xl px-4 py-2 text-[13px] font-bold hover:brightness-110 transition">
                Recargar la página
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={cargando ? "opacity-60 transition" : "transition"}>
          {/* Tarjetas */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi icono="🗒" tono="pink" titulo="Retos pendientes de revisión" valor={datos.retosPendientes}
              pie={<button onClick={() => irA?.("avances")} className="text-accent font-bold">Ir a revisión →</button>} />
            <Kpi icono="⚠️" tono="red" titulo="En riesgo" valor={datos.enRiesgo}
              pie={<span className="text-sub">Sin actividad 7+ días</span>} />
            <Kpi icono="👥" tono="accent" titulo="Estudiantes" valor={datos.estudiantes}
              pie={<span className="text-green font-bold">+{datos.nuevosSemana} esta semana</span>} />
            <Kpi icono="📈" tono="blue" titulo="Activos esta semana" valor={datos.activosSemana}
              pie={<span className="text-green font-bold">{datos.pctActivos}% del total</span>} />
            <Kpi icono="🎓" tono="accent" titulo="Certificaciones obtenidas" valor={datos.certificaciones}
              pie={<span className="text-green font-bold">+{datos.certificacionesSemana} esta semana</span>} />
          </div>

          {/* Distribución + último acceso + segmentación */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Caja titulo="Distribución por niveles" nota="Cuántas alumnas hay en cada nivel de XP.">
              <Columnas datos={datos.niveles} />
            </Caja>

            <Caja titulo="Último acceso de alumnos" nota="Hace cuánto entró cada quien por última vez.">
              <div className="space-y-3 mt-1">
                {datos.ultimoAcceso.map((b) => (
                  <BarraH key={b.etiqueta} b={b} max={Math.max(...datos.ultimoAcceso.map((x) => x.valor), 1)} />
                ))}
              </div>
            </Caja>

            <section className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-accent text-white px-5 py-3">
                <h2 className="font-display font-extrabold text-[13px] tracking-wide uppercase">Segmentación de alumnos</h2>
              </div>
              <div className="p-5">
                <Dona segmentos={datos.segmentos} total={datos.estudiantes} />
              </div>
            </section>
          </div>

          {/* Avance por mundo + top + actividad */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Caja titulo="Avance promedio por mundo">
              <div className="space-y-2.5 mt-1 max-h-[300px] overflow-y-auto pr-1">
                {datos.avancePorMundo.length === 0 ? (
                  <p className="text-[13px] text-hint">Todavía no hay módulos activos.</p>
                ) : datos.avancePorMundo.map((m) => (
                  <div key={m.nombre}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="truncate text-sub">{m.nombre}</span>
                      <b className="shrink-0 ml-2">{m.pct}%</b>
                    </div>
                    <div className="h-2 rounded-full bg-border/60 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Caja>

            <Caja titulo="Top estudiantes" enlace={{ texto: "Ver ranking completo →", onClick: () => irA?.("usuarios") }}>
              <div className="space-y-3 mt-1">
                {datos.top.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="w-5 text-[12px] font-extrabold text-hint shrink-0">{i + 1}</span>
                    {a.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatar} alt={a.nombre} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold shrink-0">
                        {a.nombre.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/creador/${a.id}`} className="block font-bold text-[13.5px] truncate hover:text-accent transition">
                        {a.nombre}
                      </Link>
                      <div className="text-[11.5px] text-hint truncate">
                        {a.usuario ? `@${a.usuario}` : `Nivel ${a.nivel}`}
                      </div>
                    </div>
                    <b className="text-[12.5px] text-accent shrink-0">{num(a.xp)} XP</b>
                  </div>
                ))}
              </div>
            </Caja>

            <Caja titulo="Actividad reciente">
              <div className="space-y-3 mt-1">
                {datos.actividad.length === 0 ? (
                  <p className="text-[13px] text-hint">Sin movimientos en este periodo.</p>
                ) : datos.actividad.map((e, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-bg grid place-items-center text-[13px] shrink-0">{e.icono}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] leading-snug">{e.texto}</div>
                      <div className="text-[11.5px] text-hint">{e.hace}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Caja>
          </div>
        </div>
      )}
    </div>
  );
}

const TONOS: Record<string, string> = {
  pink: "bg-pink-soft text-pink",
  red: "bg-red-100 text-red-600",
  accent: "bg-accent-soft text-accent",
  blue: "bg-blue-soft text-blue",
};

function Kpi({ icono, tono, titulo, valor, pie }: {
  icono: string; tono: string; titulo: string; valor: number; pie: React.ReactNode;
}) {
  return (
    <section className="bg-surface border border-border rounded-3xl p-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className={`w-9 h-9 rounded-xl grid place-items-center text-[15px] shrink-0 ${TONOS[tono] || TONOS.accent}`}>
          {icono}
        </span>
        <span className="text-[12px] text-sub leading-snug">{titulo}</span>
      </div>
      <div className="font-display text-2xl font-extrabold mt-2.5">{num(valor)}</div>
      <div className="text-[11.5px] mt-1">{pie}</div>
    </section>
  );
}

function Caja({ titulo, nota, enlace, children }: {
  titulo: string; nota?: string; enlace?: { texto: string; onClick: () => void }; children: React.ReactNode;
}) {
  return (
    <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="font-display font-extrabold text-[15px] leading-tight">{titulo}</h2>
          {nota && <p className="text-[11.5px] text-hint mt-0.5 leading-snug">{nota}</p>}
        </div>
        {enlace && (
          <button onClick={enlace.onClick} className="text-[12px] font-bold text-accent shrink-0 whitespace-nowrap">
            {enlace.texto}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Columnas({ datos }: { datos: Barra[] }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  if (!datos.length) return <p className="text-[13px] text-hint">Sin datos todavía.</p>;
  return (
    <div className="flex items-end gap-2 h-[150px] mt-2">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1.5">
          <span className="text-[11px] font-bold">{d.valor}</span>
          <div className="w-full rounded-t-lg bg-accent transition-all"
            style={{ height: `${Math.max(4, (d.valor / max) * 100)}%` }} />
          <span className="text-[10px] text-hint text-center leading-tight line-clamp-2">{d.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}

function BarraH({ b, max }: { b: Barra; max: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1">
        <span className="text-sub">{b.etiqueta}</span>
        <b>{num(b.valor)}</b>
      </div>
      <div className="h-2.5 rounded-full bg-border/60 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${(b.valor / max) * 100}%`, background: b.color || "#7C3AED" }} />
      </div>
    </div>
  );
}

// Dona en SVG: cada segmento es un arco proporcional.
function Dona({ segmentos, total }: { segmentos: Barra[]; total: number }) {
  const suma = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  const R = 54, C = 2 * Math.PI * R;
  let acumulado = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" className="w-[130px] h-[130px] shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#EEE9F8" strokeWidth="18" />
        {segmentos.map((s) => {
          const largo = (s.valor / suma) * C;
          const el = (
            <circle key={s.etiqueta} cx="70" cy="70" r={R} fill="none" stroke={s.color || "#7C3AED"}
              strokeWidth="18" strokeDasharray={`${largo} ${C - largo}`} strokeDashoffset={-acumulado} />
          );
          acumulado += largo;
          return el;
        })}
      </svg>
      <div className="min-w-0 flex-1">
        <div className="font-display text-xl font-extrabold leading-none">{num(total)}</div>
        <div className="text-[11.5px] text-hint mb-2.5">alumnas</div>
        <div className="space-y-1.5">
          {segmentos.map((s) => (
            <div key={s.etiqueta} className="flex items-center gap-2 text-[12px]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-sub truncate flex-1">{s.etiqueta}</span>
              <b className="shrink-0">{s.valor}</b>
              <span className="text-hint shrink-0">({suma ? ((s.valor / suma) * 100).toFixed(1) : "0.0"}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
