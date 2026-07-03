"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verificarLogin } from "@/lib/mfa-actions";
import { usarCodigo } from "@/lib/backup-actions";
import { cerrarSesion } from "@/lib/auth-actions";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton, Aviso } from "@/components/fields";

export default function VerificarPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"totp" | "respaldo">("totp");
  const [codigo, setCodigo] = useState("");
  const [respaldo, setRespaldo] = useState("");
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();

  function verificarTOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await verificarLogin(codigo);
      if ("error" in r) {
        setError(r.error);
        setCodigo("");
      } else {
        router.replace("/app");
        router.refresh();
      }
    });
  }

  function verificarRespaldo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await usarCodigo(respaldo);
      if ("error" in r) {
        setError(r.error);
      } else {
        // El 2FA se retiró: entra y le pedimos reconfigurarlo.
        router.replace("/app/seguridad");
        router.refresh();
      }
    });
  }

  return (
    <AuthShell
      titulo={
        modo === "totp" ? "Verificación en dos pasos" : "Usar código de respaldo"
      }
      subtitulo={
        modo === "totp"
          ? "Escribe el código de 6 dígitos de tu app autenticadora."
          : "Escribe uno de tus códigos de respaldo de un solo uso."
      }
      pie={
        <form action={cerrarSesion} className="text-center">
          <button className="text-[13px] text-sub hover:text-text">
            Cancelar y cerrar sesión
          </button>
        </form>
      }
    >
      {modo === "totp" ? (
        <form onSubmit={verificarTOTP} className="space-y-4">
          <input
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            className="w-full text-center tracking-[0.5em] font-display text-2xl rounded-xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition"
          />
          <Aviso error={error} />
          <SubmitButton pendiente={pendiente} disabled={codigo.length < 6}>
            Verificar
          </SubmitButton>
          <button
            type="button"
            onClick={() => {
              setModo("respaldo");
              setError("");
            }}
            className="w-full text-[13px] text-accent font-medium hover:underline"
          >
            ¿Perdiste tu autenticador? Usar un código de respaldo
          </button>
        </form>
      ) : (
        <form onSubmit={verificarRespaldo} className="space-y-4">
          <input
            value={respaldo}
            onChange={(e) => setRespaldo(e.target.value.slice(0, 12))}
            autoComplete="off"
            autoFocus
            placeholder="XXXXX-XXXXX"
            className="w-full text-center tracking-[0.2em] font-mono text-lg uppercase rounded-xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition"
          />
          <Aviso error={error} />
          <SubmitButton pendiente={pendiente} disabled={respaldo.length < 10}>
            Recuperar mi acceso
          </SubmitButton>
          <p className="text-[12px] text-hint text-center leading-relaxed">
            Al usar un código de respaldo desactivaremos la verificación en dos
            pasos para que puedas entrar y volver a configurarla.
          </p>
          <button
            type="button"
            onClick={() => {
              setModo("totp");
              setError("");
            }}
            className="w-full text-[13px] text-accent font-medium hover:underline"
          >
            ← Volver a usar mi app autenticadora
          </button>
        </form>
      )}
    </AuthShell>
  );
}
