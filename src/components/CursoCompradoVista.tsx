"use client";

import { useState } from "react";
import Link from "next/link";
import type { CursoEspecial } from "@/lib/cursos-db";
import type { Clase } from "@/lib/data";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { AvatarInstructor } from "@/components/Instructor";
import { BannerCurso } from "@/components/VentaCursoVista";
import { formatoDuracion } from "@/components/EspecialesVista";

type Pestana = "contenido" | "certificado" | "detalles";

function dur(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}h` : `${m} min`;
}

// Lo que ve quien YA tiene el curso: sus clases, el certificado y los detalles.
export function CursoCompradoVista({
  yo, curso, completadas,
}: {
  yo: { nombre: string; avatar: string | null; racha: number; gemas: number };
  curso: CursoEspecial;
  completadas: string[];
}) {
  const [tab, setTab] = useState<Pestana>("contenido");
  const hechas = new Set(completadas);
  const listas = curso.clases.filter((c) => hechas.has(c.id)).length;
  const pct = curso.clases.length ? Math.round((listas / curso.clases.length) * 100) : 0;
  const completo = curso.clases.length > 0 && listas === curso.clases.length;

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

          <BannerCurso curso={curso} />

          {/* Progreso del curso */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-2.5 rounded-full bg-border/60 overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[12.5px] font-bold text-sub shrink-0">
              {listas}/{curso.clases.length} clases
            </span>
          </div>

          {/* Pestañas */}
          <div className="flex gap-6 border-b border-border mt-5 mb-5 overflow-x-auto">
            {([
              ["contenido", "Contenido"],
              ["certificado", "Certificado"],
              ["detalles", "Detalles del curso"],
            ] as const).map(([id, txt]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 whitespace-nowrap ${
                  tab === id ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
                }`}>
                {txt}
              </button>
            ))}
          </div>

          {tab === "contenido" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {curso.clases.map((c, i) => (
                <TarjetaClase key={c.id} c={c} n={i + 1} hecha={hechas.has(c.id)} />
              ))}
            </div>
          )}

          {tab === "certificado" && (
            <section className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm text-center max-w-xl">
              <div className="text-4xl">🎓</div>
              <h2 className="font-display font-extrabold text-lg mt-2">
                {completo ? "¡Tu certificado está listo!" : "Tu certificado te espera"}
              </h2>
              <p className="text-[13.5px] text-sub mt-1.5 leading-relaxed">
                {completo
                  ? "Terminaste todas las clases del curso. Descárgalo y añádelo a tu perfil de LinkedIn."
                  : `Termina las ${curso.clases.length} clases del curso para obtenerlo. Llevas ${listas}.`}
              </p>
              {completo ? (
                <Link href="/app/perfil"
                  className="inline-block mt-4 bg-accent text-white rounded-2xl px-6 py-2.5 text-[14px] font-bold hover:brightness-110 transition">
                  Ver mi certificado
                </Link>
              ) : (
                <div className="mt-4 inline-block bg-bg border border-border rounded-2xl px-6 py-2.5 text-[13.5px] font-bold text-sub">
                  Te faltan {curso.clases.length - listas} {curso.clases.length - listas === 1 ? "clase" : "clases"}
                </div>
              )}
            </section>
          )}

          {tab === "detalles" && (
            <div className="space-y-5 max-w-2xl">
              <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
                <h2 className="font-display font-extrabold text-[17px]">{curso.nombre}</h2>
                {curso.descripcion && (
                  <p className="text-[13.5px] text-sub mt-2 leading-relaxed">{curso.descripcion}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-sub mt-3">
                  <span>📘 {curso.clases.length} {curso.clases.length === 1 ? "clase" : "clases"}</span>
                  <span>⏱ {formatoDuracion(curso.minutos)}</span>
                  <span>👥 {curso.estudiantes}</span>
                  {curso.nivel && <span>📊 Nivel {curso.nivel}</span>}
                </div>
                <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-border">
                  <AvatarInstructor nombre={curso.instructor} size={38} />
                  <div>
                    <div className="font-bold text-[14px] leading-tight">{curso.instructor}</div>
                    <div className="text-[12px] text-sub">Instructor</div>
                  </div>
                </div>
              </section>

              {curso.aprenderas.length > 0 && (
                <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
                  <h2 className="font-display font-extrabold text-[17px]">¿Qué aprenderás?</h2>
                  <ul className="mt-3 space-y-2.5">
                    {curso.aprenderas.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-sub leading-relaxed">
                        <span className="text-accent mt-0.5 shrink-0">✓</span>{a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {curso.incluye && (
                <p className="bg-accent-soft text-accent text-[13px] rounded-2xl px-4 py-3 leading-relaxed">
                  {curso.incluye}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TarjetaClase({ c, n, hecha }: { c: Clase; n: number; hecha: boolean }) {
  const pendiente = !c.grabada;
  const Contenedor = pendiente ? "div" : Link;

  return (
    <Contenedor
      href={`/app/clase/${c.id}`}
      className={`bg-surface border border-border rounded-3xl p-3 shadow-sm flex flex-col transition ${
        pendiente ? "opacity-70" : "hover:border-accent/40"
      }`}
    >
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#0B0B12] grid place-items-center">
        {c.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.portada} alt="" className="w-full h-full object-cover" />
        ) : <span className="text-white/70 text-2xl">▶</span>}
        <span className="absolute bottom-2 right-2 bg-black/65 text-white text-[11px] font-bold rounded px-1.5 py-0.5">
          {dur(c.duracionMin)}
        </span>
      </div>

      <div className="text-[11.5px] font-bold text-accent mt-2.5">Clase {n}</div>
      <h3 className="font-display font-extrabold text-[14.5px] leading-tight mt-0.5">{c.titulo}</h3>

      <div className="flex items-center gap-2 mt-2.5">
        <AvatarInstructor nombre={c.instructor} size={22} />
        <span className="text-[12.5px] text-sub font-semibold truncate">{c.instructor}</span>
      </div>

      <div className="mt-3">
        {pendiente ? (
          <span className="inline-block text-[11.5px] font-bold text-sub bg-bg border border-border rounded-full px-2.5 py-1">
            Próximamente
          </span>
        ) : hecha ? (
          <span className="inline-block text-[11.5px] font-bold text-green bg-green/10 rounded-full px-2.5 py-1">
            Completado ✓
          </span>
        ) : (
          <span className="inline-block text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
            Pendiente
          </span>
        )}
      </div>
    </Contenedor>
  );
}
