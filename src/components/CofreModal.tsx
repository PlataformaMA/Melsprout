"use client";

import { useState } from "react";

// Ícono del cofre con respaldo a emoji si aún no se sube la imagen.
function CofreIcono() {
  const [err, setErr] = useState(false);
  if (err) return <span className="text-3xl">🧰</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/cofre.png" alt="Cofre" onError={() => setErr(true)} className="w-11 h-11 object-contain" />;
}

// Niveles de recompensa del cofre (por XP acumulado). img = ilustración 3D real.
const COFRES = [
  { xp: 500, emoji: "🗓️", img: "/recompensas/r500.png", tipo: "Plantilla", titulo: "Calendario de contenido" },
  { xp: 1800, emoji: "📘", img: "/recompensas/r1800.png", tipo: "Ebook", titulo: "Guía de contenido viral" },
  { xp: 3500, emoji: "📗", img: "/recompensas/r3500.png", tipo: "Guía", titulo: "Estrategias de crecimiento en redes" },
  { xp: 5000, emoji: "🧰", img: null, tipo: "Pack", titulo: "Pack de plantillas para Instagram" },
  { xp: 7000, emoji: "📹", img: null, tipo: "Ebook", titulo: "Edición de videos para redes sociales" },
  { xp: 10000, emoji: "🏆", img: "/recompensas/r10000.png", tipo: "Mega cofre", titulo: "¡Sorpresa especial!" },
];

// Imagen 3D de la recompensa con respaldo a emoji si aún no hay archivo.
function RecompensaImg({ img, emoji }: { img: string | null; emoji: string }) {
  const [err, setErr] = useState(false);
  if (!img || err) return <span className="text-3xl">{emoji}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={img} alt="" onError={() => setErr(true)} className="w-full h-full object-contain" draggable={false} />;
}

// Modal "El cofre de recompensas": muestra los niveles y cuáles desbloqueaste.
export function CofreModal({ xp, onClose }: { xp: number; onClose: () => void }) {
  const siguiente = COFRES.find((c) => c.xp > xp);
  const faltan = siguiente ? siguiente.xp - xp : 0;
  const pct = siguiente ? Math.min(100, Math.round((xp / siguiente.xp) * 100)) : 100;

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl my-4 onb-slide">
        {/* Cabecera */}
        <div className="flex items-start gap-3 p-5 sm:p-6 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-soft grid place-items-center shrink-0"><CofreIcono /></div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-extrabold text-lg sm:text-xl leading-tight">El cofre de recompensas</h2>
            <p className="text-sub text-[13px] mt-0.5">Aprende, gana XP y desbloquea increíbles premios ✨</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition shrink-0">✕</button>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 max-h-[75vh] overflow-y-auto">
          {/* Barra de progreso hacia el próximo cofre */}
          <div className="rounded-2xl bg-bg border border-border p-4 mb-6">
            <div className="flex items-center justify-between gap-3 text-[12.5px] mb-2">
              <div><span className="text-sub">Tu XP actual</span> <span className="font-extrabold text-accent">★ {xp.toLocaleString()} XP</span></div>
              {siguiente && <div className="text-right"><span className="text-sub">Próximo cofre</span> <span className="font-bold text-text">★ {siguiente.xp.toLocaleString()} XP</span></div>}
            </div>
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[12px] text-sub mt-1.5 text-right">
              {siguiente ? `${faltan.toLocaleString()} XP para el siguiente cofre` : "¡Desbloqueaste todos los cofres! 🎉"}
            </p>
          </div>

          {/* Serpentina de recompensas */}
          <div className="flex flex-col items-stretch gap-1">
            {COFRES.map((c, i) => {
              const desbloqueado = xp >= c.xp;
              const izq = i % 2 === 0;
              return (
                <div key={c.xp}>
                  <div className={`flex ${izq ? "justify-start" : "justify-end"}`}>
                    <div className={`flex items-center gap-3 w-[86%] sm:w-[70%] rounded-2xl border p-3 ${
                      desbloqueado ? "border-green/40 bg-green/5" : "border-border bg-bg"
                    }`}>
                      {/* Ícono con estado */}
                      <div className="relative shrink-0">
                        <div className={`w-16 h-16 rounded-2xl grid place-items-center p-1.5 ${desbloqueado ? "bg-accent-soft" : "bg-surface grayscale opacity-70"}`}>
                          <RecompensaImg img={c.img} emoji={c.emoji} />
                        </div>
                        <span className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-white grid place-items-center text-[11px] shadow ${
                          desbloqueado ? "bg-green text-white" : "bg-[#B9BDC7] text-white"
                        }`}>{desbloqueado ? "✓" : "🔒"}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[14px]">{c.xp.toLocaleString()} XP</div>
                        <div className="text-[12.5px] text-sub leading-tight">{c.tipo} · {c.titulo}</div>
                        <span className={`inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                          desbloqueado ? "bg-green/15 text-green" : "bg-accent-soft text-accent"
                        }`}>{desbloqueado ? "Desbloqueado" : "Bloqueado"}</span>
                      </div>
                    </div>
                  </div>
                  {i < COFRES.length - 1 && (
                    <div className={`h-5 flex ${izq ? "justify-start pl-[20%]" : "justify-end pr-[20%]"}`}>
                      <div className="w-0.5 h-full border-l-2 border-dashed border-accent/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
