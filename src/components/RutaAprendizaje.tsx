"use client";

import { useState } from "react";
import Link from "next/link";
import { Octi } from "@/components/Octi";
import { cerrarSesion } from "@/lib/auth-actions";
import { ETAPA_1, TOTAL_CLASES, nivelPorXP, type Clase } from "@/lib/data";

// Burbujas fijas (para evitar problemas de hidratación con valores aleatorios).
const BURBUJAS = [
  { left: "12%", size: "10px", dur: "9s", delay: "0s" },
  { left: "26%", size: "6px", dur: "7s", delay: "1.5s" },
  { left: "44%", size: "14px", dur: "11s", delay: "0.5s" },
  { left: "58%", size: "8px", dur: "8s", delay: "2.5s" },
  { left: "72%", size: "12px", dur: "10s", delay: "1s" },
  { left: "85%", size: "7px", dur: "7.5s", delay: "3s" },
  { left: "34%", size: "9px", dur: "9.5s", delay: "4s" },
  { left: "66%", size: "5px", dur: "6.5s", delay: "2s" },
];

// TEMPORAL: progreso simulado hasta construir el reproductor (Módulo 05).
const CLASES_COMPLETADAS = 1;

type Estado = "completada" | "actual" | "bloqueada";
type Nodo = { clase: Clase; modulo: string; estado: Estado; x: number; y: number };

const W = 440;
const CX = W / 2;
const AMP = 145;
const SPACING = 132;
const TOP = 80;

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

