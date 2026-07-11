"use client";

import { useCallback, useRef, useState } from "react";

// SDK web de conexión (InsightIQ corre sobre Phyllo Connect v2).
const SDK_URL = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js";

type PhylloInstance = {
  open: () => void;
  on: (evt: string, cb: (...args: unknown[]) => void) => void;
};
type PhylloConnectGlobal = {
  initialize: (config: Record<string, unknown>) => PhylloInstance;
};
declare global {
  interface Window {
    PhylloConnect?: PhylloConnectGlobal;
  }
}

function cargarSdk(): Promise<PhylloConnectGlobal> {
  return new Promise((resolve, reject) => {
    if (window.PhylloConnect) return resolve(window.PhylloConnect);
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () =>
      window.PhylloConnect
        ? resolve(window.PhylloConnect)
        : reject(new Error("SDK no disponible"));
    s.onerror = () => reject(new Error("No se pudo cargar el SDK"));
    document.body.appendChild(s);
  });
}

export type InsightIQConfig = {
  userId: string;
  token: string;
  environment: string;
};

// Hook: devuelve una función abrir(workPlatformId?) y un estado de carga.
export function useConectarInsightIQ(cfg: InsightIQConfig | null) {
  const [cargando, setCargando] = useState(false);
  const abierto = useRef(false);

  const abrir = useCallback(
    async (workPlatformId?: string) => {
      if (!cfg) {
        alert("La conexión de redes no está configurada. Recarga la página.");
        return;
      }
      if (abierto.current) return;
      setCargando(true);
      try {
        const Phyllo = await cargarSdk();
        // Modo redirect: navega a la ventana de InsightIQ como página completa
        // (evita popups bloqueados / iframe invisible). Al terminar regresa aquí
        // y la página vuelve a sincronizar las métricas.
        const redirectURL = `${window.location.origin}/app/perfil`;
        const instancia = Phyllo.initialize({
          clientDisplayName: "Melsprout",
          environment: cfg.environment,
          userId: cfg.userId,
          token: cfg.token,
          redirect: true,
          redirectURL,
          ...(workPlatformId ? { workPlatformId } : {}),
        });
        abierto.current = true;
        instancia.open(); // hace window.location.href = <url de InsightIQ>
      } catch (e) {
        console.error(e);
        abierto.current = false;
        setCargando(false);
        alert(
          "No se pudo abrir la conexión: " +
            (e instanceof Error ? e.message : String(e))
        );
      }
    },
    [cfg]
  );

  return { abrir, cargando, disponible: !!cfg };
}
