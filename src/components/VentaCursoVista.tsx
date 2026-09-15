"use client";

import { useState } from "react";
import type { CursoEspecial, InstructorCurso } from "@/lib/cursos-db";
import type { Testimonio } from "@/lib/acceso-actions";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { AvatarInstructor } from "@/components/Instructor";
import { BotonVolver } from "@/components/IconosApp";

// «$69 USD» / «$1,950 MXN»: el símbolo y la moneda por separado, que se
// entiende en toda Latinoamérica (Intl daría «USD 69.00»).
function precioTexto(precio: number | null, moneda: string): string | null {
  if (precio == null) return null;
  const entero = Number.isInteger(precio);
  const n = new Intl.NumberFormat("es-MX", { minimumFractionDigits: entero ? 0 : 2, maximumFractionDigits: 2 }).format(precio);
  return `$${n} ${(moneda || "MXN").toUpperCase()}`;
}
const num = (n: number) => n.toLocaleString("es-MX");

// «14 de septiembre» a partir de «2026-09-14» (sin líos de zona horaria).
function fechaLanzamiento(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", { day: "numeric", month: "long", timeZone: "UTC" });
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
  const inscritos = curso.inscritos ?? curso.estudiantes;
  const instructores: InstructorCurso[] = curso.instructores.length
    ? curso.instructores
    : [{ nombre: curso.instructor, foto: null, rol: null, bio: null, redes: { facebook: null, youtube: null, instagram: null, twitter: null } }];

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

          <BotonVolver href="/app/especiales" className="mb-6" />

          {/* Inscritos, estrellas y compartir */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-5 border-b border-border">
            {inscritos > 0 && <Caritas fotos={instructores.map((i) => i.foto)} />}
            {curso.rating != null && <Estrellas valor={curso.rating} />}
            {inscritos > 0 && (
              <span className="text-[14px] text-sub"><b className="text-text">{num(inscritos)}</b> ya inscrito</span>
            )}
            <BotonCompartir nombre={curso.nombre} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start mt-6">
            <div className="min-w-0">
              <h1 className="font-display text-[26px] sm:text-[32px] font-extrabold leading-tight">{curso.nombre}</h1>

              {/* Portada + qué aprenderás */}
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,335px)_1fr] gap-6 sm:gap-10 mt-6">
                <div>
                  <PortadaCurso curso={curso} />
                  {curso.patrocinador && (
                    <div className="mt-5">
                      <div className="text-[14px] font-bold mb-2">Patrocinador:</div>
                      {curso.patrocinadorLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={curso.patrocinadorLogo} alt={curso.patrocinador} className="h-7 object-contain" />
                      ) : (
                        <b className="text-[15px] text-accent">{curso.patrocinador}</b>
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="font-display font-extrabold text-[19px]">Qué Aprenderás?</h2>
                  <TextoExpandible texto={curso.descripcion} extra={curso.aprenderas} />
                </div>
              </div>

              {/* Instructores */}
              <section className="mt-10">
                <h2 className="font-display font-extrabold text-[15px] mb-4">
                  {instructores.length === 1 ? "Instructor del curso:" : "Instructores del curso:"}
                </h2>
                <div className="divide-y divide-border">
                  {instructores.map((i) => <FichaInstructor key={i.nombre} i={i} />)}
                </div>
              </section>

              {testimonios.length > 0 && (
                <section className="mt-10">
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
            <aside className="lg:sticky lg:top-5">
              {precio && (
                <>
                  <div className="text-[16px] font-bold">Precio:</div>
                  <div className="font-display text-[32px] font-extrabold leading-tight mt-1">{precio}</div>
                </>
              )}

              <div className="mt-5">
                <BotonComprar curso={curso} />
              </div>

              <div className="bg-accent-soft rounded-2xl px-4 py-4 mt-5">
                <div className="flex items-center gap-2.5 text-[14px] font-bold">
                  <IcoCheck /> Garantía de 7 días
                </div>
                <p className="text-[13px] text-sub leading-relaxed mt-2.5">
                  Al comprar el producto, las instrucciones de acceso se enviarán a tu correo electrónico.
                </p>
              </div>

              {!puedeComprar && (
                <p className="text-[12px] text-hint text-center leading-snug mt-3">
                  {fechaLanzamiento(curso.lanzamiento)
                    ? `Disponible a partir del ${fechaLanzamiento(curso.lanzamiento)} 💜`
                    : "Estamos terminando de habilitar la compra. Vuelve pronto 💜"}
                </p>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// La portada. Si el curso tiene enlace destacado (el plan del patrocinador),
// la foto lleva ahí.
function PortadaCurso({ curso }: { curso: CursoEspecial }) {
  const caja = "block rounded-2xl overflow-hidden bg-[#0B0B12] aspect-[335/235]";
  const contenido = curso.portada ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={curso.portada} alt={curso.nombre} className="w-full h-full object-cover" />
  ) : (
    <span className="w-full h-full grid place-items-center font-display font-extrabold text-white/80 text-lg px-3 text-center">{curso.nombre}</span>
  );
  // La foto lleva a comprar; si el curso aún no tiene checkout, al enlace del patrocinador.
  const href = curso.checkoutUrl || curso.enlace?.url;
  if (!href) return <div className={caja}>{contenido}</div>;
  return (
    <a href={href} target="_blank" rel="noreferrer" title={curso.checkoutUrl ? "Comprar" : curso.enlace?.texto}
      className={`${caja} hover:opacity-90 transition`}>
      {contenido}
    </a>
  );
}

// Descripción con «Mostrar más»: lo largo se esconde hasta que se pide.
function TextoExpandible({ texto, extra }: { texto: string; extra: string[] }) {
  const [abierto, setAbierto] = useState(false);
  const largo = texto.length > 260 || extra.length > 0;
  const visible = abierto || !largo ? texto : `${texto.slice(0, 260).trimEnd()}…`;
  return (
    <div className="mt-4">
      <p className="text-[14.5px] text-sub leading-[1.8]">{visible}</p>
      {abierto && extra.length > 0 && (
        <ul className="mt-3 space-y-2">
          {extra.map((a, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14px] text-sub leading-relaxed">
              <span className="text-accent mt-0.5 shrink-0">✓</span>{a}
            </li>
          ))}
        </ul>
      )}
      {largo && (
        <button onClick={() => setAbierto((v) => !v)} className="mt-4 text-[16px] font-bold underline underline-offset-4">
          {abierto ? "Mostrar menos" : "Mostrar más"}
        </button>
      )}
    </div>
  );
}

function FichaInstructor({ i }: { i: InstructorCurso }) {
  const [abierto, setAbierto] = useState(false);
  const bio = i.bio || "";
  const parrafos = bio.split(/\n{2,}/).filter(Boolean);
  // Cerrado se ve solo el primer párrafo; «Mostrar más» despliega el resto.
  const largo = parrafos.length > 1 || bio.length > 400;
  const visibles = abierto || !largo
    ? parrafos
    : [parrafos[0].length > 400 ? `${parrafos[0].slice(0, 400).trimEnd()}…` : parrafos[0]];
  const redes = [
    ["facebook", i.redes.facebook, <IcoFacebook key="f" />],
    ["youtube", i.redes.youtube, <IcoYoutube key="y" />],
    ["instagram", i.redes.instagram, <IcoInstagram key="i" />],
    ["twitter", i.redes.twitter, <IcoX key="x" />],
  ] as const;

  return (
    <div className="py-5 first:pt-0">
      <div className="flex items-start gap-4">
        {i.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={i.foto} alt={i.nombre} className="w-[72px] h-[72px] rounded-full object-cover shrink-0" />
        ) : (
          <AvatarInstructor nombre={i.nombre} size={72} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-[15px]">{i.nombre}</div>
              {i.rol && <div className="text-[13px] font-semibold text-accent mt-0.5">{i.rol}</div>}
            </div>
            {redes.some(([, url]) => url) && (
              <div className="flex items-center gap-3 shrink-0 text-text">
                {redes.map(([id, url, icono]) => url ? (
                  <a key={id} href={url} target="_blank" rel="noreferrer" aria-label={id} className="hover:text-accent transition">{icono}</a>
                ) : null)}
              </div>
            )}
          </div>

          {parrafos.length > 0 && (
            <div className="mt-3 space-y-3">
              {visibles.map((p, k) => (
                <p key={k} className="text-[12.5px] text-sub leading-[1.75] max-w-[600px]">{p}</p>
              ))}
              {largo && (
                <button onClick={() => setAbierto((v) => !v)} className="text-[12px] font-bold flex items-center gap-1.5">
                  {abierto ? "Mostrar menos" : "Mostrar más"}
                  <span className={`text-[10px] transition-transform ${abierto ? "rotate-180" : ""}`}>⌄</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BotonComprar({ curso }: { curso: CursoEspecial }) {
  if (!curso.checkoutUrl) {
    const fecha = fechaLanzamiento(curso.lanzamiento);
    return (
      <div className="flex items-center justify-center w-full bg-bg border border-border text-sub rounded-2xl py-4 text-[15px] font-bold">
        {fecha ? `Próximamente · ${fecha}` : "Próximamente"}
      </div>
    );
  }
  return (
    <a href={curso.checkoutUrl} target="_blank" rel="noreferrer"
      className="flex items-center justify-center gap-4 w-full bg-accent text-white rounded-2xl py-4 text-[19px] font-bold shadow-sm shadow-accent/30 hover:brightness-110 active:scale-[0.99] transition">
      <IcoCarrito /> Comprar
    </a>
  );
}

// Copia el enlace (o abre la hoja de compartir del teléfono).
function BotonCompartir({ nombre }: { nombre: string }) {
  const [copiado, setCopiado] = useState(false);
  async function compartir() {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: nombre, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Canceló la hoja de compartir: no pasa nada.
    }
  }
  return (
    <button onClick={compartir} className="ml-auto flex items-center gap-3 text-[15px] text-sub hover:text-text transition">
      {copiado ? "¡Enlace copiado!" : "Compartir"} <IcoCompartir />
    </button>
  );
}

// Caritas apiladas de quienes ya se inscribieron (decorativas): se usan las
// fotos de los instructores y, si faltan, tonos de la marca.
function Caritas({ fotos }: { fotos: (string | null)[] }) {
  const tonos = ["#C4B5FD", "#A78BFA", "#8B5CF6", "#7C3AED"];
  const lista = Array.from({ length: 4 }, (_, k) => fotos.filter(Boolean)[k % Math.max(1, fotos.filter(Boolean).length)] || null);
  return (
    <span className="flex -space-x-2.5" aria-hidden>
      {lista.map((f, k) => f ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={k} src={f} alt="" className="w-9 h-9 rounded-full border-2 border-surface object-cover" />
      ) : (
        <span key={k} className="w-9 h-9 rounded-full border-2 border-surface" style={{ background: tonos[k % tonos.length] }} />
      ))}
    </span>
  );
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="text-[#F5B301] text-[22px] leading-none tracking-wide" aria-label={`${valor} de 5`}>
      {"★".repeat(Math.round(valor))}<span className="text-border">{"★".repeat(5 - Math.round(valor))}</span>
    </span>
  );
}

const svg = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IcoCarrito() { return <svg width="26" height="26" viewBox="0 0 24 24" {...svg}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.4 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" /></svg>; }
function IcoCheck() { return <svg width="16" height="16" viewBox="0 0 24 24" {...svg} strokeWidth={3}><path d="m4 12 5 5L20 6" /></svg>; }
function IcoCompartir() { return <svg width="20" height="20" viewBox="0 0 24 24" {...svg}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>; }
function IcoFacebook() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" /></svg>; }
function IcoYoutube() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a2.9 2.9 0 0 0-2-2C19.2 4.7 12 4.7 12 4.7s-7.2 0-9 .5a2.9 2.9 0 0 0-2 2C.5 9 .5 12 .5 12s0 3 .5 4.8a2.9 2.9 0 0 0 2 2c1.8.5 9 .5 9 .5s7.2 0 9-.5a2.9 2.9 0 0 0 2-2c.5-1.8.5-4.8.5-4.8s0-3-.5-4.8zM9.8 15.1V8.9l6 3.1-6 3.1z" /></svg>; }
function IcoInstagram() { return <svg width="20" height="20" viewBox="0 0 24 24" {...svg}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>; }
function IcoX() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3h6.4l4.4 5.9L17.5 3zm-1.1 16.2h1.7L6.9 4.7H5.1l11.3 14.5z" /></svg>; }