export function RutaAprendizaje({
  nombre, avatarUrl, xp, gemas, racha,
}: {
  nombre: string; avatarUrl: string | null; xp: number; gemas: number; racha: number;
}) {
  const nivel = nivelPorXP(xp);

  // Aplanar clases con su módulo y estado
  const clases: { clase: Clase; modulo: string }[] = ETAPA_1.flatMap((m) =>
    m.clases.map((clase) => ({ clase, modulo: m.nombre }))
  );

  const nodos: Nodo[] = clases.map((c, i) => ({
    ...c,
    estado: i < CLASES_COMPLETADAS ? "completada" : i === CLASES_COMPLETADAS ? "actual" : "bloqueada",
    x: CX + AMP * Math.sin(i * 0.85),
    y: TOP + i * SPACING,
  }));
  // Nodo del trofeo (diploma) al final
  const trofeoY = TOP + clases.length * SPACING;
  const trofeoX = CX + AMP * Math.sin(clases.length * 0.85);

  const puntos = [...nodos.map((n) => ({ x: n.x, y: n.y })), { x: trofeoX, y: trofeoY }];
  const altura = trofeoY + 120;
  const completadas = CLASES_COMPLETADAS;

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(180deg,#EEF2FF 0%,#F7F7FB 40%,#F0FBFF 100%)" }}>
      {/* ===== Nav izquierda (íconos) ===== */}
      <aside className="hidden md:flex flex-col items-center gap-2 w-16 py-6 bg-surface/70 backdrop-blur border-r border-border sticky top-0 h-screen">
        <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center font-display font-extrabold text-white mb-4">M</div>
        <NavIcon href="/app/ruta" label="Inicio" activo>🏠</NavIcon>
        <NavIcon href="/app/ruta" label="Retos">🎯</NavIcon>
        <NavIcon href="/app/ruta" label="Ranking">🏆</NavIcon>
        <NavIcon href="/app/ruta" label="Comunidad">💬</NavIcon>
        <div className="mt-auto flex flex-col items-center gap-2">
          <NavIcon href="/app/perfil" label="Perfil">👤</NavIcon>
          <form action={cerrarSesion}>
            <button title="Cerrar sesión" className="w-11 h-11 grid place-items-center rounded-xl text-xl hover:bg-bg transition">
              🚪
            </button>
          </form>
        </div>
      </aside>

      {/* ===== Centro: la ruta ===== */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur border-b border-border">
          <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
            <h1 className="font-display text-xl font-extrabold">Ruta de aprendizaje</h1>
            <div className="flex items-center gap-3">
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

          {/* El mapa serpenteante — FONDO SUBMARINO */}
          <div className="relative mx-auto mt-4 rounded-3xl overflow-hidden shadow-lg"
            style={{ width: W, maxWidth: "100%", height: altura, background: "linear-gradient(180deg,#7DD3FC 0%,#38BDF8 30%,#0EA5E9 62%,#075985 100%)" }}>

            {/* Rayos de luz */}
            <div className="absolute inset-0 opacity-25 pointer-events-none" style={{
              backgroundImage: "linear-gradient(105deg, transparent 32%, rgba(255,255,255,.5) 44%, transparent 52%), linear-gradient(75deg, transparent 60%, rgba(255,255,255,.35) 70%, transparent 76%)",
            }} />

            {/* Burbujas subiendo */}
            {BURBUJAS.map((b, i) => (
              <span key={i} className="burbuja" style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.dur, animationDelay: b.delay }} />
            ))}

            {/* Camino (SVG punteado) */}
            <svg viewBox={`0 0 ${W} ${altura}`} className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="xMidYMin meet">
              <path d={construirPath(puntos)} stroke="rgba(255,255,255,0.85)" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 22" />
              <Decoraciones altura={altura} />
            </svg>

            {/* Nodos de clases */}
            {nodos.map((n) => (
              <NodoClase key={n.clase.id} nodo={n} />
            ))}

            {/* Trofeo final */}
            <div className="absolute" style={{ left: trofeoX, top: trofeoY, transform: "translate(-50%,-50%)" }}>
              <div className="w-[68px] h-[68px] rounded-full bg-white/90 border-4 border-amber grid place-items-center text-3xl shadow-lg">
                🏆
              </div>
              <div className="text-center text-[11px] font-bold text-white mt-1 w-24 -ml-3 drop-shadow">Diploma Creador+</div>
            </div>

            {/* Fondo de arena */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent, #FCD9A5 85%)" }} />
            <div className="absolute bottom-1 left-6 text-3xl mar-vaiven">🪸</div>
            <div className="absolute bottom-2 right-8 text-2xl mar-vaiven" style={{ animationDelay: "1s" }}>🌿</div>

            {/* Octi guía interactivo */}
            <div className="absolute" style={{ left: 4, top: nodos[completadas]?.y ?? TOP + 40 }}>
              <OctiInteractivo nombre={nombre} />
            </div>
          </div>
        </div>
      </main>

      {/* ===== Sidebar derecha ===== */}
      <aside className="hidden lg:block w-72 shrink-0 p-5 space-y-4 sticky top-0 h-screen overflow-y-auto">
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

function NodoClase({ nodo }: { nodo: Nodo }) {
  const base = "absolute grid place-items-center rounded-full shadow-lg transition-transform";
  const style = { left: nodo.x, top: nodo.y, transform: "translate(-50%,-50%)" } as const;

  if (nodo.estado === "completada") {
    return (
      <button className={`${base} w-16 h-16 bg-green text-white border-4 border-white hover:scale-105`} style={style} title={nodo.clase.titulo}>
        <span className="text-2xl">★</span>
      </button>
    );
  }
  if (nodo.estado === "actual") {
    return (
      <div className="absolute" style={style}>
        <button className="ruta-pulse w-[72px] h-[72px] grid place-items-center rounded-full bg-accent text-white border-4 border-white shadow-xl shadow-accent/40 hover:scale-105 transition-transform" title={nodo.clase.titulo}>
          <span className="text-2xl">▶</span>
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-[80px] whitespace-nowrap bg-white text-[11px] font-bold text-accent rounded-full px-3 py-1 shadow">
          {nodo.clase.titulo}
        </div>
      </div>
    );
  }
  return (
    <button className={`${base} w-14 h-14 bg-white text-hint border-4 border-border/60`} style={style} title="Completa la anterior para desbloquear">
      <span className="text-lg">🔒</span>
    </button>
  );
}

function Decoraciones({ altura }: { altura: number }) {
  // Vida marina distribuida a lo largo del recorrido.
  return (
    <g>
      <text x="18" y="150" fontSize="26">🐠</text>
      <text x={W - 52} y="230" fontSize="24">🐟</text>
      <text x="26" y={altura * 0.35} fontSize="28">🌿</text>
      <text x={W - 46} y={altura * 0.42} fontSize="26">🐚</text>
      <text x="16" y={altura * 0.55} fontSize="24">🐡</text>
      <text x={W - 40} y={altura * 0.62} fontSize="30">🌿</text>
      <text x="30" y={altura * 0.75} fontSize="26">🐠</text>
      <text x={W - 56} y={altura * 0.8} fontSize="24">⭐</text>
      <text x={W / 2 - 10} y={altura * 0.9} fontSize="22">🐟</text>
    </g>
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
    <button
      onClick={() => setI((n) => (n + 1) % MENSAJES.length)}
      className="text-left hover:scale-[1.04] active:scale-95 transition"
      title="Tócame 🐙"
    >
      <Octi size={120} mensaje={MENSAJES[i]} />
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
