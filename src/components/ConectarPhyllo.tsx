"use client";

import { useCallback, useState } from "react";
import { obtenerTokenPhyllo } from "@/lib/phyllo-actions";

type PhylloInstance = {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  open: () => void;
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
  className, children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [cargando, setCargando] = useState(false);

  const abrir = useCallback(async () => {
    setCargando(true);
    try {
      alert("PASO 1: pidiendo token…");
      const t = await obtenerTokenPhyllo();
      if ("error" in t) {
        alert("ERROR TOKEN: " + t.error);
        setCargando(false);
        return;
      }
      alert("PASO 2: token OK (env=" + t.environment + "). Cargando SDK…");
      await cargarScript();
      const ok = !!window.PhylloConnect && typeof window.PhylloConnect.initialize === "function";
      alert("PASO 3: SDK cargado = " + ok + ". Abriendo Phyllo…");
      if (!ok) throw new Error("SDK no disponible");

      window.PhylloConnect.initialize({
        clientDisplayName: "Melsprout",
        environment: t.environment,
        userId: t.userId,
        token: t.sdkToken,
        redirect: true,
        redirectURL: `${window.location.origin}/app/perfil?phyllo=conectado`,
      });
      alert("PASO 4: initialize llamado. Si ves esto y NO te llevó a Phyllo, el redirect falló.");
    } catch (e) {
      alert("EXCEPCIÓN: " + (e instanceof Error ? e.message : String(e)));
      setCargando(false);
    }
  }, []);

  return (
    <button type="button" onClick={abrir} disabled={cargando} className={className}>
      {cargando ? "Abriendo…" : children}
    </button>
  );
}
