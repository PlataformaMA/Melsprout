"use client";

import { useEffect } from "react";

// Enciende el ayudante que muestra la pantalla de "sin conexión". Solo hace eso:
// no guarda copias de la plataforma, para que nadie vea una versión vieja.
export function RegistrarSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost") return;
    const t = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, []);
  return null;
}
