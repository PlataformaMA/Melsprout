"use client";

import { useActionState, useState } from "react";
import { eliminarCuenta, type EstadoAuth } from "@/lib/auth-actions";
import { Aviso } from "@/components/fields";

// Botón de "Zona peligrosa": eliminar la cuenta y todos los datos, con
// confirmación en dos pasos para evitar borrados accidentales.
export function EliminarCuentaBoton() {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(eliminarCuenta, {});

  return (
    <div className="rounded-2xl border border-pink/40 bg-pink-soft/40 p-4">
      <h3 className="font-bold text-[15px] text-text">Eliminar mi cuenta</h3>
      <p className="text-[13px] text-sub mt-1">
        Borra tu cuenta y <b>todos tus datos</b> (progreso, retos, perfil). Esta acción es
        permanente y no se puede deshacer.
      </p>

      {!confirmando ? (
        <button
          onClick={() => setConfirmando(true)}
          className="mt-3 rounded-xl border border-pink text-pink font-bold text-[13px] px-4 py-2 hover:bg-pink-soft transition"
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <form action={formAction} className="mt-3">
          <p className="text-[13px] font-semibold text-text mb-2">
            ¿Seguro? Esto es permanente.
          </p>
          <Aviso error={estado.error} />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={pendiente}
              className="rounded-xl bg-pink text-white font-bold text-[13px] px-4 py-2 hover:brightness-110 transition disabled:opacity-50"
            >
              {pendiente ? "Eliminando…" : "Sí, eliminar todo"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-xl border border-border text-text font-semibold text-[13px] px-4 py-2 hover:bg-bg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
