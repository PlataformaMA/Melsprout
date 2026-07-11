"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const abierto = useRef(false);

  const abrir = useCallback(
    async (workPlatformId?: string) => {
      if (!cfg || abierto.current) return;
      setCargando(true);
      try {
        const Phyllo = await cargarSdk();
        const instancia = Phyllo.initialize({
          clientDisplayName: "Melsprout",
          environment: cfg.environment,
          userId: cfg.userId,
          token: cfg.token,
          ...(workPlatformId ? { workPlatformId } : {}),
        });
        abierto.current = true;
        const refrescar = () => {
          abierto.current = false;
          setCargando(false);
          router.refresh();
        };
        instancia.on("accountConnected", refrescar);
        instancia.on("accountDisconnected", refrescar);
        instancia.on("exit", () => {
          abierto.current = false;
          setCargando(false);
          router.refresh();
        });
        instancia.on("connectionFailure", () => {
          abierto.current = false;
          setCargando(false);
        });
        instancia.on("tokenExpired", () => {
          abierto.current = false;
          setCargando(false);
          router.refresh();
        });
        instancia.open();
      } catch (e) {
        console.error(e);
        abierto.current = false;
        setCargando(false);
      }
    },
    [cfg, router]
  );

  return { abrir, cargando, disponible: !!cfg };
}
