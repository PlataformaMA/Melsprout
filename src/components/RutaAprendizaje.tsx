"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { RankingModal, type RankItem } from "@/components/RankingModal";
import { CofreModal } from "@/components/CofreModal";
import { RachaModal } from "@/components/RachaModal";
import { RecursosModal } from "@/components/RecursosModal";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import type { Recurso } from "@/lib/recursos-actions";
import { octiFrases, type Genero } from "@/lib/genero";
import { TODO_DESBLOQUEADO } from "@/lib/flags";
import { VerificarBanner } from "@/components/VerificarBanner";
import { type Clase, type ModuloCurso } from "@/lib/data";
import { type RachaInfo } from "@/lib/racha-actions";

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

type EClase = "completada" | "actual" | "bloqueada";
type EReto = "completada" | "en-revision" | "rechazada" | "pendiente" | "bloqueada";
type Elemento =
  | { tipo: "clase"; clase: Clase; estado: EClase }
  | { tipo: "reto"; clase: Clase; estado: EReto }
  | { tipo: "hito"; modulo: ModuloCurso; estado: "completada" | "bloqueada" }
  | { tipo: "gate"; modulo: ModuloCurso; estado: "desbloqueada" | "bloqueada" };

// Construye los nodos según el progreso REAL. `completadas` es la FRONTERA:
// hasta dónde llegó el alumno (la clase más avanzada que terminó, +1). `hechas`
// dice cuáles terminó de verdad, para no pintar como vista una que se saltó.
function construirElementos(cursos: ModuloCurso[], completadas: number, retoEstados: Record<string, EReto>, hechas: Set<string>): Elemento[] {
  const els: Elemento[] = [];
  let gi = 0;
  cursos.forEach((modulo) => {
    const inicioModulo = gi;
    modulo.clases.forEach((clase) => {
      const ec: EClase = hechas.has(clase.id)
        ? "completada"
        : gi <= completadas || TODO_DESBLOQUEADO
          ? "actual"
          : "bloqueada";
      // El reto se puede intentar si su clase ya está disponible (actual o completada).
      const disponible = gi <= completadas || TODO_DESBLOQUEADO;
      const er: EReto = retoEstados[clase.id] ?? (disponible ? "pendiente" : "bloqueada");
      els.push({ tipo: "clase", clase, estado: ec });
      els.push({ tipo: "reto", clase, estado: er });
      gi++;
    });
    const moduloDone = inicioModulo + modulo.clases.length <= completadas;
    const moduloAbierto = moduloDone || TODO_DESBLOQUEADO;
    els.push({ tipo: "hito", modulo, estado: moduloDone ? "completada" : "bloqueada" });
    els.push({ tipo: "gate", modulo, estado: moduloAbierto ? "desbloqueada" : "bloqueada" });
  });
  return els;
}

export type TopCreador = { id: string; nombre: string; avatarUrl: string | null; xp: number; esTu: boolean };

