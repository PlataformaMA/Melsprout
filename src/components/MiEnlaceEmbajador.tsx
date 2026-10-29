"use client";

import { useEffect, useState } from "react";
import { miEnlace } from "@/lib/enlaces-afiliado";
import type { MiEnlace } from "@/lib/enlaces-afiliado";

// El enlace de embajadora: lo que de verdad va a compartir.
//
// Se carga al abrir la campaña porque el enlace se crea la primera vez que se
// pide, y lo que queremos es que ya esté ahí cuando entre, no detrás de un
// botón que hay que descubrir.

export function MiEnlaceEmbajador({ campaniaId }: { campaniaId: string }) {
  const [estado, setEstado] = useState<MiEnlace | { error: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    miEnlace(campaniaId).then((r) => { if (vivo) setEstado(r); });
    return () => { vivo = false; };
  }, [campaniaId]);

  if (!estado) {
    return (
      <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 mt-5 shadow-sm">
        <p className="text-[13.5px] text-sub">Preparando tu enlace…</p>
      </section>
    );
  }

  // Todavía no queda seleccionada: se le dice, sin que parezca un error.
  if ("error" in estado) {
    return (
      <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 mt-5 shadow-sm">
        <h2 className="font-display font-extrabold text-[17px]">Tu enlace de embajadora</h2>
        <p className="text-[13.5px] text-sub leading-snug mt-1.5">{estado.error}</p>
      </section>
    );
  }

  async function copiar() {
    if (!estado || "error" in estado) return;
    try {
      await navigator.clipboard.writeText(estado.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace está a la vista para copiarlo
      // a mano, así que no hace falta avisar nada.
    }
  }

  return (
    <section className="bg-accent-soft/50 border border-accent/25 rounded-3xl p-5 sm:p-7 mt-5">
      <h2 className="font-display font-extrabold text-[17px]">🔗 Tu enlace de embajadora</h2>
      <p className="text-[13.5px] text-sub leading-snug mt-1.5">
        Este enlace es tuyo y solo tuyo. Cada venta que entre por aquí se te cuenta a ti.
        Compártelo donde quieras: historias, bio, videos, mensajes.
      </p>

      <div className="flex gap-2 mt-4 flex-wrap">
        <code className="flex-1 min-w-[220px] bg-surface border border-border rounded-xl px-3.5 h-12 flex items-center text-[13.5px] font-semibold overflow-x-auto whitespace-nowrap">
          {estado.url}
        </code>
        <button onClick={copiar}
          className="shrink-0 bg-accent text-white rounded-xl px-5 h-12 text-[13.5px] font-bold hover:brightness-110 transition">
          {copiado ? "¡Copiado! ✓" : "Copiar enlace"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 max-w-sm">
        <Dato n={estado.clics} t={estado.clics === 1 ? "clic" : "clics"} />
        <Dato n={estado.ventas} t={estado.ventas === 1 ? "venta" : "ventas"} />
      </div>

      {!estado.destino && (
        <p className="text-[12.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mt-4 leading-snug">
          El equipo todavía no configuró a dónde lleva el enlace. Avísanos antes de compartirlo.
        </p>
      )}
    </section>
  );
}

function Dato({ n, t }: { n: number; t: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3">
      <div className="font-display text-2xl font-extrabold leading-none">{n}</div>
      <div className="text-[12px] text-sub mt-1">{t}</div>
    </div>
  );
}
