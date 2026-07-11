"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type PhylloInstance = {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  exit?: () => void;
};
declare global {
  interface Window {
    PhylloConnect?: { initialize: (config: Record<string, unknown>) => PhylloInstance };
  }
}

const SDK_URL = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js";

// Fuerza que el popup (iframe) de Phyllo se vea a pantalla completa
// (a veces el SDK lo crea con altura 0 = invisible).
function forzarVisibilidadPopup() {
  if (document.getElementById("phyllo-fix-css")) return;
  const style = document.createElement("style");
  style.id = "phyllo-fix-css";
  style.textContent = `
    .modal-phyllo { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: block !important; background: rgba(0,0,0,.15); }
    .modal-phyllo iframe { width: 100% !important; height: 100% !important; border: 0 !important; display: block !important; }
  `;
  document.head.appendChild(style);
}

function cargarScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.PhylloConnect) return resolve();
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar Phyllo"));
    document.body.appendChild(s);
  });
}

export function ConectarPhyllo({
  className, children, token,
}: {
  className?: string;
  children: React.ReactNode;
  token: { sdkToken: string; environment: string; userId: string } | null;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const abrir = useCallback(async () => {
    if (!token) {
      alert("La conexión de redes aún no está lista. Recarga la página e inténtalo.");
      return;
    }
    setCargando(true);
    try {
      await cargarScript();
      const PC = window.PhylloConnect;
      if (!PC || typeof PC.initialize !== "function") throw new Error("SDK no disponible");

      forzarVisibilidadPopup();

      // Modo popup embebido (iframe) — el estándar de Phyllo, no necesita redirect URL.
      const pc = PC.initialize({
        clientDisplayName: "Melsprout",
        environment: token.environment,
        userId: token.userId,
        token: token.sdkToken,
      });

      pc.on("accountConnected", () => {
        try { pc.exit?.(); } catch { /* noop */ }
        // La página sincroniza las métricas (server-side) con este parámetro.
        router.push("/app/perfil?phyllo=conectado");
      });
      pc.on("exit", () => setCargando(false));
      pc.on("connectionFailure", () => setCargando(false));
    } catch {
      alert("No se pudo abrir la conexión de redes. Inténtalo de nuevo.");
      setCargando(false);
    }
  }, [token, router]);

  return (
    <button type="button" onClick={abrir} disabled={cargando} className={className}>
      {cargando ? "Abriendo…" : children}
    </button>
  );
}
