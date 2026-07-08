"use client";

import { useState } from "react";
import Link from "next/link";
import { Octi } from "@/components/Octi";
import { cerrarSesion } from "@/lib/auth-actions";
import { ETAPA_1, TOTAL_CLASES, nivelPorXP, type Clase } from "@/lib/data";

const W = 600;
const CX = W / 2;
const AMP = 205;
const SPACING = 124;
const TOP = 80;
const FREQ = 0.92;
const PHASE = -0.7;
const nodeX = (i: number) => CX + AMP * Math.sin(i * FREQ + PHASE);
const pctX = (x: number) => `${(x / W) * 100}%`;

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

const CLASES_COMPLETADAS = 1;
type Estado = "completada" | "actual" | "bloqueada";
type Nodo = { clase: Clase; modulo: string; estado: Estado; x: number; y: number };

export function RutaAprendizaje({
  nombre, avatarUrl, xp, gemas, racha, perfilPct,
}: {
  nombre: string; avatarUrl: string | null; xp: number; gemas: number; racha: number; perfilPct: number;
}) {
  const nivel = nivelPorXP(xp);

  const clases = ETAPA_1.flatMap((m) => m.clases.map((clase) => ({ clase, modulo: m.nombre })));
  const nodos: Nodo[] = clases.map((c, i) => ({
    ...c,
    estado: i < CLASES_COMPLETADAS ? "completada" : i === CLASES_COMPLETADAS ? "actual" : "bloqueada",
    x: nodeX(i),
    y: TOP + i * SPACING,
  }));
  const trofeoY = TOP + clases.length * SPACING;
  const trofeoX = nodeX(clases.length);
  const puntos = [...nodos.map((n) => ({ x: n.x, y: n.y })), { x: trofeoX, y: trofeoY }];
  const altura = trofeoY + 120;
  const completadas = CLASES_COMPLETADAS;

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-bg">
      {/* ===== Nav izquierda ===== */}
      <aside className="hidden md:flex flex-col items-center gap-2 w-16 py-6 bg-surface border-r border-border sticky top-0 h-screen z-20">
        <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center font-display font-extrabold text-white mb-4">M</div>
        <NavIcon href="/app/ruta" label="Inicio" activo>🏠</NavIcon>
        <NavIcon href="/app/ruta" label="Retos">🎯</NavIcon>
        <NavIcon href="/app/ruta" label="Ranking">🏆</NavIcon>
        <NavIcon href="/app/ruta" label="Comunidad">💬</NavIcon>
        <NavIcon href="/app/config" label="Configuración">⚙️</NavIcon>
        <div className="mt-auto flex flex-col items-center gap-2">
          <NavIcon href="/app/perfil" label="Mi perfil">👤</NavIcon>
          <form action={cerrarSesion}>
            <button title="Cerrar sesión" className="w-11 h-11 grid place-items-center rounded-xl text-xl hover:bg-bg transition">🚪</button>
          </form>
        </div>
      </aside>

      {/* ===== Centro ===== */}
      <main className="flex-1 min-w-0 relative z-10">
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-border">
          <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
            <h1 className="font-display text-xl font-extrabold">Ruta de aprendizaje</h1>
            <div className="flex items-center gap-2.5">
              <Contador emoji="🔥" valor={racha} />
              <Contador emoji="💎" valor={gemas} />
              <Contador emoji="⭐" valor={xp} />
              <Link href="/app/perfil" className="ml-1">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Tu perfil" className="w-9 h-9 rounded-full object-cover border-2 border-accent/30" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent grid place-items-center text-white text-xs font-bold">
                    {nombre.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-5 py-6">
          {/* Banner: completa tu perfil y gana puntos */}
          {perfilPct < 100 && (
            <Link href="/app/perfil/completar"
              className="flex items-center gap-3 rounded-2xl p-4 mb-4 bg-surface border-2 border-amber/40 shadow-sm hover:scale-[1.01] transition">
              <div className="text-3xl">🎁</div>
              <div className="flex-1">
                <div className="font-bold text-sm text-text">
                  Tu perfil está al {perfilPct}% — complétalo y gana <span className="text-accent">+15 💎</span>
                </div>
                <div className="text-[12px] text-sub">Sube tu foto, redes y métricas paso a paso con Octi 🐙</div>
              </div>
              <span className="text-accent font-bold text-lg">→</span>
            </Link>
          )}

          {/* Banner del módulo */}
          <div className="rounded-2xl px-5 py-4 flex items-center justify-between text-white shadow-lg shadow-accent/20"
            style={{ background: "linear-gradient(120deg,#6D28D9,#7C3AED)" }}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">Etapa 1 · Starter</div>
              <div className="font-display text-lg font-extrabold">Módulo 1: Fundamentos del creador</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-extrabold">{completadas}/{TOTAL_CLASES}</div>
              <div className="text-[11px] text-white/70">clases</div>
            </div>
          </div>

          {/* El mapa serpenteante (ancho, más horizontal) */}
          <div className="relative mx-auto mt-6 w-full" style={{ maxWidth: 700, height: altura }}>
            <svg viewBox={`0 0 ${W} ${altura}`} className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none">
              <path d={construirPath(puntos)} stroke="#C7BEF5" strokeWidth="9" strokeLinecap="round" strokeDasharray="2 22" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* Decoración marina (HTML, no se distorsiona) */}
            <DecorMar altura={altura} />

            {nodos.map((n) => (
              <NodoClase key={n.clase.id} nodo={n} />
            ))}

            <div className="absolute" style={{ left: pctX(trofeoX), top: trofeoY, transform: "translate(-50%,-50%)" }}>
              <div className="w-[68px] h-[68px] rounded-full bg-white border-4 border-amber-soft grid place-items-center text-3xl shadow-lg opacity-80">🏆</div>
              <div className="text-center text-[11px] font-bold text-amber mt-1 w-24 -ml-3">Diploma Creador+</div>
            </div>

            <div className="absolute z-10" style={{ left: "1%", top: nodos[completadas]?.y ?? TOP + 40 }}>
              <OctiInteractivo nombre={nombre} />
            </div>
          </div>
        </div>
      </main>

      {/* ===== Sidebar derecha ===== */}
      <aside className="hidden lg:block w-72 shrink-0 p-5 space-y-4 sticky top-0 h-screen overflow-y-auto z-20 bg-bg/50">
        <Tarjeta titulo="Desafíos del día" extra={<span className="text-[12px] text-accent font-semibold">Ver todos</span>}>
          <Desafio emoji="⚡" texto="Gana 10 XP" progreso={0} total={10} />
          <Desafio emoji="🎯" texto="Termina 1 clase" progreso={0} total={1} />
        </Tarjeta>

        <Tarjeta titulo="Nivel actual">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 grid place-items-center text-2xl rounded-2xl bg-accent-soft">⬡</div>
            <div>
              <div className="font-display font-extrabold text-text">{nivel.actual.nombre}</div>
              {nivel.siguiente && <div className="text-[11px] text-sub">{nivel.faltan} XP para {nivel.siguiente.nombre}</div>}
            </div>
          </div>
          {nivel.siguiente && (
            <div className="h-2 rounded-full bg-bg overflow-hidden mt-3">
              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, Math.round((xp / nivel.siguiente.xp) * 100))}%` }} />
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Recursos">
          <Recurso emoji="📄" titulo="Plantillas" sub="para creadores" />
          <Recurso emoji="📖" titulo="Guías" sub="rápidas" />
          <Recurso emoji="🛠️" titulo="Herramientas" sub="recomendadas" />
        </Tarjeta>
      </aside>
    </div>
  );
}

function Destello() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <path d="M12 2 L13.7 9.5 L21 12 L13.7 14.5 L12 22 L10.3 14.5 L3 12 L10.3 9.5 Z" fill="#CBD0DB" />
    </svg>
  );
}

function NodoClase({ nodo }: { nodo: Nodo }) {
  const pos = { left: pctX(nodo.x), top: nodo.y, transform: "translate(-50%,-50%)" } as const;

  if (nodo.estado === "completada") {
    return (
      <button className="absolute grid place-items-center rounded-full w-16 h-16 bg-green text-white border-4 border-white hover:scale-105 transition-transform z-[5]"
        style={{ ...pos, boxShadow: "0 6px 0 #047857, 0 10px 14px rgba(0,0,0,.14)" }} title={nodo.clase.titulo}>
        <span className="text-2xl">★</span>
      </button>
    );
  }
  if (nodo.estado === "actual") {
    return (
      <div className="absolute z-[6]" style={pos}>
        <button className="ruta-pulse w-[74px] h-[74px] grid place-items-center rounded-full bg-accent text-white border-4 border-white hover:scale-105 transition-transform"
          style={{ boxShadow: "0 6px 0 #5B21B6, 0 12px 16px rgba(124,58,237,.3)" }} title={nodo.clase.titulo}>
          <span className="text-2xl ml-0.5">▶</span>
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-[84px] whitespace-nowrap bg-white text-[11px] font-bold text-accent rounded-full px-3 py-1.5 shadow-md">
          {nodo.clase.titulo}
        </div>
      </div>
    );
  }
  return (
    <button className="absolute grid place-items-center rounded-full w-16 h-16 bg-white border-4 border-white hover:scale-105 transition-transform z-[5]"
      style={{ ...pos, boxShadow: "0 6px 0 #E7E4EC, 0 10px 12px rgba(0,0,0,.08)" }} title="Completa la anterior para desbloquear">
      <Destello />
    </button>
  );
}

function AlgaRoja() {
  return (
    <svg width="52" height="78" viewBox="0 0 52 78" fill="none">
      <path d="M14 76 C7 60 19 52 11 38 C4 25 18 18 13 4" stroke="#E8586A" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M26 76 C33 58 21 48 29 34 C36 21 24 12 31 2" stroke="#D63F52" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M38 76 C31 62 41 52 35 42 C30 33 39 26 37 16" stroke="#F27A88" strokeWidth="5.5" strokeLinecap="round" />
      <ellipse cx="26" cy="76" rx="16" ry="3.5" fill="#E8586A" opacity="0.18" />
    </svg>
  );
}

function CoralTurquesa() {
  return (
    <svg width="80" height="66" viewBox="0 0 80 66" fill="none" stroke="#2CA6A4" strokeWidth="7" strokeLinecap="round">
      <path d="M40 64 L40 30" />
      <path d="M40 42 C31 34 24 36 22 24" />
      <path d="M40 38 C49 32 56 34 58 22" />
      <path d="M22 24 C19 17 24 13 22 5" />
      <path d="M58 22 C61 15 56 11 58 4" />
      <path d="M40 30 C37 22 43 17 40 8" />
      <ellipse cx="40" cy="64" rx="20" ry="3.5" fill="#2CA6A4" stroke="none" opacity="0.18" />
    </svg>
  );
}

function Burbujas() {
  return (
    <svg width="62" height="58" viewBox="0 0 62 58" fill="none">
      <circle cx="26" cy="34" r="13" stroke="#7DD3FC" strokeWidth="3" opacity="0.75" />
      <circle cx="46" cy="20" r="8" stroke="#7DD3FC" strokeWidth="2.6" opacity="0.65" />
      <circle cx="44" cy="42" r="5" stroke="#7DD3FC" strokeWidth="2.2" opacity="0.55" />
      <circle cx="22" cy="29" r="3.4" fill="#BAE6FD" opacity="0.8" />
    </svg>
  );
}

function DecorMar({ altura }: { altura: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      <div className="absolute mar-vaiven" style={{ left: "5%", top: 46 }}><AlgaRoja /></div>
      <div className="absolute" style={{ left: "56%", top: 128 }}><Burbujas /></div>
      <div className="absolute mar-vaiven" style={{ left: "78%", top: altura * 0.5, animationDelay: "1s" }}><CoralTurquesa /></div>
      <div className="absolute mar-vaiven" style={{ left: "4%", top: altura * 0.72, animationDelay: ".5s" }}><AlgaRoja /></div>
      <div className="absolute" style={{ left: "30%", top: altura * 0.86 }}><Burbujas /></div>
    </div>
  );
}

function OctiInteractivo({ nombre }: { nombre: string }) {
  const primer = nombre.split(" ")[0];
  const MENSAJES = [
    `¡Hola, ${primer}! 🐙 Continuemos tu camino.`,
    "Toca el nodo morado para empezar tu clase de hoy. ▶",
    "Una clase al día y en 90 días serás otro creador. 🚀",
    "¡No dejes que se apague tu racha! 🔥",
    "Publicar constante le gana al talento. Siempre.",
    "Estoy aquí para nadar contigo en cada ola. 🌊",
  ];
  const [i, setI] = useState(0);
  return (
    <button onClick={() => setI((n) => (n + 1) % MENSAJES.length)} className="text-left hover:scale-[1.04] active:scale-95 transition" title="Tócame 🐙">
      <Octi size={124} mensaje={MENSAJES[i]} />
    </button>
  );
}

function NavIcon({ href, label, children, activo }: { href: string; label: string; children: React.ReactNode; activo?: boolean }) {
  return (
    <Link href={href} title={label}
      className={`w-11 h-11 grid place-items-center rounded-xl text-xl transition ${activo ? "bg-accent-soft" : "hover:bg-bg"}`}>
      {children}
    </Link>
  );
}

function Contador({ emoji, valor }: { emoji: string; valor: number }) {
  return (
    <div className="flex items-center gap-1 bg-bg rounded-full px-2.5 py-1">
      <span className="text-sm">{emoji}</span>
      <span className="font-display font-extrabold text-sm text-text">{valor}</span>
    </div>
  );
}

function Tarjeta({ titulo, children, extra }: { titulo: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-extrabold text-sm">{titulo}</h3>
        {extra}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Desafio({ emoji, texto, progreso, total }: { emoji: string; texto: string; progreso: number; total: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-amber-soft grid place-items-center">{emoji}</div>
      <div className="flex-1">
        <div className="text-[12.5px] font-semibold text-text">{texto}</div>
        <div className="h-1.5 rounded-full bg-bg overflow-hidden mt-1">
          <div className="h-full bg-amber rounded-full" style={{ width: `${(progreso / total) * 100}%` }} />
        </div>
      </div>
      <span className="text-[11px] text-hint">{progreso}/{total}</span>
    </div>
  );
}

function Recurso({ emoji, titulo, sub }: { emoji: string; titulo: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-accent-soft grid place-items-center text-base">{emoji}</div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-text">{titulo}</div>
        <div className="text-[11px] text-sub">{sub}</div>
      </div>
      <span className="text-hint">›</span>
    </div>
  );
}
