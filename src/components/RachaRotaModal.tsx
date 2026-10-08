"use client";

import { useState, useTransition } from "react";
import { rescatarRacha } from "@/lib/racha-actions";

// Se terminó la racha… pero todavía no del todo.
//
// Aparece cuando alguien llevaba 2 días o más y dejó de entrar. Durante los 3
// días siguientes se le ofrece recuperarla en vez de ponerla en cero: es la
// diferencia entre "ya la perdí, para qué vuelvo" y volver hoy mismo.
//
// El rescate no regala un día: deja la cadena viva, pero para que siga creciendo
// tiene que completar algo hoy (ver rescatarRacha).
export function RachaRotaModal({ racha, onClose }: { racha: number; onClose: () => void }) {
  const [listo, setListo] = useState(false);
  const [guardando, empezar] = useTransition();

  function recuperar() {
    empezar(async () => {
      const r = await rescatarRacha();
      if (r.ok) setListo(true);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-surface rounded-[28px] shadow-2xl my-4 onb-slide p-6 sm:p-8 text-center">
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listo ? "/octi.png" : "/octi-racha-rota.png"} alt=""
          className="mx-auto w-[220px] sm:w-[260px] select-none" draggable={false} />

        {listo ? (
          <>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[30px] leading-tight mt-2">
              Recuperaste tu <span className="text-accent">racha</span>
            </h2>
            <p className="text-sub text-[14.5px] leading-snug mt-2.5">
              Vuelves con {racha} días 🔥. Completa una clase o un reto hoy para que siga creciendo.
            </p>
            <button type="button" onClick={onClose}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-full bg-accent text-white font-bold text-[16px] py-4 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition">
              Seguir aprendiendo <span aria-hidden>→</span>
            </button>
          </>
        ) : (
          <>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[30px] leading-tight mt-2">
              Se terminó tu <span className="text-accent">racha</span>
            </h2>
            <p className="text-sub text-[14.5px] leading-snug mt-2.5">
              Llevabas {racha} días seguidos. No te preocupes: todavía estás a tiempo
              de recuperarla y seguir desde ahí.
            </p>
            <button type="button" onClick={recuperar} disabled={guardando}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-full bg-accent text-white font-bold text-[16px] py-4 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition disabled:opacity-60">
              {guardando ? "Recuperando…" : <>Recuperar mi racha <span aria-hidden>→</span></>}
            </button>
            <button type="button" onClick={onClose}
              className="w-full mt-2 text-[13px] font-bold text-hint py-2 hover:text-sub transition">
              Empezar de cero
            </button>
          </>
        )}
      </div>
    </div>
  );
}
