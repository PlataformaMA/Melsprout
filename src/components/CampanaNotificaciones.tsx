"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { getNotificaciones, marcarLeidas, type Notificacion } from "@/lib/notificaciones-actions";

const EMOJI: Record<string, string> = {
  general: "🔔", reto: "🎯", comentario: "💬", like: "❤️",
  racha: "🔥", nivel: "⭐", clase: "📖",
};

// La campana del encabezado. Antes era un botón decorativo sin onClick.
export function CampanaNotificaciones({ sinLeerInicial = 0 }: { sinLeerInicial?: number }) {
  const [abierto, setAbierto] = useState(false);
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [sinLeer, setSinLeer] = useState(sinLeerInicial);
  const [cargando, setCargando] = useState(false);
  const [, startTransition] = useTransition();
  const caja = useRef<HTMLDivElement>(null);

  // Cerrar al tocar fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  function abrir() {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (!nuevo) return;
    setCargando(true);
    startTransition(async () => {
      const { lista: l } = await getNotificaciones();
      setLista(l);
      setCargando(false);
      // Al abrirlas se dan por vistas: el punto rojo desaparece.
      if (l.some((n) => !n.leida)) {
        await marcarLeidas();
        setSinLeer(0);
      }
    });
  }

  return (
    <div className="relative" ref={caja}>
      <button onClick={abrir}
        className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-surface transition"
        aria-label="Notificaciones" aria-expanded={abierto}>
        <BellIcon />
        {sinLeer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-accent text-white text-[10px] font-bold grid place-items-center">
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-11 z-50 w-[min(88vw,340px)] bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display font-extrabold text-[15px]">Notificaciones</h3>
          </div>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {cargando && <p className="text-center text-sub text-[13px] py-8">Cargando…</p>}

            {!cargando && lista.length === 0 && (
              <div className="text-center py-10 px-6">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sub text-[13px] leading-snug">
                  Aquí te avisaremos cuando revisen tu reto, comenten tu publicación o subas de nivel.
                </p>
              </div>
            )}

            {!cargando && lista.map((n) => {
              const fila = (
                <div className={`flex items-start gap-3 px-4 py-3 ${n.leida ? "" : "bg-accent-soft/40"}`}>
                  <span className="text-lg shrink-0">{EMOJI[n.tipo] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold leading-snug">{n.titulo}</p>
                    {n.cuerpo && <p className="text-[12.5px] text-sub leading-snug mt-0.5">{n.cuerpo}</p>}
                    <p className="text-[11px] text-hint mt-1">{n.hace}</p>
                  </div>
                </div>
              );
              return n.href
                ? <Link key={n.id} href={n.href} onClick={() => setAbierto(false)} className="block hover:bg-bg transition">{fila}</Link>
                : <div key={n.id}>{fila}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717a"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
