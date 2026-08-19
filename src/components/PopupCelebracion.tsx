"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Base = {
  titulo: string;
  lineas: string[];
  primaryLabel: string;
  primaryHref?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  progreso?: { actual: number; total: number };
  onClose: () => void;
};

// Modal de celebración con Octi (bienvenida, módulo desbloqueado, clase, etc.).
export function PopupCelebracion({ titulo, lineas, primaryLabel, primaryHref, onPrimary, secondaryLabel, progreso, onClose }: Base) {
  const pct = progreso ? Math.min(100, Math.round((progreso.actual / progreso.total) * 100)) : 0;
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl popup-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/octi.png" alt="Octi" width={120} height={120} className="mx-auto popup-bob" />
        <h3 className="font-display text-2xl font-extrabold mt-2">{titulo}</h3>
        <div className="mt-2 space-y-0.5">
          {lineas.map((l, i) => (
            <p key={i} className={i === 0 ? "text-accent font-bold text-[15px]" : "text-sub text-[14px]"}>{l}</p>
          ))}
        </div>

        {/* Barra de progreso Octi → trofeo */}
        {progreso && (
          <div className="mt-5 flex items-center gap-2">
            <span className="text-[12px] font-extrabold text-accent shrink-0">{progreso.actual}/{progreso.total}</span>
            <div className="relative flex-1 h-2.5 rounded-full bg-[#EEEBF6]">
              <div className="absolute left-0 top-0 h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              <span className="absolute -top-2 -translate-x-1/2 text-[15px]" style={{ left: `${pct}%` }}>🐙</span>
            </div>
            <span className="text-lg shrink-0">🏆</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          {secondaryLabel && (
            <button onClick={onClose} className="bg-bg text-sub rounded-xl px-5 py-3 text-[14px] font-semibold hover:bg-border/40 transition">{secondaryLabel}</button>
          )}
          {primaryHref ? (
            <Link href={primaryHref} onClick={onPrimary} className="bg-accent text-white rounded-xl px-5 py-3 text-[14px] font-bold hover:brightness-110 transition">{primaryLabel}</Link>
          ) : (
            <button onClick={onPrimary || onClose} className="bg-accent text-white rounded-xl px-5 py-3 text-[14px] font-bold hover:brightness-110 transition">{primaryLabel}</button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes popupIn { 0%{ transform: scale(.9); opacity: 0 } 100%{ transform: scale(1); opacity: 1 } }
        @keyframes popupBob { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-8px) } }
        .popup-in { animation: popupIn .3s cubic-bezier(.34,1.56,.64,1); }
        .popup-bob { animation: popupBob 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// Bienvenida para usuarios nuevos (se muestra una vez por navegador).
export function PopupBienvenida() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("melsprout_bienvenida")) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!visible) return null;
  const cerrar = () => { localStorage.setItem("melsprout_bienvenida", "1"); setVisible(false); };
  return (
    <PopupCelebracion
      titulo="🎉 ¡Te damos la bienvenida a Melsprout!"
      lineas={["+50 XP", "Tu aventura comienza hoy", "Nivel 1 desbloqueado"]}
      primaryLabel="Empezar recorrido"
      primaryHref="/app/ruta"
      onPrimary={cerrar}
      secondaryLabel="Saltar"
      onClose={cerrar}
    />
  );
}

// Popup de clase completada (con barra Octi → trofeo). Controlado por el reproductor.
export function PopupClaseCompletada({ completadas, total, onContinuar, onClose }: {
  completadas: number; total: number; onContinuar: () => void; onClose: () => void;
}) {
  return (
    <PopupCelebracion
      titulo="🎉 ¡Clase completada!"
      lineas={["Excelente", "+100 XP", `Has completado ${completadas} de ${total} clases`]}
      progreso={{ actual: completadas, total }}
      primaryLabel="Continuar"
      onPrimary={onContinuar}
      onClose={onClose}
    />
  );
}

// Popup de módulo desbloqueado (se muestra una vez por módulo alcanzado).
export function PopupModulo({ modulosCompletos, nombreSiguiente }: { modulosCompletos: number; nombreSiguiente: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (modulosCompletos <= 0) return;
    const visto = Number(localStorage.getItem("melsprout_modulo_visto") || "0");
    if (modulosCompletos <= visto) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [modulosCompletos]);
  if (!visible) return null;
  const cerrar = () => { localStorage.setItem("melsprout_modulo_visto", String(modulosCompletos)); setVisible(false); };
  return (
    <PopupCelebracion
      titulo="🔓 ¡Nuevo módulo desbloqueado!"
      lineas={["+50 XP", `Ya puedes empezar: ${nombreSiguiente}`, "¡Sigue creciendo, creador!"]}
      primaryLabel="Continuar"
      onPrimary={cerrar}
      onClose={cerrar}
    />
  );
}
