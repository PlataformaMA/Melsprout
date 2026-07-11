"use client";

import { useCallback, useState } from "react";

// Bases de la página de conexión de Phyllo por entorno.
const CONNECT_BASE: Record<string, string> = {
  sandbox: "https://connect.sandbox.getphyllo.com",
  staging: "https://connect.staging.getphyllo.com",
  production: "https://connect.getphyllo.com",
};

export function ConectarPhyllo({
  className, children, token,
}: {
  className?: string;
  children: React.ReactNode;
  token: { sdkToken: string; environment: string; userId: string } | null;
}) {
  const [cargando, setCargando] = useState(false);

  const abrir = useCallback(() => {
    if (!token) {
      alert("La conexión de redes aún no está lista. Recarga la página e inténtalo.");
      return;
    }
    setCargando(true);

    // Construimos la URL de conexión de Phyllo y redirigimos directo
    // (sin SDK). Al terminar, Phyllo regresa a /app/perfil?phyllo=conectado.
    const base = CONNECT_BASE[token.environment] || CONNECT_BASE.staging;
    const redirectURL = `${window.location.origin}/app/perfil?phyllo=conectado`;
    const params = new URLSearchParams({
      userId: token.userId,
      appName: "Melsprout",
      redirectURL,
      token: token.sdkToken,
      env: token.environment,
      singleAccount: "false",
      version: "2",
    });
    window.location.href = `${base}?${params.toString()}`;
  }, [token]);

  return (
    <button type="button" onClick={abrir} disabled={cargando} className={className}>
      {cargando ? "Abriendo…" : children}
    </button>
  );
}
