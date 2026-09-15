"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { activarCuenta } from "@/lib/activar-actions";

export function BotonActivar({ k, pedirNuevo }: { k: string; pedirNuevo: string }) {
  const [pendiente, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <button
        onClick={() => start(async () => { const r = await activarCuenta(k); if (r && "error" in r) setError(r.error); })}
        disabled={pendiente}
        className="block w-full text-center rounded-xl bg-accent text-white font-bold py-3 text-sm hover:brightness-110 disabled:opacity-60 transition">
        {pendiente ? "Preparando tu acceso…" : "Crear mi contraseña"}
      </button>
      {error && (
        <p className="text-pink text-[13px] text-center">
          {error}{" "}
          <Link href={pedirNuevo} className="text-accent font-semibold underline">Pedir enlace nuevo</Link>
        </p>
      )}
    </div>
  );
}
