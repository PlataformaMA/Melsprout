"use client";

import Link from "next/link";
import { AvatarInstructor } from "@/components/Instructor";
import type { CursoEspecial } from "@/lib/cursos-db";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";

// Listado de Cursos Especiales (patrocinados / bonus).
export function EspecialesVista({
  yo, cursos,
}: {
  yo: { nombre: string; avatar: string | null; racha: number; gemas: number };
  cursos: CursoEspecial[];
}) {
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

          <h1 className="font-display text-2xl font-extrabold mb-4">Cursos Especiales</h1>

          {cursos.length === 0 ? (
            <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/octi.png" alt="" className="w-24 mx-auto" />
              <h2 className="font-display font-extrabold text-lg mt-3">Todavía no hay cursos especiales</h2>
              <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
                Aquí van los cursos patrocinados y los bonus. Cuando publiquemos uno, lo vas a ver en esta sección.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {cursos.map((c) => (
                <article key={c.id} className="bg-surface border border-border rounded-3xl p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-[190px] aspect-video sm:aspect-square rounded-2xl overflow-hidden shrink-0 bg-[#0B0B12] grid place-items-center">
                      {c.portada ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.portada} alt={c.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-extrabold text-white/80 text-lg px-3 text-center">{c.nombre}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col">
                      <h2 className="font-display text-lg font-extrabold leading-tight">{c.nombre}</h2>

                      {c.patrocinador && (
                        <span className="inline-flex items-center gap-2 self-start mt-2 bg-accent-soft text-accent rounded-full pl-3 pr-2.5 py-1 text-[12px] font-bold">
                          Patrocinado por
                          {c.patrocinadorLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.patrocinadorLogo} alt={c.patrocinador} className="h-3.5 object-contain" />
                          ) : (
                            <b>{c.patrocinador}</b>
                          )}
                        </span>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-sub mt-2.5">
                        <span>📘 {c.clases.length} {c.clases.length === 1 ? "clase" : "clases"}</span>
                        <span>⏱ {formatoDuracion(c.minutos)}</span>
                        <span>👥 {c.estudiantes} {c.estudiantes === 1 ? "estudiante" : "estudiantes"}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <AvatarInstructor nombre={c.instructor} size={24} />
                        <span className="text-[13px] font-semibold">{c.instructor}</span>
                      </div>

                      <Link href={`/app/especiales/${c.id}`}
                        className="mt-4 sm:mt-auto block text-center bg-accent text-white rounded-xl py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
                        Ver más
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function formatoDuracion(min: number): string {
  if (min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