export function RutaAprendizaje({
  nombre, avatarUrl, gemas, racha, perfilPct, topCreadores = [], completadas = 0, completadasIds = [], retoEstados = {}, cursos, recursos = [], genero = "neutro", notifSinLeer = 0, tuRanking, ranking = [], emailVerificado = true, xp = 0, rachaInfo,
}: {
  nombre: string; avatarUrl: string | null; gemas: number; racha: number; perfilPct: number; topCreadores?: TopCreador[];
  completadas?: number; completadasIds?: string[]; recursos?: Recurso[]; genero?: Genero; notifSinLeer?: number; retoEstados?: Record<string, EReto>; cursos: ModuloCurso[]; tuRanking?: { pos: number; xp: number };
  ranking?: RankItem[]; emailVerificado?: boolean; xp?: number; rachaInfo?: RachaInfo;
}) {
  const hechas = new Set(completadasIds);
  // Las clases "Próximamente" se ven, pero NO entran en la secuencia: si entraran,
  // todos se frenarían al llegar a una clase que todavía no está grabada.
  const cursosSeq = useMemo(
    () => cursos.map((m) => ({ ...m, clases: m.clases.filter((c) => !c.proximamente) })),
    [cursos]
  );
  const elementos = construirElementos(cursosSeq, completadas, retoEstados, hechas);
  // TODOS los nodos siguen la misma onda senoidal → serpentina continua y suave (sin codos).
  const pts = elementos.map((_, i) => ({
    x: serpX(i),
    y: TOP + i * SPACING,
  }));
  const altura = TOP + elementos.length * SPACING + 40;

  // Módulo actual (el que contiene la clase "actual")
  const idxActual = elementos.findIndex((e) => e.tipo === "clase" && e.estado === "actual");
  const moduloActual = idxActual >= 0 && elementos[idxActual].tipo === "clase"
    ? cursos.find((m) => m.clases.includes((elementos[idxActual] as { clase: Clase }).clase))
    : cursos[0];

  // Octi ACOMPAÑA a la clase actual, a su misma altura. OJO: la serpentina pasa
  // por TRES carriles (16%, 48% y 81%), no dos — el central también lleva nodos.
  // Por eso Octi se coloca en el carril opuesto al del nodo actual, calculado,
  // y nunca con un porcentaje fijo (así era como se encimaba en móvil).
  const idxOcti = idxActual >= 0 ? idxActual : 0;
  // A media distancia entre el nodo actual y el siguiente: en esa franja no
  // hay nodos, así que Octi acompaña sin taparle el clic a nadie.
  const octiY = (pts[idxOcti]?.y ?? TOP) + SPACING / 2;
  const claseActual = elementos[idxOcti]?.tipo === "clase"
    ? (elementos[idxOcti] as { clase: Clase }).clase
    : null;
  // Carril opuesto al nodo actual, acotado: en móvil el contenedor es angosto y
  // sin este tope a Octi se le cortaba el cuerpo contra el borde.
  const OCTI_MIN = 100, OCTI_MAX = 540;
  const octiX = Math.min(OCTI_MAX, Math.max(OCTI_MIN,
    serpX(idxOcti) >= CX ? CX - AMP : CX + AMP));

  // Progreso del MÓDULO actual (para el banner "Tu progreso").
  const modIdx = Math.max(0, cursos.indexOf(moduloActual ?? cursos[0]));
  const mod = moduloActual ?? cursos[0];
  const startIdx = cursos.slice(0, modIdx).reduce((a, m) => a + m.clases.length, 0);
  const totalMod = mod?.clases.length ?? 0;
  const clasesMod = Math.max(0, Math.min(totalMod, completadas - startIdx));
  const retosMod = (mod?.clases ?? []).filter((c) => retoEstados[c.id] === "completada").length;
  const pctMod = totalMod ? Math.round((clasesMod / totalMod) * 100) : 0;

  // ——— Pop-ups diarios: racha (check-in) y ranking, 1 vez al día. ———
  // Nunca en el PRIMER login del usuario. La racha sale primero; al cerrarla,
  // sale el ranking (si toca hoy) — así no se encima uno con otro.
  const [rankingAbierto, setRankingAbierto] = useState(false);
  const [rachaAbierto, setRachaAbierto] = useState(false);

  const hoyStr = () => new Date().toISOString().slice(0, 10); // AAAA-MM-DD
  const abrirRankingSiToca = () => {
    try {
      if (ranking.length > 0 && localStorage.getItem("melsprout_ranking_dia") !== hoyStr()) {
        localStorage.setItem("melsprout_ranking_dia", hoyStr());
        setRankingAbierto(true);
      }
    } catch {}
  };

  useEffect(() => {
    try {
      const hoy = hoyStr();
      // Primer login en este navegador: solo lo marcamos, no mostramos nada.
      if (!localStorage.getItem("melsprout_visto")) {
        localStorage.setItem("melsprout_visto", hoy);
        return;
      }
      // Racha: 1 vez al día. Al cerrarla, se muestra el ranking.
      if (rachaInfo && localStorage.getItem("melsprout_racha_dia") !== hoy) {
        localStorage.setItem("melsprout_racha_dia", hoy);
        setRachaAbierto(true);
        return;
      }
      // Si la racha ya salió hoy, mostramos el ranking directo.
      abrirRankingSiToca();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ranking.length, rachaInfo]);

  // ——— Mundos (cada módulo = un mundo temático) + Cofre de recompensas ———
  const [mundosAbierto, setMundosAbierto] = useState(false);
  const [vista, setVista] = useState<"camino" | "bloques">("camino");
  const [menuMundo, setMenuMundo] = useState(false);
  // null = todos los mundos. En Bloques filtra; en Camino solo baja hasta ahí.
  const [mundoFiltro, setMundoFiltro] = useState<number | null>(null);

  // Índice global de la primera clase de cada módulo: sirve para saltar a un
  // módulo dentro del camino sin recalcular toda la serpentina.
  const inicioDeModulo = useMemo(() => {
    const out: number[] = [];
    let g = 0;
    for (const m of cursosSeq) { out.push(g); g += m.clases.length; }
    return out;
  }, [cursosSeq]);

  function irAModulo(i: number) {
    setMenuMundo(false);
    setMundoFiltro(i);
    if (vista === "bloques") return; // en bloques basta con filtrar

    const gi = inicioDeModulo[i] ?? 0;
    // Cada clase ocupa 2 nodos (clase + reto) y cada módulo agrega hito + gate.
    const idx = gi * 2 + i * 2;
    const y = TOP + idx * SPACING;
    window.scrollTo({ top: Math.max(0, y - 120), behavior: "smooth" });
  }
  const [cofreAbierto, setCofreAbierto] = useState(false);
  const [recursosAbierto, setRecursosAbierto] = useState(false);
  const mundos = cursos.map((m, i) => {
    const start = cursos.slice(0, i).reduce((a, x) => a + x.clases.length, 0);
    const done = start + m.clases.length <= completadas;
    const estado: "completado" | "actual" | "bloqueado" = done ? "completado" : i === modIdx ? "actual" : "bloqueado";
    return { nombre: m.nombre, estado };
  });

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="clases" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          {/* Barra superior */}
          <header className="flex items-center justify-end gap-4 mb-4 h-10">
            <Link href="/app/racha" title="Mi racha" className="hover:scale-105 transition"><Counter icon="🔥" valor={racha} /></Link>
            <Counter icon="💎" valor={gemas} />
            <CampanaNotificaciones sinLeerInicial={notifSinLeer} />
            <button className="hidden" aria-hidden>
              <BellIcon />
            </button>
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <div className="mb-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold">¡Hola, {nombre.split(" ")[0]}! 👋</h1>
              <p className="text-sub text-[14px] mt-0.5">Tu ruta de aprendizaje. Sigue creciendo, un paso a la vez. 💜</p>
            </div>
            {/* Camino = el mapa serpenteante. Bloques = la misma ruta en lista,
                para quien quiere ver todo de un vistazo sin hacer scroll. */}
            <div className="shrink-0 flex items-center gap-1 bg-surface border border-border rounded-full p-1 shadow-sm">
              {(["camino", "bloques"] as const).map((v) => (
                <button key={v} onClick={() => setVista(v)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                    vista === v ? "bg-accent text-white shadow-sm" : "text-sub hover:text-text"
                  }`}>
                  <OjoIcon />
                  <span className="hidden sm:inline">{v === "camino" ? "Camino" : "Bloques"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* ——— Mapa ——— */}
            <div className="min-w-0">
              {/* Banner "Tu progreso" */}
              <div className="relative overflow-hidden rounded-2xl px-5 sm:px-6 py-5 mb-4 border border-accent/15 shadow-sm"
                style={{ background: "linear-gradient(135deg,#EEE9FF,#F8F5FF)" }}>
                <Sparkle4 className="absolute right-6 top-3 opacity-20 text-accent" size={40} />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-accent/80 uppercase tracking-wider">Tu progreso</div>
                    <h2 className="font-display text-base sm:text-lg font-extrabold mt-0.5 truncate">
                      Módulo {modIdx + 1}: {mod?.nombre}
                    </h2>
                    <p className="text-[12.5px] text-sub mt-0.5">
                      {clasesMod}/{totalMod} clases completadas · {retosMod}/{totalMod} retos completados
                    </p>
                  </div>
                  <button onClick={() => setRecursosAbierto(true)}
                    className="shrink-0 flex items-center gap-2 bg-accent text-white rounded-full pl-4 pr-1.5 py-1.5 text-[13px] font-bold shadow hover:brightness-110 active:scale-95 transition">
                    Recursos
                    <span className="w-6 h-6 rounded-full bg-white/25 grid place-items-center"><PlayMini /></span>
                  </button>
                </div>

                {/* Barra con Octi como marcador + hexágono "Mundo" al final */}
                <div className="relative mt-5 flex items-center gap-2">
                  <div className="relative flex-1 h-3 rounded-full bg-white/70 border border-accent/10">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-700" style={{ width: `${pctMod}%` }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/octi.png" alt="" className="absolute -top-4 w-8 -translate-x-1/2 transition-all duration-700 drop-shadow" style={{ left: `clamp(16px, ${pctMod}%, calc(100% - 16px))` }} draggable={false} />
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="hidden sm:inline text-[11px] font-bold text-accent">Mundo {modIdx + 1}</span>
                    <span className="w-8 h-8 grid place-items-center text-white text-[13px] shrink-0"
                      style={{ background: "#7C3AED", clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)" }}>★</span>
                  </div>
                </div>
              </div>

              {/* Botones rápidos (solo íconos): Cofre + Brújula, debajo de "Tu progreso", a la derecha */}
              <div className="flex gap-3 mb-4 justify-end">
                <BotonIcono img="/cofre.png" emoji="🧰" label="Cofre · recompensas" onClick={() => setCofreAbierto(true)} />
                <BotonIcono img="/brujula.png" emoji="🧭" label="Brújula · tus mundos" onClick={() => setMundosAbierto(true)} />
              </div>

              {/* Selector de módulo */}
              <div className="relative mb-3 flex items-center justify-between gap-3">
                <div className="relative">
                  <button onClick={() => setMenuMundo((v) => !v)}
                    className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-4 py-2.5 font-display font-extrabold shadow-sm hover:border-accent/40 transition">
                    {mundoFiltro === null ? "Todos los mundos" : `Mundo ${mundoFiltro + 1}`}
                    <span className={`text-sub transition-transform ${menuMundo ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {menuMundo && (
                    <div className="absolute left-0 top-12 z-30 w-[min(80vw,290px)] bg-surface border border-border rounded-2xl shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
                      <button onClick={() => { setMundoFiltro(null); setMenuMundo(false); }}
                        className={`w-full px-4 py-2.5 text-left text-[13px] font-bold transition ${
                          mundoFiltro === null ? "bg-accent-soft text-accent" : "hover:bg-bg"
                        }`}>
                        🌍 Todos los mundos
                      </button>
                      {cursos.map((m, i) => {
                        const abierto = (inicioDeModulo[i] ?? 0) <= completadas || TODO_DESBLOQUEADO;
                        return (
                          <button key={m.nombre} onClick={() => irAModulo(i)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition ${
                              mundoFiltro === i ? "bg-accent-soft" : "hover:bg-bg"
                            }`}>
                            <span className="shrink-0">{abierto ? "🌊" : "🔒"}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-bold text-hint uppercase tracking-wide">Mundo {i + 1}</span>
                              <span className={`block text-[13px] font-semibold truncate ${abierto ? "" : "text-hint"}`}>{m.nombre}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {vista === "bloques" ? (
                <BloquesVista cursos={cursos} completadas={completadas} hechas={hechas} retoEstados={retoEstados} inicios={inicioDeModulo} filtro={mundoFiltro} />
              ) : (
              /* Camino */
              <div className="relative mx-auto w-full overflow-x-hidden" style={{ maxWidth: 640, height: altura }}>
                <svg viewBox={`0 0 ${W} ${altura}`} className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none">
                  <path d={construirPath(pts)} stroke="#C7B8EF" strokeWidth="5.5" strokeLinecap="round" strokeDasharray="10 15" vectorEffect="non-scaling-stroke" />
                </svg>

                <DecorMar pts={pts} />

                {elementos.map((el, i) => (
                  // La isla de mundo y el trofeo son anchos: si van en el carril
                  // de la izquierda se cortan contra el borde en móvil, así que
                  // esos dos siempre van al centro.
                  <div key={i} className="absolute z-[5]"
                    style={{ left: pctX(el.tipo === "gate" || el.tipo === "hito" ? CX : pts[i].x), top: pts[i].y, transform: "translate(-50%,-50%)" }}>
                    <NodoElemento el={el} />
                  </div>
                ))}

                {/* Octi acompaña a la clase actual desde el carril opuesto, y se
                    desliza al avanzar. `pointer-events-none` en el contenedor:
                    su caja es grande (incluye el globo) y si no, se come los
                    toques de los nodos que tiene debajo. */}
                <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out pointer-events-none"
                     style={{ top: octiY, left: `clamp(88px, ${pctX(octiX)}, calc(100% - 88px))` }}>
                  <div className="pointer-events-auto">
                    <OctiRuta nombre={nombre} genero={genero} />
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* ——— Sidebar derecha ——— */}
            <aside className="space-y-4 lg:sticky lg:top-5">
              {!emailVerificado && <VerificarBanner />}

              <Tarjeta titulo="Desafíos del día" extra={<span className="text-[12px] text-accent font-semibold cursor-default">Ver todos</span>}>
                <Desafio iconSrc="/desafios/rayo.png" texto="Gana 10 EXP" progreso={0} total={10} />
                <Desafio iconSrc="/desafios/diana.png" texto="Obtén un puntaje de 90% o más en 1 lección" progreso={0} total={1} />
              </Tarjeta>

              {/* Top colaboradores + Tu ranking */}
              {topCreadores.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <h3 className="font-display font-extrabold text-[15px]">Top colaboradores</h3>
                    </div>
                    {ranking.length > 0 ? (
                      <button onClick={() => setRankingAbierto(true)} className="text-[12px] text-accent font-semibold hover:underline">Ver top</button>
                    ) : (
                      <span className="text-[12px] text-accent font-semibold cursor-default">Ver top</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {topCreadores.map((c, i) => (
                      <div key={c.id}
                        className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 ${c.esTu ? "bg-accent-soft" : ""}`}>
                        <span className="w-5 text-center text-[13px] font-extrabold text-hint shrink-0">{i + 1}</span>
                        {c.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatarUrl} alt={c.nombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold shrink-0">
                            {c.nombre.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold truncate leading-tight">{c.nombre}{c.esTu && <span className="text-accent"> · Tú</span>}</div>
                          <div className="text-[11px] text-sub leading-tight">{c.xp.toLocaleString()} XP</div>
                        </div>
                        {i < 3 && <span className={`shrink-0 text-[15px] ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-amber-700"}`}>👑</span>}
                      </div>
                    ))}
                  </div>

                  {tuRanking && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-[11px] font-bold text-hint uppercase tracking-wide mb-1.5">Tu ranking</div>
                      <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 bg-accent-soft/60">
                        <span className="w-7 text-center text-[13px] font-extrabold text-accent shrink-0">{tuRanking.pos}</span>
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="Tú" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold shrink-0">
                            {nombre.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold truncate leading-tight">{nombre} <span className="text-accent">· Tú</span></div>
                          <div className="text-[11px] text-sub leading-tight">{tuRanking.xp.toLocaleString()} XP</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

            </aside>
          </div>
        </div>
      </main>

      {mundosAbierto && <MundosModal mundos={mundos} onClose={() => setMundosAbierto(false)} />}
      {rankingAbierto && <RankingModal ranking={ranking} onClose={() => setRankingAbierto(false)} />}
      {cofreAbierto && <CofreModal xp={xp} onClose={() => setCofreAbierto(false)} />}
      {recursosAbierto && <RecursosModal recursos={recursos} onClose={() => setRecursosAbierto(false)} />}
      {rachaAbierto && rachaInfo && (
        <RachaModal info={rachaInfo} onClose={() => { setRachaAbierto(false); abrirRankingSiToca(); }} />
      )}
    </div>
  );
}

// ————— Modal de Mundos (cada módulo = una isla temática) —————
type MundoEstado = "completado" | "actual" | "bloqueado";
// Temas por mundo (de abajo hacia arriba: empiezas en el mar y avanzas al espacio).
// Cada mundo tiene su ilustración (en /public/mundos). Si falta el archivo,
// se muestra el emoji como respaldo, así el modal nunca se rompe.
const TEMAS = [
  { emoji: "🐠", img: "/mundos/mundo1-oceano.png", glow: "#38BDF8" },
  { emoji: "🏖️", img: "/mundos/mundo2-playa.png", glow: "#F59E0B" },
  { emoji: "🏜️", img: "/mundos/mundo3-desierto.png", glow: "#D98A3D" },
  { emoji: "🌴", img: "/mundos/mundo4-selva.png", glow: "#22C55E" },
  { emoji: "🏙️", img: "/mundos/mundo5-ciudad.png", glow: "#6366F1" },
  { emoji: "🚀", img: "/mundos/mundo6-espacio.png", glow: "#7C3AED" },
];

// Ilustración de una isla, con respaldo a emoji si la imagen no carga.
function Isla({ img, emoji, glow, bloqueado, resaltar }: { img: string; emoji: string; glow: string; bloqueado: boolean; resaltar: boolean }) {
  const [err, setErr] = useState(false);
  return (
    <div className={`relative grid place-items-center h-28 sm:h-32 w-full transition ${bloqueado ? "grayscale opacity-45" : ""}`}>
      {resaltar && !bloqueado && (
        <span className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: glow }} />
      )}
      {err ? (
        <span className="relative text-5xl drop-shadow-lg">{emoji}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" onError={() => setErr(true)} draggable={false}
          className="relative max-h-full w-auto object-contain drop-shadow-xl" />
      )}
    </div>
  );
}

// Botón de ícono (solo la ilustración) con respaldo a emoji si falta la imagen.
function BotonIcono({ img, emoji, label, onClick }: { img: string; emoji: string; label: string; onClick: () => void }) {
  const [err, setErr] = useState(false);
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className="w-[76px] h-[76px] rounded-2xl bg-surface border border-border shadow-sm grid place-items-center hover:border-accent/40 hover:-translate-y-0.5 active:scale-95 transition">
      {err ? (
        <span className="text-[34px]">{emoji}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={label} onError={() => setErr(true)} className="w-14 h-14 object-contain" draggable={false} />
      )}
    </button>
  );
}

function MundosModal({ mundos, onClose }: { mundos: { nombre: string; estado: MundoEstado }[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/45 grid place-items-center p-3" onClick={onClose}>
      <div className="bg-surface rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto relative shadow-2xl p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-extrabold">Tus mundos 🌍</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full hover:bg-bg text-hint" aria-label="Cerrar">✕</button>
        </div>

        {/* Serpentina vertical de islas: el Mundo 1 abajo (inicio) subiendo hacia los bloqueados. */}
        <div className="flex flex-col items-stretch gap-1">
          {mundos.map((m, idx) => ({ m, num: idx + 1 })).reverse().map(({ m, num }, pos, arr) => {
            const tema = TEMAS[(num - 1) % TEMAS.length];
            const izq = num % 2 === 0; // alterna el lado según el número de mundo
            return (
              <div key={num}>
                <div className={`flex ${izq ? "justify-start" : "justify-end"}`}>
                  <div className="flex flex-col items-center w-[72%]">
                    <Isla img={tema.img} emoji={tema.emoji} glow={tema.glow}
                      bloqueado={m.estado === "bloqueado"} resaltar={m.estado === "actual"} />
                    {/* Indicador de estado */}
                    <span className={`-mt-2 w-8 h-8 rounded-full border-4 border-white grid place-items-center text-[12px] font-extrabold shrink-0 shadow ${
                      m.estado === "completado" ? "bg-green text-white" : m.estado === "actual" ? "bg-accent text-white" : "bg-[#B9BDC7] text-white"
                    }`}>
                      {m.estado === "completado" ? "✓" : m.estado === "bloqueado" ? "🔒" : num}
                    </span>
                    <div className="mt-1 text-center">
                      <div className="text-[10px] font-bold text-hint uppercase tracking-wide">Mundo {num}</div>
                      <div className="text-[12.5px] font-semibold leading-tight">{m.nombre}</div>
                    </div>
                  </div>
                </div>
                {pos < arr.length - 1 && (
                  <div className={`h-6 flex ${izq ? "justify-start pl-[36%]" : "justify-end pr-[36%]"}`}>
                    <div className="w-0.5 h-full border-l-2 border-dashed border-accent/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ————— Nodo según tipo/estado (la leyenda) —————

// Tarjeta que aparece al pasar el mouse por una clase. `group-hover` la muestra
// sin JS y `pointer-events-none` evita que tape el clic del nodo.
function TipClase({ titulo, accion, href, bloqueada, pendiente }: {
  titulo: string; accion?: string; href?: string; bloqueada?: boolean; pendiente?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[86px] z-30
                    opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
                    transition duration-150 w-[186px]">
      <div className="bg-surface rounded-2xl shadow-xl border border-border px-4 py-3 text-center">
        <p className={`font-display font-extrabold text-[13.5px] leading-tight ${bloqueada || pendiente ? "text-hint" : "text-accent"}`}>
          {titulo}
        </p>
        {pendiente ? (
          <p className="text-[11.5px] text-hint mt-1.5">⏳ Pendiente · aún sin grabación</p>
        ) : bloqueada ? (
          <p className="text-[11.5px] text-hint mt-1.5">🔒 Termina la clase anterior</p>
        ) : accion && href ? (
          <span className="mt-2.5 flex items-center justify-center gap-2 bg-accent text-white rounded-xl py-2 text-[13px] font-bold">
            {accion} <span className="w-5 h-5 rounded-full bg-white/25 grid place-items-center text-[9px]">▶</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

// Píldora de estado del reto, también al pasar el mouse.
function TipReto({ texto, clase }: { texto: string; clase: string }) {
  return (
    <div className={`pointer-events-none absolute left-[76px] top-1/2 -translate-y-1/2 z-30 whitespace-nowrap
                     rounded-full px-4 py-2 text-[13px] font-bold shadow-lg
                     opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                     transition duration-150 ${clase}`}>
      {texto}
    </div>
  );
}

function NodoElemento({ el }: { el: Elemento }) {
  if (el.tipo === "clase") {
    // Sin video cargado no hay nada que ver: se marca Pendiente y no abre.
    if (!el.clase.grabada && el.estado !== "completada") {
      return (
        <div className="group relative">
          <div className="grid place-items-center rounded-full w-[80px] h-[80px] bg-[#E9EBEF] text-[#AEB4BF] border-[5px] border-white"
            style={{ boxShadow: "0 7px 0 #D8DCE3, 0 12px 14px rgba(0,0,0,.08)" }}>
            <PlayIcon />
          </div>
          <TipClase titulo={el.clase.titulo} pendiente />
        </div>
      );
    }
    if (el.estado === "completada")
      return (
        <Link href={`/app/clase/${el.clase.id}`} className="group relative block hover:scale-105 transition-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nodo-completado.png" alt="" className="w-[84px] h-[84px] select-none" draggable={false} />
          <TipClase titulo={el.clase.titulo} accion="Repasar" href={`/app/clase/${el.clase.id}`} />
        </Link>
      );
    if (el.estado === "actual")
      return (
        <div className="relative">
          {/* Indicador "toca aquí": deja claro dónde debe picar la persona */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-10 pointer-events-none">
            <span className="ruta-toca inline-block whitespace-nowrap bg-accent text-white text-[10.5px] font-extrabold rounded-full px-2.5 py-1 shadow-lg">
              👇 ¡Toca aquí!
            </span>
          </div>
          <Link href={`/app/clase/${el.clase.id}`}
            className="ruta-pulse group relative block rounded-full hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nodo-actual.png" alt="" className="w-[88px] h-[88px] select-none" draggable={false} />
            <TipClase titulo={el.clase.titulo} accion="Ver" href={`/app/clase/${el.clase.id}`} />
          </Link>
        </div>
      );
    // bloqueada
    return (
      <div className="group relative">
        <div className="grid place-items-center rounded-full w-[80px] h-[80px] bg-[#B9BDC7] text-white border-[5px] border-white"
          style={{ boxShadow: "0 7px 0 #9AA0AD, 0 12px 14px rgba(0,0,0,.1)" }}>
          <PlayIcon />
        </div>
        <TipClase titulo={el.clase.titulo} bloqueada />
      </div>
    );
  }

  if (el.tipo === "reto") {
    const base = "grid place-items-center rounded-full w-[64px] h-[64px] bg-white border-[5px] border-white";
    const sombraOk = "0 5px 0 #EADFbf, 0 8px 12px rgba(0,0,0,.08)";
    const sombraGris = "0 5px 0 #E7E4EC, 0 8px 12px rgba(0,0,0,.08)";

    if (el.estado === "completada")
      return (
        <div className="group relative">
          <div className={base} style={{ boxShadow: sombraOk }}><SparkleIcon color="#F5B301" /></div>
          <TipReto texto="¡Reto completado!" clase="bg-amber text-white" />
        </div>
      );
    if (el.estado === "en-revision")
      return (
        <div className="group relative">
          <div className="absolute -top-16 -right-3"><Burbujas /></div>
          <div className={base} style={{ boxShadow: sombraGris }}><SparkleIcon color="#9AA0AD" /></div>
          <TipReto texto="En revisión" clase="bg-accent-soft text-accent" />
        </div>
      );
    if (el.estado === "rechazada")
      return (
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nodo-rechazado.png" alt="" className="w-[68px] h-[68px] select-none" draggable={false} />
          <TipReto texto="Reto rechazado" clase="bg-pink text-white" />
        </div>
      );
    if (el.estado === "pendiente")
      return (
        <div className="group relative">
          <div className={base} style={{ boxShadow: sombraGris }}><SparkleIcon color="#9AA0AD" /></div>
          <div className="absolute -top-16 -right-3"><Burbujas /></div>
          <TipReto texto="¡Completa este reto!" clase="bg-surface text-accent border border-border" />
        </div>
      );
    return (
      <div className="group relative">
        <div className={base} style={{ boxShadow: sombraGris }}><SparkleIcon color="#C6CAD3" /></div>
        <TipReto texto="🔒 Bloqueado" clase="bg-bg text-hint border border-border" />
      </div>
    );
  }

  if (el.tipo === "hito") {
    return <TrofeoBurbuja apagado={el.estado === "bloqueada"} />;
  }

  // gate
  return <HieloNivel bloqueado={el.estado === "bloqueada"} />;
}

// Nodo de reto en chico para la vista Bloques — mismos colores y sombra 3D que el mapa.
function NodoRetoMini({ estado }: { estado: EReto }) {
  const base = "grid place-items-center rounded-full w-11 h-11 bg-white border-[4px] border-white shrink-0";
  const sombraOk = "0 4px 0 #EADFbf, 0 6px 10px rgba(0,0,0,.08)";
  const sombraGris = "0 4px 0 #E7E4EC, 0 6px 10px rgba(0,0,0,.08)";

  if (estado === "rechazada")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/nodo-rechazado.png" alt="" className="w-12 h-12 shrink-0 select-none" draggable={false} />;
  if (estado === "completada")
    return <div className={base} style={{ boxShadow: sombraOk }}><SparkleIcon color="#F5B301" /></div>;
  if (estado === "bloqueada")
    // Candado gris (no estrella): es el mismo nodo bloqueado del mapa.
    return (
      <div className="grid place-items-center rounded-full w-11 h-11 bg-[#E9EBEF] border-[4px] border-white shrink-0"
        style={{ boxShadow: sombraGris }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#AEB4BF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
    );
  return <div className={base} style={{ boxShadow: sombraGris }}><SparkleIcon color="#9AA0AD" /></div>;
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
    <img src="/trofeo.png" alt="Hito de nivel" width={124} height={124}
      className={`select-none ${apagado ? "opacity-45 grayscale" : ""}`} draggable={false} />
  );
}

function HieloNivel({ bloqueado }: { bloqueado?: boolean }) {
  // Isla = frontera de "mundo"/nivel (réplica del asset gris con palmeras).
  return (
    <div className="relative grid place-items-center">
      <IslaMundoSvg apagado={bloqueado} />
      {bloqueado && (
        <>
          <span className="absolute top-[38%] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white/90 grid place-items-center shadow-md"><LockIcon /></span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-bold rounded-lg px-3 py-1 shadow whitespace-nowrap">Siguiente mundo</span>
        </>
      )}
    </div>
  );
}

// Isla con palmeras (réplica en SVG del asset gris). Más grande en desktop.
function IslaMundoSvg({ apagado }: { apagado?: boolean }) {
  return (
    <svg viewBox="0 0 220 180" className={`w-44 sm:w-52 select-none ${apagado ? "opacity-90" : ""}`} fill="none">
      <defs>
        <linearGradient id="islaHumo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A7A7AF" />
          <stop offset="1" stopColor="#6C6C76" />
        </linearGradient>
        <linearGradient id="islaPalma" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B7B7BE" />
          <stop offset="1" stopColor="#7C7C86" />
        </linearGradient>
        <linearGradient id="islaTronco" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A2A2AA" />
          <stop offset="1" stopColor="#75757E" />
        </linearGradient>
      </defs>
      {/* Sombra / arena rosada */}
      <ellipse cx="110" cy="158" rx="98" ry="16" fill="#EAD9D9" opacity="0.85" />
      <ellipse cx="150" cy="150" rx="40" ry="9" fill="#EAD9D9" opacity="0.7" />
      {/* Troncos (curvos) */}
      <path d="M104 148 C98 110 92 80 96 46" stroke="url(#islaTronco)" strokeWidth="10" strokeLinecap="round" />
      <path d="M138 150 C142 120 148 100 150 78" stroke="url(#islaTronco)" strokeWidth="9" strokeLinecap="round" />
      {/* Palmera 1 (grande, izq) */}
      <g fill="url(#islaPalma)">
        <path d="M96 46 C74 30 52 30 40 40 C60 40 78 44 96 52 Z" />
        <path d="M96 46 C118 28 142 30 156 42 C134 40 114 44 96 52 Z" />
        <path d="M96 48 C80 24 60 16 44 18 C64 26 82 38 96 54 Z" />
        <path d="M96 48 C112 22 134 14 150 18 C130 26 112 38 96 54 Z" />
        <path d="M96 50 C92 30 92 18 98 8 C104 22 104 40 100 54 Z" />
      </g>
      {/* Palmera 2 (mediana, der) */}
      <g fill="url(#islaPalma)">
        <path d="M150 78 C132 66 114 66 104 74 C122 74 138 78 152 84 Z" />
        <path d="M150 78 C168 64 188 66 200 76 C182 74 164 78 152 84 Z" />
        <path d="M150 80 C138 60 122 54 108 56 C126 62 142 72 152 86 Z" />
        <path d="M150 80 C164 58 184 52 198 56 C178 62 162 72 152 86 Z" />
        <path d="M150 82 C148 64 150 52 156 44 C160 58 158 74 154 86 Z" />
      </g>
      {/* Humos (montículos) */}
      <path d="M20 150 C20 118 44 100 70 100 C96 100 116 118 116 150 Z" fill="url(#islaHumo)" />
      <path d="M120 150 C120 122 140 106 162 106 C186 106 204 124 204 150 Z" fill="url(#islaHumo)" />
      <path d="M62 152 C62 116 90 94 118 94 C148 94 172 116 172 152 Z" fill="url(#islaHumo)" />
    </svg>
  );
}

function AlgaRoja() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/alga-roja.png" alt="" width={140} height={212} className="select-none w-28 sm:w-36" draggable={false} />;
}
function CoralTurquesa() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/coral-turquesa.png" alt="" width={124} height={102} className="select-none w-24 sm:w-32" draggable={false} />;
}
function Burbujas() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/burbujas.png" alt="" width={64} height={54} className="select-none burbujas-anim" draggable={false} />
  );
}
function DecorMar({ pts }: { pts: { x: number; y: number }[] }) {
  // Las filas CENTRALES (índices impares = retos) tienen el nodo al centro, así
  // las ORILLAS quedan libres. Ahí van las decoraciones, alternando lado y
  // espaciadas (cada 2 filas centrales) para que nunca choquen entre sí ni con nodos.
  const decos: React.ReactNode[] = [];
  let d = 0;
  for (let i = 1; i < pts.length; i += 4) {
    const izq = d % 2 === 0;
    const tipo = d % 3; // 0 alga · 1 coral · 2 burbujas
    decos.push(
      <div key={i} className="absolute"
        style={{ [izq ? "left" : "right"]: 2, top: pts[i].y, transform: "translateY(-50%)" }}>
        <div className="mar-vaiven" style={{ animationDelay: `${(d % 4) * 0.4}s` }}>
          {tipo === 0 ? <AlgaRoja /> : tipo === 1 ? <CoralTurquesa /> : <Burbujas />}
        </div>
      </div>
    );
    d++;
  }
  return <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">{decos}</div>;
}

function OctiRuta({ nombre, genero }: { nombre: string; genero: Genero }) {
  const MENSAJES = octiFrases(genero, nombre).animo;
  const [i, setI] = useState(0);
  const [wiggle, setWiggle] = useState(false);

  // Los mensajes se van rotando solos (más "vivo").
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % MENSAJES.length), 4500);
    return () => clearInterval(t);
  }, [MENSAJES.length]);

  return (
    <button
      onClick={() => { setI((n) => (n + 1) % MENSAJES.length); setWiggle(true); setTimeout(() => setWiggle(false), 650); }}
      className="flex flex-col items-center text-center hover:scale-[1.03] active:scale-95 transition"
      title="Tócame 🐙"
    >
      {/* Burbuja ARRIBA de Octi (compacta, no tapa los nodos) */}
      <div key={i} className="octi-fade relative bg-white rounded-2xl shadow-lg flex items-center gap-1.5 px-3 py-2 mb-1 w-max max-w-[150px] sm:max-w-[200px] z-10">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-soft grid place-items-center text-[11px] sm:text-[13px] shrink-0">⭐</span>
        <span className="text-[11px] sm:text-[13px] font-bold text-[#3C1A6B] leading-snug">{MENSAJES[i]}</span>
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/octi.png" alt="Octi" className={`octi-float select-none shrink-0 w-24 sm:w-32 lg:w-44 drop-shadow-lg ${wiggle ? "octi-wiggle" : ""}`} draggable={false} />
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
function Desafio({ iconSrc, texto, progreso, total }: { iconSrc: string; texto: string; progreso: number; total: number }) {
  const pct = Math.min(100, (progreso / total) * 100);
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="" className="w-9 h-9 object-contain shrink-0" draggable={false} />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold text-text leading-tight">{texto}</div>
        <div className="relative mt-1.5 h-5 rounded-full bg-bg overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-amber/70 rounded-full" style={{ width: `${pct}%` }} />
          <span className="absolute inset-0 grid place-items-center text-[10.5px] font-semibold text-sub">{progreso} / {total}</span>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/desafios/cofre.png" alt="" className="w-9 h-9 object-contain shrink-0" draggable={false} />
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


// ————— Vista BLOQUES: la misma ruta en cuadrícula, sin scroll infinito —————
// Cada clase es una tarjeta con su estado, y debajo el reto que le corresponde.
function OjoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BloquesVista({
  cursos, completadas, hechas, retoEstados, inicios, filtro,
}: {
  cursos: ModuloCurso[];
  completadas: number;
  hechas: Set<string>;
  retoEstados: Record<string, EReto>;
  inicios: number[];
  filtro: number | null;   // null = todos los mundos
}) {
  const RETO_LABEL: Record<EReto, string> = {
    completada: "¡Reto completado!",
    "en-revision": "En revisión",
    rechazada: "Reto rechazado",
    pendiente: "¡Completa este reto!",
    bloqueada: "Bloqueado",
  };
  const RETO_PILL: Record<EReto, string> = {
    completada: "bg-amber text-white",
    "en-revision": "bg-accent-soft text-accent",
    rechazada: "bg-pink text-white",
    pendiente: "bg-surface text-accent border border-border",
    bloqueada: "bg-bg text-hint border border-border",
  };

  return (
    <div className="space-y-8">
      {cursos.map((m, mi) => {
        if (filtro !== null && filtro !== mi) return null;
        const base = inicios[mi] ?? 0;
        const moduloAbierto = base <= completadas || TODO_DESBLOQUEADO;
        return (
          <section key={m.nombre}>
            <div className="flex items-center gap-2 mb-3">
              <span>{moduloAbierto ? "🌊" : "🔒"}</span>
              <h3 className={`font-display font-extrabold ${moduloAbierto ? "" : "text-hint"}`}>
                Módulo {mi + 1}: {m.nombre}
              </h3>
              {m.nivel && (
                <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-0.5">
                  {m.nivel.replace(/^Nivel \d+:\s*/, "")}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(() => { let seq = 0; return m.clases.map((c) => {
                // Solo las grabadas avanzan el contador de la secuencia.
                const gi = base + (c.proximamente ? -1 : seq++);
                const hecha = hechas.has(c.id);
                const abierta = !c.proximamente && c.grabada && (hecha || gi <= completadas || TODO_DESBLOQUEADO);
                const er: EReto = retoEstados[c.id] ?? (abierta ? "pendiente" : "bloqueada");

                const tarjeta = (
                  <>
                    <div className="relative aspect-square rounded-xl overflow-hidden"
                      style={{ background: "linear-gradient(150deg,#7C3AED,#4F46E5 60%,#2563EB)" }}>
                      {c.portada ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.portada} alt="" className={`absolute inset-0 w-full h-full object-cover ${abierta ? "" : "grayscale opacity-55"}`} />
                      ) : (
                        // Sin portada: solo el degradado con el número de clase (el título va debajo).
                        <span className={`absolute inset-0 grid place-items-center font-display text-4xl font-extrabold ${abierta ? "text-white/35" : "text-white/20"}`}>
                          {gi + 1}
                        </span>
                      )}
                      {!abierta && (
                        <span className="absolute inset-0 grid place-items-center">
                          <span className="w-12 h-12 rounded-2xl bg-white/95 grid place-items-center shadow-md text-xl">
                            {c.proximamente || !c.grabada ? "⏳" : <LockIcon />}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className={`font-bold text-[13.5px] leading-tight mt-2.5 line-clamp-2 min-h-[2.2rem] ${abierta ? "" : "text-hint"}`}>
                      {c.titulo}
                    </p>
                    <span className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                      c.proximamente ? "bg-amber/15 text-amber"
                        : hecha ? "bg-green/15 text-green"
                        : !c.grabada ? "bg-bg text-hint border border-border"
                        : abierta ? "bg-accent-soft text-accent"
                        : "bg-bg text-hint border border-border"
                    }`}>
                      {c.proximamente ? "Próximamente"
                        : hecha ? "Completado"
                        : !c.grabada ? "Pendiente"
                        : abierta ? "Disponible" : "Bloqueado"}
                    </span>
                  </>
                );

                // El reto va DEBAJO de la tarjeta, con el mismo nodo del mapa Camino.
                const filaReto = (
                  <div className="flex items-center gap-2.5 mt-3 px-1">
                    <NodoRetoMini estado={er} />
                    <div className="min-w-0 flex-1">
                      {er === "bloqueada" ? (
                        <span className="text-[12.5px] font-bold text-hint">Bloqueado</span>
                      ) : (
                        <>
                          <p className="text-[12.5px] font-bold leading-tight line-clamp-2 min-h-[2rem]">{c.reto || "Reto de la clase"}</p>
                          <span className={`inline-block mt-1 text-[10.5px] font-bold rounded-full px-2 py-0.5 ${RETO_PILL[er]}`}>
                            {RETO_LABEL[er]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={c.id} className="flex flex-col">
                    {abierta ? (
                      <Link href={`/app/clase/${c.id}`}
                        className="flex flex-col bg-surface border border-border rounded-2xl p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                        {tarjeta}
                      </Link>
                    ) : (
                      <div className="flex flex-col bg-surface border border-border rounded-2xl p-3 shadow-sm opacity-70 cursor-not-allowed">
                        {tarjeta}
                      </div>
                    )}
                    {c.proximamente ? null : er === "bloqueada" ? filaReto : (
                      <Link href={`/app/reto/${c.id}`} className="group">{filaReto}</Link>
                    )}
                  </div>
                );
              }); })()}
            </div>
          </section>
        );
      })}
    </div>
  );
}
