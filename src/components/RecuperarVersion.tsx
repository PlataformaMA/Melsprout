"use client";

import { useEffect } from "react";

// Cuando desplegamos una versión nueva, una pestaña abierta desde antes le
// pide al servidor funciones que ya no existen ("Server Action not found").
// Esto lo detecta y recarga una sola vez, para que nadie tenga que saber que
// hay que hacer ⌘+Shift+R.
const SENALES = [
  "was not found on the server",
  "Failed to find Server Action",
  "Connection closed",
];

export function RecuperarVersion() {
  useEffect(() => {
    function esVersionVieja(msg: string): boolean {
      return SENALES.some((s) => msg.includes(s));
    }

    function recargarUnaVez() {
      try {
        if (sessionStorage.getItem("melsprout_recargado") === "1") return;
        sessionStorage.setItem("melsprout_recargado", "1");
      } catch {
        // Sin sessionStorage, mejor no arriesgar un ciclo de recargas.
        return;
      }
      window.location.reload();
    }

    const onError = (e: ErrorEvent) => {
      if (e.message && esVersionVieja(e.message)) recargarUnaVez();
    };
    const onRechazo = (e: PromiseRejectionEvent) => {
      const m = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "");
      if (esVersionVieja(m)) recargarUnaVez();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRechazo);
    // Si la carga salió bien, se limpia la marca para poder recuperar otra vez.
    const limpiar = setTimeout(() => {
      try { sessionStorage.removeItem("melsprout_recargado"); } catch {}
    }, 8000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRechazo);
      clearTimeout(limpiar);
    };
  }, []);

  return null;
}
