"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RachaInfo } from "@/lib/racha-actions";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function RachaVista({ info }: { info: RachaInfo }) {
  const router = useRouter();
  const { racha, semana } = info;

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto px-5 py-6">
        {/* Barra superior */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} aria-label="Atrás"
            className="w-10 h-10 rounded-full bg-surface border border-border grid place-items-center text-accent hover:bg-bg transition">‹</button>
          <div className="flex-1 text-center pr-10">
            <h1 className="font-display text-xl font-extrabold">Mi racha</h1>
            <p className="text-[12px] text-sub">La constancia te hace imparable</p>
          </div>
        </div>

        {/* Octi + número */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi.png" alt="Octi" className="w-32 shrink-0 drop-shadow-lg" draggable={false} />
          <div className="text-center">
            <div className="font-display text-[64px] leading-none font-extrabold text-accent">{racha}</div>
          </div>
        </div>
        <div className="text-center mt-2">
          <div className="font-display text-xl font-extrabold">{racha === 1 ? "día" : "días"} de racha 🔥</div>
          <p className="text-[13px] text-sub mt-1">
            {racha === 0 ? "¡Empieza hoy! Completa una clase o reto." : "¡Sigue así, Octi y tu equipo están orgullosos de ti!"}
          </p>
        </div>

        {/* Calendario semanal */}
        <div className="mt-6 bg-surface border border-border rounded-2xl p-3 grid grid-cols-7 gap-1.5">
          {DIAS.map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold text-sub">{d}</span>
              <span className={`w-8 h-8 rounded-full grid place-items-center text-[13px] ${
                semana[i] ? "bg-accent text-white" : "bg-bg border border-border text-hint"
              }`}>
                {semana[i] ? "✓" : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Aviso */}
        <div className="mt-4 flex items-start gap-3 bg-accent-soft/50 border border-accent/15 rounded-2xl p-3.5">
          <span className="text-xl shrink-0">⭐</span>
          <p className="text-[13px] text-sub leading-snug">
            Tu racha se reiniciará si no completas una actividad <b className="text-accent">mañana</b>. ¡No la pierdas! 💜
          </p>
        </div>

        {/* Beneficios por racha */}
        <div className="mt-6">
          <h3 className="font-display font-extrabold text-[15px] mb-3">Beneficios por racha</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { dias: 3, xp: 10, on: racha >= 3 },
              { dias: 7, xp: 30, on: racha >= 7 },
              { dias: 30, xp: 150, on: racha >= 30 },
            ].map((b) => (
              <div key={b.dias} className={`rounded-2xl border p-3 text-center ${b.on ? "border-accent bg-accent-soft/50" : "border-border bg-surface opacity-80"}`}>
                <div className="text-2xl">🔥</div>
                <div className="font-display font-extrabold text-[13px] mt-1">{b.dias} días</div>
                <div className="text-[11px] font-bold text-accent">+{b.xp} XP</div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/app/ruta"
          className="mt-7 flex items-center justify-center gap-2 w-full bg-accent text-white font-bold rounded-2xl py-3.5 text-[14px] shadow-lg shadow-accent/25 hover:brightness-110 transition">
          Continuar aprendiendo 🚀
        </Link>
      </div>
    </main>
  );
}
