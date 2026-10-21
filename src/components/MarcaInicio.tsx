"use client";

import Link from "next/link";
import { MarcaShell } from "@/components/MarcaShell";
import type { MiMarca } from "@/lib/marca-cuenta";
import type { InicioMarca } from "@/lib/marca-campanias";

// Inicio de la empresa: el resumen de sus campañas en curso.

const ESTADOS: Record<string, { txt: string; clase: string }> = {
  borrador: { txt: "Borrador", clase: "bg-bg text-hint border border-border" },
  pendiente: { txt: "En revisión", clase: "bg-amber-100 text-amber-700" },
  aprobada: { txt: "En producción", clase: "bg-green/10 text-green" },
  rechazada: { txt: "Necesita cambios", clase: "bg-pink-soft text-pink" },
  cerrada: { txt: "Cerrada", clase: "bg-bg text-hint border border-border" },
};

export function MarcaInicio({ marca, datos }: { marca: MiMarca; datos: InicioMarca }) {
  return (
    <MarcaShell marca={marca} activo="inicio">
      <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">¡Hola {marca.nombre}!</h1>
      <p className="text-sub text-[13.5px] mt-1">Revisa el resumen de tus campañas en curso</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <Tarjeta icono="📋" n={datos.activas} txt="Campañas activas" />
        <Tarjeta icono="👥" n={datos.enSeleccion} txt="Creadoras en selección" />
        <Tarjeta icono="⏱" n={datos.pendientesAprobacion} txt="Pendientes de aprobación" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start mt-7">
        <section className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-extrabold text-[17px]">Mis campañas</h2>
              <p className="text-[12.5px] text-sub">Revisa el estado y avance de todas tus campañas.</p>
            </div>
            <Link href="/app/marca/campanias" className="shrink-0 text-[12.5px] font-bold text-accent">
              Ver todas
            </Link>
          </div>

          {datos.campanias.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center mt-3">
              <p className="text-[13.5px] text-sub leading-snug">
                Todavía no tienes campañas. Crea la primera para empezar a colaborar con creadoras.
              </p>
              <Link href="/app/marca/campanias"
                className="inline-block mt-3 bg-accent text-white rounded-xl px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
                + Crear nueva campaña
              </Link>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[11.5px] text-hint border-b border-border">
                    <tr>
                      <th className="font-semibold px-4 py-2.5">Campaña</th>
                      <th className="font-semibold px-3 py-2.5">Tipo</th>
                      <th className="font-semibold px-3 py-2.5">Creadores</th>
                      <th className="font-semibold px-3 py-2.5">Estado</th>
                      <th className="font-semibold px-3 py-2.5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {datos.campanias.map((c) => {
                      const e = ESTADOS[c.estado] ?? ESTADOS.borrador;
                      return (
                        <tr key={c.id} className="hover:bg-bg transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-[13px] truncate max-w-[200px]">{c.titulo}</div>
                            <div className="text-[11.5px] text-hint">{marca.nombre}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {c.tipos.slice(0, 2).map((t) => (
                                <span key={t} className="text-[10.5px] font-semibold text-accent bg-accent-soft rounded-full px-2 py-0.5">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[13px] font-bold whitespace-nowrap">{c.creadores}</td>
                          <td className="px-3 py-3">
                            <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${e.clase}`}>
                              {e.txt}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Link href={`/app/marca/campanias/${c.id}`}
                              className="text-[12px] font-bold text-accent border border-border rounded-lg px-2.5 py-1.5 hover:border-accent/40 transition whitespace-nowrap">
                              Ver detalles
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-5">
          <section className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
            <h3 className="font-display font-extrabold text-[14px] mb-3">Actividad reciente</h3>
            {datos.actividad.length === 0 ? (
              <p className="text-[12.5px] text-sub leading-snug">
                Cuando alguien se postule a tus campañas, lo vas a ver aquí.
              </p>
            ) : (
              <div className="space-y-3">
                {datos.actividad.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent grid place-items-center text-[12px] shrink-0">👤</span>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold leading-tight">{a.titulo}</div>
                      <div className="text-[11.5px] text-hint truncate">{a.detalle}</div>
                      <div className="text-[11px] text-hint">{hace(a.fecha)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </MarcaShell>
  );
}

function Tarjeta({ icono, n, txt }: { icono: string; n: number; txt: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
      <span className="w-11 h-11 rounded-xl bg-accent-soft grid place-items-center text-[18px] shrink-0">{icono}</span>
      <div>
        <div className="font-display font-extrabold text-[22px] leading-none">{n}</div>
        <div className="text-[12px] text-hint mt-1">{txt}</div>
      </div>
    </div>
  );
}

function hace(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return min < 1 ? "Ahora" : `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Hace 1 día" : `Hace ${d} días`;
}
