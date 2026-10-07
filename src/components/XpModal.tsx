"use client";

import { nivelPorXP } from "@/lib/data";

// Qué es el XP y cómo se gana. Se abre al tocar el contador del 💎.
//
// Los montos de aquí son los que de verdad otorga la plataforma (ver
// progreso-actions, retos-actions, vivo-actions, foros-actions y
// referidos-actions): si alguno cambia allá, hay que cambiarlo aquí.
const FORMAS: { que: string; xp: string; detalle: string }[] = [
  { que: "Terminar una clase", xp: "+100 XP", detalle: "Una vez por clase, al llegar al final del video." },
  { que: "Entregar un reto", xp: "+50 XP", detalle: "Al publicarlo, no al guardarlo como borrador." },
  { que: "Asistir a una clase en vivo", xp: "+50 XP", detalle: "Estando dentro mientras ocurre." },
  { que: "Publicar en la comunidad", xp: "+10 XP", detalle: "Por cada publicación tuya." },
  { que: "Participar en un reto de comunidad", xp: "según el reto", detalle: "Cada día que publicas tu avance." },
  { que: "Invitar a alguien que se registre", xp: "+100 XP", detalle: "Cuando entra con tu invitación." },
];

export function XpModal({ xp, onClose }: { xp: number; onClose: () => void }) {
  const nivel = nivelPorXP(xp);
  const pct = nivel.siguiente
    ? Math.min(100, Math.max(4, Math.round(((xp - nivel.actual.xp) / (nivel.siguiente.xp - nivel.actual.xp)) * 100)))
    : 100;

  return (
    <div className="fixed inset-0 z-[120] bg-black/55 grid place-items-center p-4 overflow-y-auto"
      role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-surface rounded-3xl w-full max-w-[400px] my-auto max-h-[94vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-4 text-center">
          <span className="inline-block bg-accent-soft text-accent text-[12px] font-bold rounded-full px-3 py-1">
            ⭐ Nivel {nivel.actual.nivel} · {nivel.actual.nombre}
          </span>

          <div className="flex items-center justify-center gap-2.5 mt-4">
            <span className="text-3xl">💎</span>
            <div className="text-left">
              <div className="text-[13px] font-bold text-sub leading-none">Tus XP</div>
              <div className="font-display text-[34px] font-extrabold text-accent leading-tight">
                {xp.toLocaleString("es-MX")}
              </div>
            </div>
          </div>
          <p className="text-[12px] text-sub -mt-1">puntos de experiencia</p>

          <div className="h-2.5 rounded-full bg-bg border border-accent/10 overflow-hidden mt-4">
            <div className="h-full rounded-full bg-gradient-to-r from-[#A78BFA] to-accent transition-all duration-700"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[12.5px] text-sub mt-2">
            {nivel.siguiente
              ? <>Te faltan <b className="text-accent">{nivel.faltan.toLocaleString("es-MX")} XP</b> para <b className="text-text">{nivel.siguiente.nombre}</b>.</>
              : <>Llegaste al nivel más alto. ¡Increíble! 🎉</>}
          </p>
        </div>

        <div className="px-5 pb-5">
          <h3 className="font-display font-extrabold text-[15px]">¿Cómo conseguir más XP?</h3>
          <p className="text-[12px] text-sub mt-0.5 mb-3">Cada una de estas acciones te suma puntos.</p>

          <ul className="space-y-2">
            {FORMAS.map((f) => (
              <li key={f.que} className="flex items-start gap-3 bg-bg rounded-2xl px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold leading-tight">{f.que}</div>
                  <div className="text-[11.5px] text-sub leading-snug mt-0.5">{f.detalle}</div>
                </div>
                <span className="text-[12.5px] font-extrabold text-accent whitespace-nowrap shrink-0">{f.xp}</span>
              </li>
            ))}
          </ul>

          <button type="button" onClick={onClose}
            className="w-full mt-4 bg-accent text-white font-bold text-[14px] rounded-full py-3 hover:brightness-110 transition">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
