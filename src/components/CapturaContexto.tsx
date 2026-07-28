"use client";

import { useEffect } from "react";
import { guardarContexto } from "@/lib/contexto-actions";

// Nombres de país en español para los mercados más comunes (según el código de región).
const PAISES: Record<string, string> = {
  MX: "México", CO: "Colombia", AR: "Argentina", PE: "Perú", CL: "Chile",
  EC: "Ecuador", GT: "Guatemala", VE: "Venezuela", BO: "Bolivia", DO: "República Dominicana",
  HN: "Honduras", PY: "Paraguay", SV: "El Salvador", NI: "Nicaragua", CR: "Costa Rica",
  PA: "Panamá", UY: "Uruguay", ES: "España", US: "Estados Unidos", BR: "Brasil",
};

// Se monta dentro de /app: detecta zona horaria, país y canal de origen del
// navegador y los guarda una sola vez (no reenvía si ya se guardó lo mismo).
export function CapturaContexto() {
  useEffect(() => {
    try {
      const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      let region = "";
      try { region = new Intl.Locale(navigator.language).region || ""; } catch {}
      const pais = PAISES[region] || region || "";
      const canalOrigen = localStorage.getItem("melsprout_canal") || "";

      const firma = `${zonaHoraria}|${pais}|${canalOrigen}`;
      if (localStorage.getItem("melsprout_ctx") === firma) return;

      guardarContexto({ zonaHoraria, pais, canalOrigen })
        .then(() => localStorage.setItem("melsprout_ctx", firma))
        .catch(() => {});
    } catch {
      // Si el navegador no permite algo, no pasa nada: se omite en silencio.
    }
  }, []);

  return null;
}
