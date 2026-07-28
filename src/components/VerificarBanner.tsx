"use client";

import { useState, useTransition } from "react";
import { reenviarVerificacion } from "@/lib/verificacion-actions";

// Banner para usuarios que aún NO verificaron su correo: pueden usar la app,
// pero no aparecen en el ranking ni reciben diploma hasta verificar.
export function VerificarBanner() {
  const [enviado, setEnviado] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const reenviar = () =>
    startTransition(async () => {
      await reenviarVerificacion();
      setEnviado(true);
    });

  return (
    <div className="rounded-2xl border border-amber/40 bg-amber-soft/50 p-4 flex items-start gap-3">
      <span className="text-xl shrink-0">📬</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[13.5px] text-text leading-tight">Verifica tu correo</div>
        <p className="text-[12.5px] text-sub mt-0.5">
          Para aparecer en el <b>ranking</b> y recibir tu <b>diploma</b>, verifica tu correo.
        </p>
        {enviado ? (
          <p className="text-[12.5px] text-green font-semibold mt-2">✓ Te reenviamos el correo. Revisa tu bandeja y el spam.</p>
        ) : (
          <button onClick={reenviar} disabled={pendiente}
            className="mt-2 text-[12.5px] font-bold text-accent hover:underline disabled:opacity-50">
            {pendiente ? "Enviando…" : "Reenviar correo de verificación"}
          </button>
        )}
      </div>
    </div>
  );
}
