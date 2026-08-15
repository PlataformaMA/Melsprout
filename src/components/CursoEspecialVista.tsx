"use client";

import Link from "next/link";
import type { CursoEspecial } from "@/lib/cursos-db";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { formatoDuracion } from "@/components/EspecialesVista";

export type RankItem = { id: string; nombre: string; avatar: string | null; xp: number; esTu: boolean };

// Detalle de un curso especial: banner, sus clases y la barra de la derecha.
export function CursoEspecialVista({
  yo, curso, completadas, top, miPosicion,
}: {
  yo: { nombre: string; avatar: string | null; racha: number; gemas: number; xp: number };
  curso: CursoEspecial;
  completadas: string[];
  top: RankItem[];
  miPosicion: number;
}) {
  const hechas = new Set(completadas);

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="especiales" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {yo.racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {yo.gemas}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={yo.avatar} nombre={yo.nombre} />
          </header>

          <Link href="/app/especiales"
            className="w-10 h-10 rounded-full bg-surface border border-border grid place-items-center text-lg hover:border-accent/40 transition mb-4"
            aria-label="Volver">←</Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <div className="min-w-0">
              {/* Banner */}
              <div className="rounded-3xl overflow-hidden bg-[#0B0B12] grid place-items-center aspect-[16/5] sm:aspect-[16/4]">
                {curso.portada ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={curso.portada} alt={curso.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-extrabold text-white text-2xl px-4 text-center">{curso.nombre}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                <h1 className="font-display text-xl font-extrabold">
                  {curso.clases.length} {curso.clases.length === 1 ? "Clase" : "Clases"}
                </h1>
                <span className="text-[13px] text-sub">⏱ {formatoDuracion(curso.minutos)}</span>
                <span className="text-[13px] text-sub">👥 {curso.estudiantes}</span>
                {curso.patrocinador && (
                  <span className="inline-flex items-center gap-2 bg-accent-soft text-accent rounded-full px-3 py-1 text-[12px] font-bold">
                    Patrocinado por <b>{curso.patrocinador}</b>
                  </span>
                )}
              </div>

              {curso.descripcion && (
                <p className="text-sub text-[14px] leading-relaxed mt-2">{curso.descripcion}</p>
              )}

              {curso.clases.length === 0 ? (
                <p className="text-[13.5px] text-hint mt-6">Este curso todavía no tiene clases publicadas.</p>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {curso.clases.map((c) => {
                    const hecha = hechas.has(c.id);
                    return (
                      // Los cursos especiales no se bloquean por orden: se pueden ver desde cualquiera.
                      <Link key={c.id} href={`/app/clase/${c.id}`}
                        className="flex flex-col bg-surface border border-border rounded-2xl p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                        <div className="relative aspect-square rounded-xl overflow-hidden"
                          style={{ background: "linear-gradient(150deg,#7C3AED,#4F46E5 60%,#2563EB)" }}>
                          {c.portada && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.portada} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          )}
                        </div>
                        <p className="font-bold text-[13.5px] leading-tight mt-2.5 line-clamp-2 min-h-[2.2rem]">{c.titulo}</p>
                        <span className={`inline-block self-start mt-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                          hecha ? "bg-green/15 text-green" : "bg-accent-soft text-accent"
                        }`}>
                          {hecha ? "Completado" : "Pendiente"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Barra derecha */}
            <aside className="space-y-5 lg:sticky lg:top-5">
              <section className="bg-surface border border-border rounded-3xl p-4 shadow-sm">
                <h3 className="font-display font-extrabold text-[15px] mb-3">Desafíos del día</h3>
                <Desafio icono="/desafios/rayo.png" texto="Gana 10 EXP" progreso={0} total={10} />
                <Desafio icono="/desafios/diana.png" texto="Obtén un puntaje de 90% o más en 1 lección" progreso={0} total={1} />
              </section>

              <section className="bg-surface border border-border rounded-3xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-extrabold text-[15px]">Top colaboradores</h3>
                  <Link href="/app/ruta" className="text-[12px] text-accent font-semibold">Ver top</Link>
                </div>
                <div className="space-y-2.5">
                  {top.map((r, i) => (
                    <Link key={r.id} href={`/app/creador/${r.id}`} className="flex items-center gap-2.5 group">
                      <span className="w-4 text-[12px] text-hint font-bold shrink-0">{i + 1}</span>
                      {r.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.avatar} alt={r.nombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center text-[11px] font-bold shrink-0">
                          {r.nombre.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold truncate group-hover:text-accent transition">{r.nombre}</span>
                        <span className="block text-[11.5px] text-sub">{r.xp.toLocaleString("es-MX")} XP</span>
                      </span>
                      {i === 0 && <span className="shrink-0">👑</span>}
                    </Link>
                  ))}
                  {top.length === 0 && <p className="text-[13px] text-hint">Todavía no hay ranking.</p>}
                </div>

                <div className="border-t border-border mt-3 pt-3">
                  <div className="text-[12px] text-hint font-semibold mb-2">Tu ranking</div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-[12px] text-hint font-bold shrink-0">{miPosicion}</span>
                    {yo.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={yo.avatar} alt={yo.nombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center text-[11px] font-bold shrink-0">
                        {yo.nombre.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold truncate">{yo.nombre}</span>
                      <span className="block text-[11.5px] text-sub">{yo.xp.toLocaleString("es-MX")} XP</span>
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Desafio({ icono, texto, progreso, total }: { icono: string; texto: string; progreso: number; total: number }) {
  const pct = total ? Math.min(100, Math.round((progreso / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icono} alt="" className="w-8 h-8 object-contain shrink-0" draggable={false} />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-bold leading-tight">{texto}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-2 rounded-full bg-[#EEEBF6] overflow-hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-sub shrink-0">{progreso} / {total}</span>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/desafios/cofre.png" alt="" className="w-8 h-8 object-contain shrink-0" draggable={false} />
    </div>
  );
}
