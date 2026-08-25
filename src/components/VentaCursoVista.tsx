"use client";

import Link from "next/link";
import type { CursoEspecial } from "@/lib/cursos-db";
import type { Testimonio } from "@/lib/acceso-actions";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { AvatarInstructor } from "@/components/Instructor";
import { formatoDuracion } from "@/components/EspecialesVista";

function precioTexto(precio: number | null, moneda: string): string | null {
  if (precio == null) return null;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda || "MXN" }).format(precio);
}

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

  const datos = [
    curso.series ? { valor: `${curso.series}`, texto: curso.series === 1 ? "serie de cursos" : "series de cursos" } : null,
    curso.rating ? { valor: `${curso.rating} ★`, texto: curso.resenas ? `${curso.resenas.toLocaleString("es-MX")} reseñas` : "valoración" } : null,
    curso.nivel ? { valor: "Nivel", texto: curso.nivel } : null,
    curso.semanas ? { valor: `${curso.semanas}`, texto: curso.semanas === 1 ? "semana" : "semanas" } : null,
    { valor: "Cronograma", texto: "flexible" },
  ].filter(Boolean) as { valor: string; texto: string }[];

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

          {/* Banner: el arte ya trae el botón dibujado, así que el banner
              completo es el enlace de compra. */}
          <BannerCurso curso={curso} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mt-6">
            <div className="min-w-0 space-y-6">
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

                {curso.estudiantes > 0 && (
                  <p className="flex items-center gap-2 text-[13px] text-sub mt-4">
                    <span className="text-accent">👥</span>
                    <b className="text-text">{curso.estudiantes.toLocaleString("es-MX")}</b> ya inscrito
                  </p>
                )}

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

              {datos.length > 0 && (
                <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                    {datos.map((d, i) => (
                      <div key={i}>
                        <div className="font-display font-extrabold text-accent text-[17px] leading-tight">{d.valor}</div>
                        <div className="text-[12px] text-sub mt-0.5 leading-snug">{d.texto}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {curso.habilidades.length > 0 && (
                <Chips titulo="Habilidades que obtendrás" items={curso.habilidades} />
              )}
              {curso.herramientas.length > 0 && (
                <Chips titulo="Herramientas que aprenderás" items={curso.herramientas} />
              )}

              <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
                <h2 className="font-display font-extrabold text-[17px]">Certificado</h2>
                <div className="flex items-center gap-3.5 mt-3">
                  <span className="w-14 h-14 rounded-2xl bg-[#0B0B12] grid place-items-center shrink-0 overflow-hidden">
                    {curso.portada ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={curso.portada} alt="" className="w-full h-full object-cover" />
                    ) : <span className="text-white/70 text-xl">🎓</span>}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[14px]">Certificado para compartir</div>
                    <div className="text-[12.5px] text-sub">Añádelo a tu perfil de LinkedIn al terminar.</div>
                  </div>
                </div>
                {curso.incluye && (
                  <p className="mt-4 bg-accent-soft text-accent text-[13px] rounded-2xl px-4 py-3 leading-relaxed">
                    {curso.incluye}
                  </p>
                )}
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

            {/* Compra */}
            <aside className="lg:sticky lg:top-5 space-y-5">
              <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
                {curso.patrocinador && (
                  <div className="flex items-center gap-2 pb-3.5 mb-3.5 border-b border-border">
                    <span className="text-[11.5px] font-bold text-sub">Patrocinado por</span>
                    {curso.patrocinadorLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={curso.patrocinadorLogo} alt={curso.patrocinador} className="h-3.5 object-contain" />
                    ) : <b className="text-[12px] text-accent">{curso.patrocinador}</b>}
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <AvatarInstructor nombre={curso.instructor} size={38} />
                  <div>
                    <div className="font-bold text-[14px] leading-tight">{curso.instructor}</div>
                    <div className="text-[12px] text-sub">Instructor</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-sub mt-3.5">
                  <span>📘 {curso.clases.length} {curso.clases.length === 1 ? "clase" : "clases"}</span>
                  <span>⏱ {formatoDuracion(curso.minutos)}</span>
                  <span>👥 {curso.estudiantes}</span>
                </div>

                {precio && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-[12.5px] text-sub">Precio</div>
                    <div className="font-display text-2xl font-extrabold text-accent">{precio}</div>
                  </div>
                )}

                {puedeComprar ? (
                  <a href={curso.checkoutUrl!} target="_blank" rel="noreferrer"
                    className="mt-4 block text-center bg-accent text-white rounded-2xl py-3 text-[14px] font-bold hover:brightness-110 transition shadow-sm shadow-accent/30">
                    Comprar
                  </a>
                ) : (
                  <div className="mt-4 text-center bg-bg border border-border rounded-2xl py-3 text-[13.5px] font-bold text-sub">
                    Próximamente
                  </div>
                )}
                <p className="text-[11.5px] text-hint text-center mt-2 leading-snug">
                  {puedeComprar
                    ? "Al comprar se te desbloquean todas las clases del curso."
                    : "Estamos terminando de habilitar la compra. Vuelve pronto 💜"}
                </p>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
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
  return (
    <section>
      <h2 className="font-display font-extrabold text-[17px] mb-3">{titulo}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((h, i) => (
          <span key={i} className="bg-surface border border-border rounded-full px-3.5 py-1.5 text-[13px] font-semibold shadow-sm">
            {h}
          </span>
        ))}
      </div>
    </section>
  );
}
