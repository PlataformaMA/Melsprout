"use client";

import { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { ETAPA_1, type Clase, type ModuloCurso } from "@/lib/data";

// ————— Geometría del camino serpenteante (S amplia y suave) —————
// W debe COINCIDIR con el maxWidth del contenedor para que el SVG no se deforme.
const W = 640;
const CX = 310;                 // centro
const AMP = 208;                // clases en ~16% (izq) y ~81% (der), como el mockup
const SPACING = 158;            // separación vertical
const TOP = 94;
const FREQ = Math.PI / 2;       // período de 4 nodos → S regular y limpia
const PHASE = -Math.PI / 2;     // el primer nodo arranca a la izquierda (valle)
const serpX = (i: number) => CX + AMP * Math.sin(i * FREQ + PHASE);
const pctX = (x: number) => `${(x / W) * 100}%`;

// Serpentina clásica: controles en el punto medio con la X de cada nodo → S limpia y simétrica.
function construirPath(pts: { x: number; y: number }[]): string {
  if (!pts.length) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const my = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${my}, ${p1.x} ${my}, ${p1.x} ${p1.y}`;
  }
  return d;
}

const COMPLETADAS = 2; // clases completadas (demo hasta conectar el progreso real)

type EClase = "completada" | "actual" | "bloqueada";
type EReto = "completada" | "en-revision" | "rechazada" | "pendiente" | "bloqueada";
type Elemento =
  | { tipo: "clase"; clase: Clase; estado: EClase }
  | { tipo: "reto"; clase: Clase; estado: EReto }
  | { tipo: "hito"; modulo: ModuloCurso; estado: "completada" | "bloqueada" }
  | { tipo: "gate"; modulo: ModuloCurso; estado: "desbloqueada" | "bloqueada" };

// Estados de reto de demo (muestran todos los casos hasta conectar el progreso real).
const RETO_DEMO: EReto[] = ["completada", "en-revision", "rechazada"];

function construirElementos(): Elemento[] {
  const els: Elemento[] = [];
  let gi = 0;
  ETAPA_1.forEach((modulo) => {
    const inicioModulo = gi;
    modulo.clases.forEach((clase) => {
      const ec: EClase = gi < COMPLETADAS ? "completada" : gi === COMPLETADAS ? "actual" : "bloqueada";
      const er: EReto = RETO_DEMO[gi] ?? (gi === COMPLETADAS ? "pendiente" : "bloqueada");
      els.push({ tipo: "clase", clase, estado: ec });
      els.push({ tipo: "reto", clase, estado: er });
      gi++;
    });
    const moduloDone = inicioModulo + modulo.clases.length <= COMPLETADAS;
    els.push({ tipo: "hito", modulo, estado: moduloDone ? "completada" : "bloqueada" });
    els.push({ tipo: "gate", modulo, estado: moduloDone ? "desbloqueada" : "bloqueada" });
  });
  return els;
}

export function RutaAprendizaje({
  nombre, avatarUrl, gemas, racha, perfilPct,
}: {
  nombre: string; avatarUrl: string | null; gemas: number; racha: number; perfilPct: number;
}) {
  const elementos = construirElementos();
  // TODOS los nodos siguen la misma onda senoidal → serpentina continua y suave (sin codos).
  const pts = elementos.map((_, i) => ({
    x: serpX(i),
    y: TOP + i * SPACING,
  }));
  const altura = TOP + elementos.length * SPACING + 40;

  // Módulo actual (el que contiene la clase "actual")
  const idxActual = elementos.findIndex((e) => e.tipo === "clase" && e.estado === "actual");
  const moduloActual = idxActual >= 0 && elementos[idxActual].tipo === "clase"
    ? ETAPA_1.find((m) => m.clases.includes((elementos[idxActual] as { clase: Clase }).clase))
    : ETAPA_1[0];

  // Octi junto a la clase actual
  const octiY = idxActual >= 0 ? pts[idxActual].y : TOP + 3 * SPACING;

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="clases" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          {/* Barra superior */}
          <header className="flex items-center justify-end gap-4 mb-4 h-10">
            <Counter icon="🔥" valor={racha} />
            <Counter icon="💎" valor={gemas} />
            <button className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-surface transition" aria-label="Notificaciones">
              <BellIcon />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>
            <Link href="/app/perfil" className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-accent/25 grid place-items-center bg-accent/10 shrink-0">
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt="Tu perfil" className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-bold bg-accent w-full h-full grid place-items-center">{nombre.slice(0, 2).toUpperCase()}</span>}
            </Link>
          </header>

          <h1 className="font-display text-2xl font-extrabold mb-4">Ruta De Aprendizaje</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* ——— Mapa ——— */}
            <div className="min-w-0">
              {/* Banner del módulo */}
              <div className="relative overflow-hidden rounded-2xl px-6 py-5 flex items-center justify-between text-white shadow-lg shadow-accent/20 mb-4"
                style={{ background: "linear-gradient(120deg,#6D28D9,#7C3AED)" }}>
                {/* Destellos decorativos */}
                <Sparkle4 className="absolute right-24 top-1/2 -translate-y-1/2 opacity-30" size={64} />
                <Sparkle4 className="absolute right-16 top-3 opacity-20" size={26} />
                <Sparkle4 className="absolute right-40 bottom-2 opacity-15" size={20} />

                <div className="relative font-display text-lg font-extrabold">
                  Modulo {ETAPA_1.indexOf(moduloActual ?? ETAPA_1[0]) + 1}: {(moduloActual ?? ETAPA_1[0]).nombre}
                </div>
                <span className="relative flex items-center gap-2 bg-white rounded-full pl-4 pr-1.5 py-1.5 text-[13px] font-bold text-[#5B21B6]">
                  Guía
                  <span className="w-6 h-6 rounded-full bg-accent grid place-items-center text-white"><PlayMini /></span>
                </span>
              </div>

              {/* Camino */}
              <div className="relative mx-auto w-full" style={{ maxWidth: 640, height: altura }}>
                <svg viewBox={`0 0 ${W} ${altura}`} className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none">
                  <path d={construirPath(pts)} stroke="#C7B8EF" strokeWidth="5.5" strokeLinecap="round" strokeDasharray="10 15" vectorEffect="non-scaling-stroke" />
                </svg>

                <DecorMar altura={altura} />

                {elementos.map((el, i) => (
                  <div key={i} className="absolute z-[5]" style={{ left: pctX(pts[i].x), top: pts[i].y, transform: "translate(-50%,-50%)" }}>
                    <NodoElemento el={el} />
                  </div>
                ))}

                {/* Octi con burbuja (arriba) junto a la clase actual */}
                <div className="absolute z-10 hidden lg:block" style={{ left: "-11%", top: octiY - 140 }}>
                  <OctiRuta nombre={nombre} />
                </div>
              </div>
            </div>

            {/* ——— Sidebar derecha ——— */}
            <aside className="space-y-4 lg:sticky lg:top-5">
              {/* Banner completa perfil */}
              {perfilPct < 100 && (
                <Link href="/app/perfil/completar" className="flex items-center gap-3 rounded-2xl p-3.5 bg-surface border border-amber/40 shadow-sm hover:scale-[1.01] transition">
                  <div className="text-2xl">🎁</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-text leading-tight">Perfil al {perfilPct}% — gana <span className="text-accent">+15 💎</span></div>
                    <div className="text-[11px] text-sub">Complétalo con Octi 🐙</div>
                  </div>
                </Link>
              )}

              <Tarjeta titulo="Desafíos del día" extra={<span className="text-[12px] text-accent font-semibold cursor-default">Ver todos</span>}>
                <Desafio icon={<span className="text-amber">⚡</span>} texto="Gana 10 EXP" progreso={0} total={10} />
                <Desafio icon={<span className="text-green">🎯</span>} texto="Obtén un puntaje de 90% o más en 1 lección" progreso={0} total={1} />
              </Tarjeta>

              <Tarjeta titulo="Recursos">
                <Recurso icon={<DocIcon />} titulo="Plantillas" sub="para creadores" />
                <Recurso icon={<BookIcon />} titulo="Guías" sub="rápidas" />
                <Recurso icon={<ToolIcon />} titulo="Herramientas" sub="recomendadas" />
              </Tarjeta>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// ————— Nodo según tipo/estado (la leyenda) —————
function NodoElemento({ el }: { el: Elemento }) {
  if (el.tipo === "clase") {
    if (el.estado === "completada")
      return (
        <Link href={`/app/clase/${el.clase.id}`} title={el.clase.titulo}
          className="grid place-items-center rounded-full w-[80px] h-[80px] bg-green text-white border-[5px] border-white hover:scale-105 transition-transform"
          style={{ boxShadow: "0 7px 0 #047857, 0 12px 16px rgba(0,0,0,.14)" }}>
          <StarIcon />
        </Link>
      );
    if (el.estado === "actual")
      return (
        <div className="relative">
          <Link href={`/app/clase/${el.clase.id}`} title={el.clase.titulo}
            className="ruta-pulse grid place-items-center rounded-full w-[84px] h-[84px] bg-accent text-white border-[5px] border-white hover:scale-105 transition-transform"
            style={{ boxShadow: "0 7px 0 #5B21B6, 0 14px 18px rgba(124,58,237,.3)" }}>
            <PlayIcon />
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 top-[92px] whitespace-nowrap bg-white text-[11px] font-bold text-accent rounded-full px-3 py-1.5 shadow-md">
            {el.clase.titulo}
          </div>
        </div>
      );
    // bloqueada
    return (
      <div className="grid place-items-center rounded-full w-[80px] h-[80px] bg-[#B9BDC7] text-white border-[5px] border-white"
        style={{ boxShadow: "0 7px 0 #9AA0AD, 0 12px 14px rgba(0,0,0,.1)" }} title="Completa la clase anterior">
        <PlayIcon />
      </div>
    );
  }

  if (el.tipo === "reto") {
    const base = "grid place-items-center rounded-full w-[64px] h-[64px] bg-white border-[5px] border-white";
    const sombraOk = "0 5px 0 #EADFbf, 0 8px 12px rgba(0,0,0,.08)";
    const sombraGris = "0 5px 0 #E7E4EC, 0 8px 12px rgba(0,0,0,.08)";

    if (el.estado === "completada")
      return <div className={base} style={{ boxShadow: sombraOk }} title="Reto completado"><SparkleIcon color="#F5B301" /></div>;
    if (el.estado === "en-revision")
      return (
        <div className="relative">
          <div className="absolute -top-5 -right-6"><Burbujas /></div>
          <div className={base} style={{ boxShadow: sombraGris }} title="Reto en revisión"><SparkleIcon color="#9AA0AD" /></div>
          <EtiquetaReto texto="En revisión" clase="bg-accent-soft text-accent" />
        </div>
      );
    if (el.estado === "rechazada")
      return (
        <div className="relative">
          <div className={base} style={{ boxShadow: "0 5px 0 #F3C4C9, 0 8px 12px rgba(0,0,0,.08)" }} title="Reto rechazado"><SparkleIcon color="#EF4444" /></div>
          <EtiquetaReto texto="✕ Rechazado" clase="bg-pink-soft text-pink" />
        </div>
      );
    if (el.estado === "pendiente")
      return (
        <div className="relative">
          <div className={base} style={{ boxShadow: sombraGris }} title="Reto pendiente"><SparkleIcon color="#9AA0AD" /></div>
          <div className="absolute -top-4 -right-5"><Burbujas /></div>
        </div>
      );
    return <div className={base} style={{ boxShadow: sombraGris }} title="Reto bloqueado"><SparkleIcon color="#C6CAD3" /></div>;
  }

  if (el.tipo === "hito") {
    return <TrofeoBurbuja apagado={el.estado === "bloqueada"} />;
  }

  // gate
  return <HieloNivel bloqueado={el.estado === "bloqueada"} />;
}

function EtiquetaReto({ texto, clase }: { texto: string; clase: string }) {
  return (
    <span className={`absolute left-1/2 -translate-x-1/2 top-[62px] whitespace-nowrap text-[11px] font-bold rounded-full px-3 py-1 shadow-sm ${clase}`}>{texto}</span>
  );
}

// ————— Ilustraciones (imágenes reales del mockup) —————
function TrofeoBurbuja({ apagado }: { apagado?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/trofeo.webp" alt="Hito de nivel" width={124} height={124}
      className={`select-none ${apagado ? "opacity-45 grayscale" : ""}`} draggable={false} />
  );
}

function HieloNivel({ bloqueado }: { bloqueado?: boolean }) {
  return (
    <div className="relative grid place-items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/hielo.webp" alt="Siguiente nivel" width={212} className="select-none" draggable={false} />
      {bloqueado && (
        <>
          <span className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white/90 grid place-items-center shadow-md"><LockIcon /></span>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-bold rounded-lg px-3 py-1 shadow whitespace-nowrap">Siguiente Nivel</span>
        </>
      )}
    </div>
  );
}

function AlgaRoja() {
  return (
    <svg width="54" height="81" viewBox="0 0 52 78" fill="none">
      <path d="M14 76 C7 60 19 52 11 38 C4 25 18 18 13 4" stroke="#E8586A" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M26 76 C33 58 21 48 29 34 C36 21 24 12 31 2" stroke="#D63F52" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M38 76 C31 62 41 52 35 42 C30 33 39 26 37 16" stroke="#F27A88" strokeWidth="5.5" strokeLinecap="round" />
      <ellipse cx="26" cy="76" rx="16" ry="3.5" fill="#E8586A" opacity="0.18" />
    </svg>
  );
}
function CoralTurquesa() {
  return (
    <svg width="94" height="78" viewBox="0 0 80 66" fill="none" stroke="#2CA6A4" strokeWidth="7" strokeLinecap="round">
      <path d="M40 64 L40 30" /><path d="M40 42 C31 34 24 36 22 24" /><path d="M40 38 C49 32 56 34 58 22" />
      <path d="M22 24 C19 17 24 13 22 5" /><path d="M58 22 C61 15 56 11 58 4" /><path d="M40 30 C37 22 43 17 40 8" />
      <ellipse cx="40" cy="64" rx="20" ry="3.5" fill="#2CA6A4" stroke="none" opacity="0.18" />
    </svg>
  );
}
function Burbujas() {
  return (
    <svg width="52" height="48" viewBox="0 0 62 58" fill="none" className="burbujas-anim">
      <circle cx="26" cy="34" r="12" stroke="#7DD3FC" strokeWidth="3" opacity="0.75" />
      <circle cx="46" cy="20" r="7" stroke="#7DD3FC" strokeWidth="2.6" opacity="0.65" />
      <circle cx="44" cy="42" r="4.5" stroke="#7DD3FC" strokeWidth="2.2" opacity="0.55" />
      <circle cx="22" cy="29" r="3" fill="#BAE6FD" opacity="0.8" />
    </svg>
  );
}
function DecorMar({ altura }: { altura: number }) {
  // Decoraciones SIEMPRE en las orillas (fuera del rango de los nodos, 24%–76%) y detrás de ellos.
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      <div className="absolute mar-vaiven" style={{ left: "-4%", top: 210 }}><AlgaRoja /></div>
      <div className="absolute mar-vaiven" style={{ left: "91%", top: 520, animationDelay: "1s" }}><CoralTurquesa /></div>
      <div className="absolute mar-vaiven" style={{ left: "-4%", top: altura * 0.64, animationDelay: ".5s" }}><AlgaRoja /></div>
      <div className="absolute mar-vaiven" style={{ left: "90%", top: altura * 0.84, animationDelay: "1.4s" }}><CoralTurquesa /></div>
    </div>
  );
}

function OctiRuta({ nombre }: { nombre: string }) {
  const primer = nombre.split(" ")[0];
  const MENSAJES = [
    "¡Completaste una clase! +10XP",
    `¡Toca el nodo morado, ${primer}!`,
    "Una clase al día 🚀",
    "¡Cuida tu racha! 🔥",
  ];
  const [i, setI] = useState(0);
  return (
    <button onClick={() => setI((n) => (n + 1) % MENSAJES.length)} className="flex flex-col items-center text-left hover:scale-[1.02] active:scale-95 transition" title="Tócame 🐙">
      {/* Burbuja ARRIBA de Octi (compacta, no tapa los nodos) */}
      <div key={i} className="octi-fade relative bg-white rounded-2xl shadow-lg flex items-center gap-2 px-3 py-2 mb-1 max-w-[190px] z-10">
        <span className="w-6 h-6 rounded-full bg-amber-soft grid place-items-center text-[13px] shrink-0">⭐</span>
        <span className="text-[12px] font-bold text-[#3C1A6B] leading-snug">{MENSAJES[i]}</span>
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/octi.webp" alt="Octi" width={200} className="octi-float select-none shrink-0" draggable={false} />
    </button>
  );
}

// ————— Piezas de la derecha —————
function Counter({ icon, valor }: { icon: string; valor: number }) {
  return <div className="flex items-center gap-1.5"><span className="text-lg">{icon}</span><span className="font-display font-extrabold text-[15px] text-text">{valor}</span></div>;
}
function Tarjeta({ titulo, children, extra }: { titulo: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3"><h3 className="font-display font-extrabold text-sm">{titulo}</h3>{extra}</div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}
function Desafio({ icon, texto, progreso, total }: { icon: React.ReactNode; texto: string; progreso: number; total: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-xl w-7 grid place-items-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-text leading-tight">{texto}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden"><div className="h-full bg-amber rounded-full" style={{ width: `${(progreso / total) * 100}%` }} /></div>
          <span className="text-[10px] text-hint shrink-0">{progreso} / {total}</span>
        </div>
      </div>
      <ChestIcon />
    </div>
  );
}

function ChestIcon() {
  return (
    <svg width="30" height="27" viewBox="0 0 30 27" fill="none" className="shrink-0">
      {/* cuerpo */}
      <rect x="4" y="13" width="22" height="11" rx="1.5" fill="#D9822B" />
      {/* tapa */}
      <path d="M4 14 Q15 6 26 14 L26 14 L4 14 Z" fill="#E89A45" />
      <path d="M4 13.5 Q15 5.5 26 13.5 L26 15.5 Q15 8 4 15.5 Z" fill="#B45C1E" />
      {/* banda central */}
      <rect x="13" y="8" width="4" height="16" fill="#8A4418" />
      {/* cerradura */}
      <rect x="12.5" y="14" width="5" height="6" rx="1" fill="#F6C948" />
      <circle cx="15" cy="17" r="1.3" fill="#8A4418" />
      {/* base */}
      <rect x="3" y="23" width="24" height="3" rx="1" fill="#8A4418" />
    </svg>
  );
}
function Recurso({ icon, titulo, sub }: { icon: React.ReactNode; titulo: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-accent-soft grid place-items-center text-accent shrink-0">{icon}</div>
      <div className="flex-1"><div className="text-[13px] font-semibold text-text">{titulo}</div><div className="text-[11px] text-sub">{sub}</div></div>
      <span className="text-hint">›</span>
    </div>
  );
}

// ————— Iconos —————
function Sparkle4({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" className={className}>
      <path d="M12 0 C12.8 8 16 11.2 24 12 C16 12.8 12.8 16 12 24 C11.2 16 8 12.8 0 12 C8 11.2 11.2 8 12 0 Z" />
    </svg>
  );
}
function PlayMini() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>; }
function StarIcon() { return <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.7-4.9 4.4 1.4 6.4L12 17.8 6 20l1.4-6.4L2.5 9.2l6.6-.7z" /></svg>; }
function PlayIcon() { return <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>; }
function SparkleIcon({ color }: { color: string }) { return <svg width="28" height="28" viewBox="0 0 24 24" fill={color}><path d="M12 2l1.8 6.4L20 10l-5.4 2.2L13 19l-2.2-5.6L5 12l5.6-2z" /><circle cx="18.5" cy="5.5" r="1.6" /></svg>; }
function LockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>; }
function BellIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>; }
function DocIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h6" /></svg>; }
function BookIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" /></svg>; }
function ToolIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z" /></svg>; }
