"use client";

import { useState } from "react";
import Link from "next/link";
import type { CursoEspecial } from "@/lib/cursos-db";
import type { Testimonio } from "@/lib/acceso-actions";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { AvatarInstructor } from "@/components/Instructor";

function precioTexto(precio: number | null, moneda: string): string | null {
  if (precio == null) return null;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda || "MXN" }).format(precio);
}
const num = (n: number) => n.toLocaleString("es-MX");

// Landing de venta: lo que ve quien todavía NO compró el curso especial.
export function VentaCursoVista({
  yo, curso, testimonios,
}: {
  yo: { nombre: string; avatar: string | null; racha: number; gemas: number };
  curso: CursoEspecial;
  testimonios: Testimonio[];
}) {
  const precio = precioTexto(curso.precio, curso.moneda);
  const puedeComprar = !!curso.checkoutUrl;
  const inscritos = curso.inscritos ?? curso.estudiantes;
  const instructores = curso.instructores.length
    ? curso.instructores
    : [{ nombre: curso.instructor, foto: null }];

  const datos = [
    curso.series && {
      icono: <IcoCursos />, valor: `${curso.series} ${curso.series === 1 ? "serie de cursos" : "series de cursos"}`,
      pie: "Adquiere gran conocimiento sobre un tema",
    },
    curso.rating && {
      icono: <IcoEstrella />, valor: `${curso.rating} ★`,
      pie: curso.resenas ? `De ${num(curso.resenas)} reseñas` : "Valoración de las alumnas",
    },
    curso.nivel && {
      icono: <IcoNivel />, valor: `Nivel ${curso.nivel}`, pie: "Experiencia recomendada",
    },
    curso.semanas && {
      icono: <IcoReloj />, valor: `${curso.semanas} ${curso.semanas === 1 ? "semana" : "semanas"} para completar`,
      pie: curso.horasSemana ? `en ${curso.horasSemana} horas a la semana` : "a tu ritmo",
    },
    { icono: <IcoCalendario />, valor: "Cronograma flexible", pie: "Aprende a tu propio ritmo" },
  ].filter(Boolean) as { icono: React.ReactNode; valor: string; pie: string }[];

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

          {/* Barra de compra bajo el banner */}
          <div className="flex flex-wrap items-center gap-4 mt-4 bg-surface border border-border rounded-2xl px-4 py-3 shadow-sm">
            <BotonComprar curso={curso} chico />
            {inscritos > 0 && (
              <span className="flex items-center gap-2 text-[13px] text-sub">
                <Caritas n={Math.min(4, inscritos)} />
                <b className="text-text">{num(inscritos)}</b> ya inscrito
              </span>
            )}
            {curso.rating && (
              <span className="flex items-center gap-1.5 text-[13px] text-sub ml-auto">
                <Estrellas valor={curso.rating} />
                {curso.resenas ? `(${num(curso.resenas)})` : null}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mt-6">
            <div className="min-w-0 space-y-7">
              <section>
                <h1 className="font-display text-2xl font-extrabold">{curso.nombre}</h1>

                <h2 className="font-display font-extrabold text-[17px] mt-5">¿Qué aprenderás?</h2>
                <div className="flex flex-col sm:flex-row gap-4 mt-3">
                  {curso.portada && (
                    <span className="w-full sm:w-[210px] shrink-0 rounded-2xl overflow-hidden bg-[#0B0B12] aspect-[16/10]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={curso.portada} alt={curso.nombre} className="w-full h-full object-cover" />
                    </span>
                  )}
                  <p className="text-[14px] text-sub leading-relaxed">{curso.descripcion}</p>
                </div>

                {curso.aprenderas.length > 0 && (
                  <ul className="mt-4 space-y-2.5">
                    {curso.aprenderas.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-sub leading-relaxed">
                        <span className="text-accent mt-0.5 shrink-0">✓</span>{a}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Tira de datos del curso */}
              <section className="bg-surface border border-border rounded-3xl divide-y sm:divide-y-0 sm:divide-x divide-border grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 shadow-sm overflow-hidden">
                {datos.map((d, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center gap-2 text-accent">{d.icono}</div>
                    <div className="font-display font-extrabold text-[14.5px] leading-tight mt-1.5">{d.valor}</div>
                    <div className="text-[11.5px] text-sub mt-1 leading-snug">{d.pie}</div>
                  </div>
                ))}
              </section>

              {curso.habilidades.length > 0 && (
                <Chips titulo="Habilidades que obtendrás" items={curso.habilidades} />
              )}
              {curso.herramientas.length > 0 && (
                <Chips titulo="Herramientas que aprenderás" items={curso.herramientas} />
              )}

              {/* Certificado */}
              <section>
                <h2 className="font-display font-extrabold text-[17px] mb-3">Certificado</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface border border-border rounded-3xl p-5 shadow-sm flex items-center gap-3.5">
                    <span className="w-14 h-14 rounded-2xl bg-[#0B0B12] grid place-items-center shrink-0 overflow-hidden">
                      {curso.patrocinadorLogo || curso.portada ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={curso.portada || ""} alt="" className="w-full h-full object-cover" />
                      ) : <span className="text-white/70 text-xl">🎓</span>}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[14px] leading-tight">Certificado para compartir</div>
                      <div className="text-[12.5px] text-sub mt-0.5">Añádelo a tu perfil de LinkedIn</div>
                    </div>
                  </div>
                  {curso.incluye && (
                    <div className="bg-accent-soft rounded-3xl p-5 text-accent text-[13px] leading-relaxed">
                      {curso.incluye}
                    </div>
                  )}
                </div>
              </section>

              {testimonios.length > 0 && (
                <section>
                  <h2 className="font-display font-extrabold text-[17px] mb-3">Testimonios</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {testimonios.map((t) => (
                      <article key={t.id} className="bg-surface border border-border rounded-3xl p-4 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          {t.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.avatar} alt={t.nombre} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold">
                              {t.nombre.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[13.5px] truncate">{t.nombre}</div>
                            {t.desde && <div className="text-[11.5px] text-hint">Estudiante desde {t.desde}</div>}
                          </div>
                        </div>
                        <p className="text-[13px] text-sub mt-2.5 leading-relaxed">{t.texto}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Columna de compra */}
            <aside className="lg:sticky lg:top-5 bg-surface border border-border rounded-3xl p-5 shadow-sm space-y-5">
              {curso.patrocinador && (
                <div>
                  <div className="text-[12.5px] font-bold text-sub mb-2">Patrocinador:</div>
                  {curso.patrocinadorLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={curso.patrocinadorLogo} alt={curso.patrocinador} className="h-6 object-contain" />
                  ) : (
                    <b className="text-[15px] text-accent">{curso.patrocinador}</b>
                  )}
                </div>
              )}

              <div>
                <div className="text-[12.5px] font-bold text-sub mb-2">
                  {instructores.length === 1 ? "Instructor:" : "Instructores:"}
                </div>
                <div className="space-y-2.5">
                  {instructores.map((i) => (
                    <div key={i.nombre} className="flex items-center gap-2.5">
                      {i.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.foto} alt={i.nombre} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <AvatarInstructor nombre={i.nombre} size={36} />
                      )}
                      <span className="text-[13.5px] font-semibold truncate">{i.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>

              {precio && (
                <div className="pt-4 border-t border-border">
                  <div className="text-[12.5px] font-bold text-sub">Precio:</div>
                  <div className="font-display text-2xl font-extrabold text-accent mt-0.5">{precio}</div>
                </div>
              )}

              <BotonComprar curso={curso} />
              <p className="text-[11.5px] text-hint text-center leading-snug">
                {puedeComprar
                  ? "Al comprar se te desbloquean todas las clases del curso."
                  : "Estamos terminando de habilitar la compra. Vuelve pronto 💜"}
              </p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function BotonComprar({ curso, chico }: { curso: CursoEspecial; chico?: boolean }) {
  const clase = chico
    ? "inline-flex items-center gap-2 bg-accent text-white rounded-full px-4 py-2 text-[13px] font-bold shrink-0"
    : "flex items-center justify-center gap-2 w-full bg-accent text-white rounded-2xl py-3 text-[14px] font-bold shadow-sm shadow-accent/30";
  if (!curso.checkoutUrl) {
    return (
      <div className={chico
        ? "inline-flex items-center gap-2 bg-bg border border-border text-sub rounded-full px-4 py-2 text-[13px] font-bold shrink-0"
        : "flex items-center justify-center w-full bg-bg border border-border text-sub rounded-2xl py-3 text-[13.5px] font-bold"}>
        Próximamente
      </div>
    );
  }
  return (
    <a href={curso.checkoutUrl} target="_blank" rel="noreferrer" className={`${clase} hover:brightness-110 transition`}>
      <IcoCarrito /> {chico ? "Comprar curso" : "Comprar"}
    </a>
  );
}

export function BannerCurso({ curso }: { curso: CursoEspecial }) {
  const src = curso.banner || curso.portada;
  if (!src) {
    return (
      <div className="rounded-3xl bg-[#0B0B12] grid place-items-center aspect-[16/5] px-4">
        <span className="font-display font-extrabold text-white text-2xl text-center">{curso.nombre}</span>
      </div>
    );
  }
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={curso.nombre} className="w-full rounded-3xl select-none" draggable={false} />
  );
  if (!curso.checkoutUrl) return img;
  return (
    <a href={curso.checkoutUrl} target="_blank" rel="noreferrer"
      aria-label={`Comprar ${curso.nombre}`}
      className="block rounded-3xl hover:brightness-[1.03] transition">
      {img}
    </a>
  );
}

function Chips({ titulo, items }: { titulo: string; items: string[] }) {
  const [todo, setTodo] = useState(false);
  const visibles = todo ? items : items.slice(0, 6);
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-extrabold text-[17px]">{titulo}</h2>
        {items.length > 6 && (
          <button onClick={() => setTodo((v) => !v)} className="text-[12.5px] font-bold text-accent">
            {todo ? "Mostrar menos" : "Mostrar todo"}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {visibles.map((h, i) => (
          <span key={i} className="flex items-center gap-2 bg-surface border border-border rounded-full pl-2.5 pr-3.5 py-1.5 text-[13px] font-semibold shadow-sm">
            <span className="w-5 h-5 rounded-full bg-accent-soft text-accent grid place-items-center text-[11px] shrink-0">✦</span>
            {h}
          </span>
        ))}
      </div>
    </section>
  );
}

// Caritas apiladas de quienes ya se inscribieron (decorativas).
function Caritas({ n }: { n: number }) {
  const tonos = ["#C4B5FD", "#A78BFA", "#8B5CF6", "#7C3AED"];
  return (
    <span className="flex -space-x-2" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="w-6 h-6 rounded-full border-2 border-surface" style={{ background: tonos[i % tonos.length] }} />
      ))}
    </span>
  );
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="text-[#F5B301]" aria-label={`${valor} de 5`}>
      {"★".repeat(Math.round(valor))}{"☆".repeat(5 - Math.round(valor))}
    </span>
  );
}

const svg = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IcoCursos() { return <svg width="20" height="20" viewBox="0 0 24 24" {...svg}><path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" /></svg>; }
function IcoEstrella() { return <svg width="20" height="20" viewBox="0 0 24 24" {...svg}><path d="m12 3 2.6 5.6 6 .8-4.4 4.3 1.1 6.1L12 17l-5.3 2.8 1.1-6.1L3.4 9.4l6-.8z" /></svg>; }
function IcoNivel() { return <svg width="20" height="20" viewBox="0 0 24 24" {...svg}><path d="M5 20v-5M12 20V8M19 20v-9" /></svg>; }
function IcoReloj() { return <svg width="20" height="20" viewBox="0 0 24 24" {...svg}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>; }
function IcoCalendario() { return <svg width="20" height="20" viewBox="0 0 24 24" {...svg}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>; }
function IcoCarrito() { return <svg width="16" height="16" viewBox="0 0 24 24" {...svg}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.4 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" /></svg>; }
