"use client";

import type { RachaInfo } from "@/lib/racha-actions";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Pop-up de racha que aparece 1 vez al día (check-in "cada nuevo día").
export function RachaModal({ info, onClose }: { info: RachaInfo; onClose: () => void }) {
  const { racha, semana } = info;
  return (
    <div className="fixed inset-0 z-[85] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-2xl my-4 onb-slide overflow-hidden">
        {/* Cabecera */}
        <div className="text-center pt-6 px-6">
          <h2 className="font-display text-xl font-extrabold">Mi racha</h2>
          <p className="text-sub text-[13px] mt-0.5">La constancia te hace imparable</p>
        </div>

        {/* Octi + número */}
        <div className="flex items-center justify-center gap-4 px-6 pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi.png" alt="Octi" className="octi-float w-28 sm:w-32 drop-shadow-lg" draggable={false} />
          <div className="text-center">
            <div className="font-display text-[64px] leading-none font-extrabold text-accent">{racha}</div>
            <div className="font-display text-lg font-extrabold">{racha === 1 ? "día" : "días"} de racha 🔥</div>
          </div>
        </div>
        <p className="text-center text-[13px] text-sub px-8 mt-2">
          {racha === 0 ? "¡Empieza hoy! Completa una clase o reto." : "¡Sigue así! Octi y tu equipo están orgullosos de ti."}
        </p>

        {/* Semana */}
        <div className="mx-6 mt-5 rounded-2xl border border-border bg-bg p-3">
          <div className="grid grid-cols-7 gap-1.5">
            {DIAS.map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span className="text-[10.5px] font-bold text-sub">{d}</span>
                <span className={`w-8 h-8 rounded-full grid place-items-center text-[13px] font-bold ${
                  semana[i] ? "bg-accent text-white" : "bg-border/60 text-hint"
                }`}>{semana[i] ? "✓" : ""}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Aviso de reinicio */}
        <div className="mx-6 mt-3 flex items-start gap-3 rounded-2xl bg-accent-soft/50 border border-accent/20 p-3">
          <span className="w-8 h-8 rounded-full bg-accent/15 grid place-items-center text-accent shrink-0">⭐</span>
          <p className="text-[12.5px] text-sub leading-snug">
            Tu racha se reiniciará si no completas una actividad <b className="text-accent">mañana</b>. ¡No la pierdas! 💪
          </p>
        </div>

        {/* Botón */}
        <div className="p-6 pt-5">
          <button onClick={onClose}
            className="w-full rounded-2xl bg-accent text-white font-bold py-3.5 text-[15px] shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition">
            Continuar aprendiendo 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
