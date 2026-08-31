"use client";

import { useState } from "react";
import Link from "next/link";
import type { CursoEspecial } from "@/lib/cursos-db";
import type { Clase } from "@/lib/data";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { AvatarInstructor } from "@/components/Instructor";
import { formatoDuracion } from "@/components/EspecialesVista";

type Pestana = "contenido" | "certificado" | "detalles";

// Lo que ve quien YA tiene el curso: sus módulos, el certificado y los detalles.
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
  const completo = curso.clases.length > 0 && listas === curso.clases.length;

  // Los cursos especiales agrupan sus clases en módulos internos. Si no
  // tienen sección, van todas juntas en uno solo.
  const modulos: { nombre: string; clases: Clase[] }[] = [];
  curso.clases.forEach((c) => {
    const nombre = c.seccion || "Contenido del curso";
    const ya = modulos.find((m) => m.nombre === nombre);
    if (ya) ya.clases.push(c);
    else modulos.push({ nombre, clases: [c] });
  });
  // La numeración de las clases es continua a lo largo de todo el curso.
  const numero = new Map(curso.clases.map((c, i) => [c.id, i + 1]));

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

          {/* Banner con el patrocinador a un lado */}
          <div className="rounded-3xl overflow-hidden bg-surface border border-border shadow-sm flex flex-col sm:flex-row items-stretch">
            {curso.patrocinador && (
              <div className="bg-accent-soft px-5 py-4 sm:py-0 grid place-items-center shrink-0 sm:w-[190px]">
                <div className="text-center">
                  <div className="text-[11.5px] font-bold text-accent/80">Patrocinado por:</div>
                  {curso.patrocinadorLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={curso.patrocinadorLogo} alt={curso.patrocinador} className="h-5 object-contain mt-1.5 mx-auto" />
                  ) : <b className="text-[15px] text-accent">{curso.patrocinador}</b>}
                </div>
              </div>
            )}
            {(curso.banner || curso.portada) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={curso.banner || curso.portada || ""} alt={curso.nombre}
                className="w-full min-w-0 object-cover select-none" draggable={false} />
            )}
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
            <div className="space-y-4">
              {modulos.map((m) => (
                <ModuloBloque key={m.nombre} nombre={m.nombre} clases={m.clases} hechas={hechas} numero={numero} />
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
                <div className="mt-4 pt-4 border-t border-border space-y-2.5">
                  {(curso.instructores.length ? curso.instructores : [{ nombre: curso.instructor, foto: null }]).map((i) => (
                    <div key={i.nombre} className="flex items-center gap-2.5">
                      {i.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.foto} alt={i.nombre} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : <AvatarInstructor nombre={i.nombre} size={36} />}
                      <div>
                        <div className="font-bold text-[14px] leading-tight">{i.nombre}</div>
                        <div className="text-[12px] text-sub">Instructor</div>
                      </div>
                    </div>
                  ))}
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

function ModuloBloque({
  nombre, clases, hechas, numero,
}: {
  nombre: string; clases: Clase[]; hechas: Set<string>; numero: Map<string, number>;
}) {
  const [abierto, setAbierto] = useState(true);
  const listas = clases.filter((c) => hechas.has(c.id)).length;
  const pct = clases.length ? Math.round((listas / clases.length) * 100) : 0;

  return (
    <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={() => setAbierto((v) => !v)} className="flex-1 min-w-0 text-left">
          <h2 className="font-display font-extrabold text-[16px] leading-tight">{nombre}</h2>
        </button>
        <div className="hidden sm:flex items-center gap-2.5 w-[210px] shrink-0">
          <div className="flex-1 h-2 rounded-full bg-border/60 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[12px] font-bold text-sub whitespace-nowrap">{pct}% completado</span>
        </div>
        <button onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? "Cerrar módulo" : "Abrir módulo"}
          className={`text-sub text-lg shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}>⌄</button>
      </div>

      <div className="sm:hidden flex items-center gap-2.5 mt-2.5">
        <div className="flex-1 h-2 rounded-full bg-border/60 overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[12px] font-bold text-sub whitespace-nowrap">{pct}% completado</span>
      </div>

      {abierto && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {clases.map((c) => (
            <TarjetaClase key={c.id} c={c} n={numero.get(c.id) ?? 1} hecha={hechas.has(c.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function TarjetaClase({ c, n, hecha }: { c: Clase; n: number; hecha: boolean }) {
  const pendiente = !c.grabada;
  const Contenedor = pendiente ? "div" : Link;

  return (
    <Contenedor
      href={`/app/clase/${c.id}`}
      className={`bg-surface border border-border rounded-2xl p-2.5 flex flex-col transition ${
        pendiente ? "opacity-75" : "hover:border-accent/40 hover:shadow-sm"
      }`}
    >
      <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-[#3b0764] to-[#7c3aed] grid place-items-center">
        {c.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.portada} alt="" className="w-full h-full object-cover" />
        ) : <span className="text-white/80 text-xl">▶</span>}
        <span className="absolute top-1.5 right-1.5 bg-black/65 text-white text-[10.5px] font-bold rounded px-1.5 py-0.5">
          {c.duracionMin} min
        </span>
        {hecha && (
          <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-green text-white grid place-items-center text-[11px]">✓</span>
        )}
      </div>

      <div className="text-[11px] font-bold text-accent mt-2">Clase {n}</div>
      <h3 className="font-display font-extrabold text-[13.5px] leading-tight mt-0.5">{c.titulo}</h3>

      <div className="flex items-center gap-2 mt-2.5">
        <AvatarInstructor nombre={c.instructor} size={26} />
        <div className="min-w-0">
          <div className="text-[12px] font-semibold truncate">{c.instructor}</div>
          {c.instructorRol && <div className="text-[10.5px] text-hint truncate">{c.instructorRol}</div>}
        </div>
      </div>

      <div className="mt-2.5">
        {pendiente ? (
          <span className="inline-block text-[11px] font-bold text-sub bg-bg border border-border rounded-full px-2.5 py-1">
            Próximamente
          </span>
        ) : hecha ? (
          <span className="inline-block text-[11px] font-bold text-green bg-green/10 rounded-full px-2.5 py-1">
            Completado ✓
          </span>
        ) : (
          <span className="inline-block text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
            Pendiente
          </span>
        )}
      </div>
    </Contenedor>
  );
}
