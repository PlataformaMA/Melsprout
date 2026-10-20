"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import type { DatosInicio } from "@/lib/inicio";

// Inicio: dónde se quedó, qué sigue y qué hay abierto en el Marketplace.

export function InicioDashboard({
  datos, nombre, avatarUrl, xp, racha,
}: {
  datos: DatosInicio; nombre: string; avatarUrl: string | null; xp: number; racha: number;
}) {
  const d = datos;
  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="inicio" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Inicio</h1>
          <p className="text-sub text-[14px] mt-1">Revisa tus avances</p>

          {/* Las cinco tarjetas de arriba */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
            <Tarjeta emoji="⭐" valor={`Nivel ${d.nivel.numero}`} pie={d.nivel.nombre} />
            <Tarjeta emoji="📘" valor={`${d.modulos.hechos}/${d.modulos.total}`} pie="Módulos completados" />
            <Tarjeta emoji="🏆" valor={String(d.certificaciones)} pie="Certificaciones" />
            <Tarjeta emoji="📣" valor={String(d.campaniasActivas)} pie="Campañas activas" />
            <Tarjeta emoji="💵" valor={dinero(d.ganancias)} pie="Ganancias totales" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mt-7">
            <div className="min-w-0 space-y-7">
              {/* Continúa viendo */}
              <section>
                <h2 className="font-display font-extrabold text-[17px]">Continúa viendo</h2>
                <p className="text-[13px] text-sub mt-0.5 mb-3">Continúa aprendiendo en tu ruta de creador</p>
                {d.enCurso ? (
                  <Link href={`/app/clase/${d.enCurso.id}`}
                    className="flex flex-col sm:flex-row gap-4 bg-surface border border-border rounded-2xl p-4 shadow-sm hover:border-accent/40 transition">
                    <span className="relative w-full sm:w-[190px] aspect-video rounded-xl overflow-hidden bg-accent-soft shrink-0 grid place-items-center">
                      {d.enCurso.portada ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.enCurso.portada} alt="" className="w-full h-full object-cover" />
                      ) : null}
                      <span className="absolute w-11 h-11 rounded-full bg-white/90 grid place-items-center text-accent text-lg">▶</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      {d.enCurso.nivel && (
                        <span className="inline-block text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
                          {d.enCurso.nivel}
                        </span>
                      )}
                      <span className="block font-display font-extrabold text-[17px] leading-tight mt-1.5">
                        {d.enCurso.titulo}
                      </span>
                      <span className="block text-[12.5px] text-sub mt-1">
                        Módulo {d.enCurso.modulo}: {d.enCurso.posicion}
                      </span>
                      <span className="inline-block mt-2.5 text-[11.5px] font-bold text-green bg-green/10 rounded-full px-2.5 py-1">
                        En curso
                      </span>
                    </span>
                  </Link>
                ) : (
                  <Vacio texto="Ya terminaste todo lo que tienes disponible. ¡Bien hecho!" />
                )}
              </section>

              {/* Próximas clases */}
              {d.porVenir.length > 0 && (
                <section>
                  <h2 className="font-display font-extrabold text-[17px] mb-3">Próximas clases</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {d.porVenir.map((c) => (
                      <div key={c.id} className="bg-surface border border-border rounded-2xl p-3 shadow-sm">
                        <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#8B5CF6] to-accent grid place-items-center text-white text-2xl">
                          🔒
                        </div>
                        <div className="font-bold text-[13px] leading-tight mt-2 truncate">{c.titulo}</div>
                        <div className="text-[11.5px] text-hint truncate">{c.modulo}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Mis campañas activas */}
              <section>
                <h2 className="font-display font-extrabold text-[17px]">Mis campañas activas</h2>
                <p className="text-[13px] text-sub mt-0.5 mb-3">Accede a tus campañas activas</p>
                {d.sinPro ? (
                  <Vacio texto="Las campañas son parte de Boost Pro." href="/app/marketplace" cta="Ver qué incluye" />
                ) : d.misCampanias.length === 0 ? (
                  <Vacio texto="Todavía no aplicas a ninguna campaña."
                    href="/app/marketplace" cta="Ver el Marketplace" />
                ) : (
                  <div className="space-y-2.5">
                    {d.misCampanias.map((c) => (
                      <Link key={c.id} href="/app/campanias"
                        className="flex items-center gap-3.5 bg-surface border border-border rounded-2xl p-3.5 shadow-sm hover:border-accent/40 transition">
                        <Logo url={c.logo} nombre={c.marca} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-display font-extrabold text-[14.5px] truncate">{c.titulo}</span>
                          <span className="block text-[12px] text-sub truncate">{c.marca}</span>
                        </span>
                        <span className="shrink-0 font-bold text-[13.5px]">{c.pago}</span>
                        <span className={`shrink-0 text-[11.5px] font-bold rounded-full px-2.5 py-1 ${
                          c.estado === "En curso" ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>
                          {c.estado}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Campañas que te pueden interesar */}
              {!d.sinPro && d.sugeridas.length > 0 && (
                <section>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h2 className="font-display font-extrabold text-[17px]">Campañas que te pueden interesar</h2>
                    <Link href="/app/marketplace"
                      className="shrink-0 text-[12.5px] font-bold text-sub border border-border rounded-full px-3.5 py-1.5 hover:border-accent/40 transition">
                      Ver más
                    </Link>
                  </div>
                  <p className="text-[13px] text-sub mb-3">Accede a las campañas en curso</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {d.sugeridas.map((c) => (
                      <Link key={c.id} href="/app/marketplace"
                        className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm hover:border-accent/40 transition">
                        <div className="flex items-center gap-3">
                          <Logo url={c.logo} nombre={c.marca} />
                          <div className="min-w-0">
                            <div className="text-[12px] text-sub truncate">{c.marca}</div>
                            <div className="font-display font-extrabold text-[14.5px] leading-tight">{c.titulo}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-3">
                          <span className="font-display font-extrabold text-[15px] text-green">{c.pago}</span>
                          <span className="bg-accent text-white rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold">
                            Aplicar
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Columna derecha */}
            <aside className="space-y-5 lg:sticky lg:top-5">
              <section className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-display font-extrabold text-[14.5px]">Próximas sesiones en vivo</h3>
                  <Link href="/app/vivo" className="text-[12px] font-bold text-accent shrink-0">Ver todas</Link>
                </div>
                {d.sesiones.length === 0 ? (
                  <p className="text-[12.5px] text-sub leading-snug">
                    No hay clases en vivo programadas por ahora.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {d.sesiones.map((s) => (
                      <Link key={s.id} href="/app/vivo"
                        className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-bg transition">
                        <span className="shrink-0 w-11 rounded-lg bg-accent-soft text-accent text-center py-1.5">
                          <span className="block font-display font-extrabold text-[15px] leading-none">{s.dia}</span>
                          <span className="block text-[10px] font-bold uppercase mt-0.5">{s.mes}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-bold leading-tight line-clamp-2">{s.titulo}</span>
                          <span className="block text-[11px] text-hint truncate">
                            {s.instructor ? `${s.instructor} · ` : ""}{s.hora}
                          </span>
                        </span>
                        <span className={`shrink-0 text-[11px] font-bold rounded-full px-2.5 py-1 ${
                          s.hoy ? "bg-pink-soft text-pink" : "bg-bg border border-border text-sub"}`}>
                          {s.hoy ? "Hoy" : "Reservar"}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
                <h3 className="font-display font-extrabold text-[14.5px] mb-3">Descubre las novedades</h3>
                <Link href="/app/especiales" className="block group">
                  <span className="block aspect-[16/10] rounded-xl bg-gradient-to-br from-[#8B5CF6] to-accent grid place-items-center text-white text-3xl">
                    ✨
                  </span>
                  <span className="block text-[13px] font-bold leading-snug mt-2.5 group-hover:text-accent transition">
                    Crea tu página con Hostinger y Boost Academy
                  </span>
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Tarjeta({ emoji, valor, pie }: { emoji: string; valor: string; pie: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm text-center">
      <div className="text-[20px]">{emoji}</div>
      <div className="font-display font-extrabold text-[20px] leading-tight mt-1">{valor}</div>
      <div className="text-[11.5px] text-hint leading-snug mt-0.5">{pie}</div>
    </div>
  );
}

function Logo({ url, nombre }: { url: string | null; nombre: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />;
  }
  return (
    <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent grid place-items-center text-[12px] font-extrabold shrink-0">
      {nombre.slice(0, 2).toUpperCase()}
    </span>
  );
}

function Vacio({ texto, href, cta }: { texto: string; href?: string; cta?: string }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-7 text-center">
      <p className="text-[13.5px] text-sub max-w-sm mx-auto leading-snug">{texto}</p>
      {href && cta && (
        <Link href={href}
          className="inline-block mt-3 bg-accent text-white rounded-full px-5 py-2.5 text-[13px] font-bold hover:brightness-110 transition">
          {cta}
        </Link>
      )}
    </div>
  );
}

function dinero(n: number): string {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
