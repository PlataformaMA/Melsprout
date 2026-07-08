"use client";

import { useState } from "react";
import Link from "next/link";
import { Octi } from "@/components/Octi";
import { cerrarSesion } from "@/lib/auth-actions";
import { ETAPA_1, TOTAL_CLASES, nivelPorXP, type Clase } from "@/lib/data";

const BURBUJAS = [
  { left: "6%", size: "10px", dur: "13s", delay: "0s" },
  { left: "18%", size: "6px", dur: "10s", delay: "2s" },
  { left: "31%", size: "16px", dur: "16s", delay: "1s" },
  { left: "43%", size: "8px", dur: "11s", delay: "3.5s" },
  { left: "55%", size: "12px", dur: "14s", delay: "0.5s" },
  { left: "67%", size: "7px", dur: "9s", delay: "2.5s" },
  { left: "78%", size: "14px", dur: "15s", delay: "1.5s" },
  { left: "90%", size: "9px", dur: "12s", delay: "4s" },
  { left: "12%", size: "5px", dur: "8s", delay: "5s" },
  { left: "62%", size: "6px", dur: "10s", delay: "6s" },
];

const DECOR = [
  { e: "🐠", top: "14%", left: "7%", anim: "mar-nada", delay: "0s", size: "30px" },
  { e: "🐟", top: "28%", left: "90%", anim: "mar-nada", delay: "1s", size: "26px" },
  { e: "🐡", top: "52%", left: "94%", anim: "mar-nada", delay: "2s", size: "28px" },
  { e: "🐠", top: "66%", left: "4%", anim: "mar-nada", delay: "1.5s", size: "26px" },
  { e: "🌿", top: "72%", left: "10%", anim: "mar-vaiven", delay: "0s", size: "44px" },
  { e: "🪸", top: "80%", left: "86%", anim: "mar-vaiven", delay: "0.6s", size: "40px" },
  { e: "🌿", top: "78%", left: "50%", anim: "mar-vaiven", delay: "1.2s", size: "38px" },
  { e: "🐚", top: "88%", left: "28%", anim: "", delay: "0s", size: "24px" },
  { e: "⭐", top: "90%", left: "68%", anim: "", delay: "0s", size: "24px" },
  { e: "🫧", top: "40%", left: "12%", anim: "", delay: "0s", size: "20px" },
];

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
    x: CX + AMP * Math.sin(i * 0.85),
    y: TOP + i * SPACING,
  }));
  const trofeoY = TOP + clases.length * SPACING;
  const trofeoX = CX + AMP * Math.sin(clases.length * 0.85);
  const puntos = [...nodos.map((n) => ({ x: n.x, y: n.y })), { x: trofeoX, y: trofeoY }];
  const altura = trofeoY + 120;
  const completadas = CLASES_COMPLETADAS;

  return (
    <div className="min-h-screen flex relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#BAE6FD 0%,#7DD3FC 22%,#38BDF8 48%,#0EA5E9 72%,#075985 100%)" }}>

      {/* Rayos de luz (todo el fondo) */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: "linear-gradient(102deg, transparent 30%, rgba(255,255,255,.6) 42%, transparent 50%), linear-gradient(78deg, transparent 58%, rgba(255,255,255,.4) 68%, transparent 74%)",
      }} />

      {/* Burbujas (todo el fondo) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {BURBUJAS.map((b, i) => (
          <span key={i} className="burbuja" style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.dur, animationDelay: b.delay }} />
        ))}
      </div>

      {/* Vida marina (todo el fondo) */}
      <div className="fixed inset-0 pointer-events-none">
        {DECOR.map((d, i) => (
          <span key={i} className={`absolute ${d.anim}`} style={{ top: d.top, left: d.left, fontSize: d.size, animationDelay: d.delay }}>{d.e}</span>
        ))}
      </div>

      {/* Arena en el fondo */}
      <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent, #FCD9A5 88%)" }} />

      {/* ===== Nav izquierda ===== */}
      <aside className="hidden md:flex flex-col items-center gap-2 w-16 py-6 bg-white/45 backdrop-blur-md border-r border-white/40 sticky top-0 h-screen z-20">
        <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center font-display font-extrabold text-white mb-4">M</div>
        <NavIcon href="/app/ruta" label="Inicio" activo>🏠</NavIcon>
        <NavIcon href="/app/ruta" label="Retos">🎯</NavIcon>
        <NavIcon href="/app/ruta" label="Ranking">🏆</NavIcon>
        <NavIcon href="/app/ruta" label="Comunidad">💬</NavIcon>
        <NavIcon href="/app/config" label="Configuración">⚙️</NavIcon>
        <div className="mt-auto flex flex-col items-center gap-2">
          <NavIcon href="/app/perfil" label="Mi perfil">👤</NavIcon>
          <form action={cerrarSesion}>
            <button title="Cerrar sesión" className="w-11 h-11 grid place-items-center rounded-xl text-xl hover:bg-white/40 transition">🚪</button>
          </form>
        </div>
      </aside>

      {/* ===== Centro ===== */}
      <main className="flex-1 min-w-0 relative z-10">
        <header className="sticky top-0 z-20 bg-white/40 backdrop-blur-md border-b border-white/40">
          <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
            <h1 className="font-display text-xl font-extrabold text-[#0C4A6E]">Ruta de aprendizaje</h1>
            <div className="flex items-center gap-2.5">
              <Contador emoji="🔥" valor={racha} />
              <Contador emoji="💎" valor={gemas} />
              <Contador emoji="⭐" valor={xp} />
              <Link href="/app/perfil" className="ml-1">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Tu perfil" className="w-9 h-9 rounded-full object-cover border-2 border-white" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent grid place-items-center text-white text-xs font-bold border-2 border-white">
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
              className="flex items-center gap-3 rounded-2xl p-4 mb-4 bg-white/95 backdrop-blur border-2 border-amber/40 shadow-lg hover:scale-[1.01] transition">
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
          <div className="rounded-2xl px-5 py-4 flex items-center justify-between text-white shadow-lg"
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

          {/* El mapa serpenteante (directo sobre el mar) */}
          <div className="relative mx-auto mt-6" style={{ width: W, maxWidth: "100%", height: altura }}>
            <svg viewBox={`0 0 ${W} ${altura}`} className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="xMidYMin meet">
              <path d={construirPath(puntos)} stroke="rgba(255,255,255,0.9)" strokeWidth="8" strokeLinecap="round" strokeDasharray="1 24" />
            </svg>

            {nodos.map((n) => (
              <NodoClase key={n.clase.id} nodo={n} />
            ))}

            <div className="absolute" style={{ left: trofeoX, top: trofeoY, transform: "translate(-50%,-50%)" }}>
              <div className="w-[68px] h-[68px] rounded-full bg-white/90 border-4 border-amber grid place-items-center text-3xl shadow-lg">🏆</div>
              <div className="text-center text-[11px] font-bold text-white mt-1 w-24 -ml-3 drop-shadow">Diploma Creador+</div>
            </div>

            <div className="absolute" style={{ left: 0, top: nodos[completadas]?.y ?? TOP + 40 }}>
              <OctiInteractivo nombre={nombre} />
            </div>
          </div>
        </div>
      </main>

      {/* ===== Sidebar derecha ===== */}
      <aside className="hidden lg:block w-72 shrink-0 p-5 space-y-4 sticky top-0 h-screen overflow-y-auto z-20">
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
        <button className="ruta-pulse w-[72px] h-[72px] grid place-items-center rounded-full bg-accent text-white border-4 border-white shadow-xl hover:scale-105 transition-transform" title={nodo.clase.titulo}>
          <span className="text-2xl">▶</span>
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-[80px] whitespace-nowrap bg-white text-[11px] font-bold text-accent rounded-full px-3 py-1 shadow">
          {nodo.clase.titulo}
        </div>
      </div>
    );
  }
  return (
    <button className={`${base} w-14 h-14 bg-white/85 text-hint border-4 border-white/70`} style={style} title="Completa la anterior para desbloquear">
      <span className="text-lg">🔒</span>
    </button>
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
      className={`w-11 h-11 grid place-items-center rounded-xl text-xl transition ${activo ? "bg-white/70 shadow-sm" : "hover:bg-white/40"}`}>
      {children}
    </Link>
  );
}

function Contador({ emoji, valor }: { emoji: string; valor: number }) {
  return (
    <div className="flex items-center gap-1 bg-white/80 rounded-full px-2.5 py-1">
      <span className="text-sm">{emoji}</span>
      <span className="font-display font-extrabold text-sm text-text">{valor}</span>
    </div>
  );
}

function Tarjeta({ titulo, children, extra }: { titulo: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="bg-white/90 backdrop-blur border border-white/60 rounded-2xl p-4 shadow-lg">
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
