"use client";

import { useCallback, useState } from "react";

type PhylloInstance = {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
};
declare global {
  interface Window {
    PhylloConnect?: { initialize: (config: Record<string, unknown>) => PhylloInstance };
  }
}

const SDK_URL = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js";

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

      // Modo redirección: te lleva a la página de Phyllo y regresa a /app/perfil.
      PC.initialize({
        clientDisplayName: "Melsprout",
        environment: token.environment,
        userId: token.userId,
        token: token.sdkToken,
        redirect: true,
        redirectURL: `${window.location.origin}/app/perfil?phyllo=conectado`,
      });
    } catch {
      alert("No se pudo abrir la conexión de redes. Inténtalo de nuevo.");
      setCargando(false);
    }
  }, [token]);

  return (
    <button type="button" onClick={abrir} disabled={cargando} className={className}>
      {cargando ? "Abriendo…" : children}
    </button>
  );
}
