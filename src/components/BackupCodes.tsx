"use client";

import { useState, useTransition } from "react";
import { generarCodigos } from "@/lib/backup-actions";
import { Aviso } from "@/components/fields";

export function BackupCodes({
  cantidadInicial,
  configurado,
}: {
  cantidadInicial: number;
  configurado: boolean;
}) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [cantidad, setCantidad] = useState(cantidadInicial);
  const [copiado, setCopiado] = useState(false);

  if (!configurado) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="font-display font-extrabold">Códigos de respaldo</h3>
        <p className="text-sub text-sm mt-1">
          Para activar esta función falta configurar la <b>Secret key</b> del
          servidor y la tabla en la base de datos (2 pasos rápidos).
        </p>
      </div>
    );
  }

  function generar() {
    setError("");
    setCopiado(false);
    startTransition(async () => {
      const r = await generarCodigos();
      if ("error" in r) setError(r.error);
      else {
        setCodigos(r.codigos);
        setCantidad(r.codigos.length);
      }
    });
  }

  function copiar() {
    if (!codigos) return;
    navigator.clipboard.writeText(codigos.join("\n")).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function descargar() {
    if (!codigos) return;
    const texto =
      "Códigos de respaldo · Melsprout\n" +
      "Guárdalos en un lugar seguro. Cada uno sirve una sola vez.\n\n" +
      codigos.join("\n") +
      "\n";
    const blob = new Blob([texto], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "melsprout-codigos-respaldo.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-soft grid place-items-center text-lg shrink-0">
          🔑
        </div>
        <div className="flex-1">
          <h3 className="font-display font-extrabold">Códigos de respaldo</h3>
          <p className="text-sub text-sm mt-1">
            Úsalos para entrar si pierdes tu celular o tu app autenticadora. Cada
            código sirve <b>una sola vez</b>.
          </p>

          {!codigos && (
            <>
              <p className="text-[13px] text-text mt-3">
                {cantidad > 0
                  ? `Tienes ${cantidad} código${
                      cantidad === 1 ? "" : "s"
                    } sin usar.`
                  : "Aún no has generado códigos de respaldo."}
              </p>
              <Aviso error={error} />
              <button
                onClick={generar}
                disabled={pendiente}
                className="mt-3 bg-accent text-white font-semibold text-sm rounded-xl px-5 py-2.5 hover:brightness-110 disabled:opacity-60 transition"
              >
                {pendiente
                  ? "Generando…"
                  : cantidad > 0
                  ? "Regenerar códigos"
                  : "Generar códigos de respaldo"}
              </button>
              {cantidad > 0 && (
                <p className="text-[12px] text-hint mt-2">
                  Al regenerar, los códigos anteriores dejan de funcionar.
                </p>
              )}
            </>
          )}

          {codigos && (
            <div className="mt-4">
              <div className="bg-amber-soft border border-amber/20 rounded-lg px-3 py-2.5 text-[12.5px] text-amber leading-relaxed">
                ⚠️ Guárdalos ahora. Por seguridad, <b>no volverás a verlos</b>.
                Si los pierdes, genera unos nuevos.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {codigos.map((c) => (
                  <code
                    key={c}
                    className="text-center text-[13px] font-mono bg-bg border border-border rounded-lg py-2 tracking-wider"
                  >
                    {c}
                  </code>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={copiar}
                  className="flex-1 bg-surface border border-border text-text font-semibold text-[13px] rounded-xl py-2.5 hover:bg-bg transition"
                >
                  {copiado ? "¡Copiado! ✅" : "Copiar todos"}
                </button>
                <button
                  onClick={descargar}
                  className="flex-1 bg-surface border border-border text-text font-semibold text-[13px] rounded-xl py-2.5 hover:bg-bg transition"
                >
                  Descargar .txt
                </button>
              </div>
              <button
                onClick={() => setCodigos(null)}
                className="mt-3 text-[13px] font-medium text-accent hover:underline"
              >
                Ya los guardé en un lugar seguro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
