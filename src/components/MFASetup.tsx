"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  iniciarEnrolamiento,
  confirmarEnrolamiento,
  desactivarMFA,
  type EstadoMFA,
} from "@/lib/mfa-actions";
import { SubmitButton, Aviso } from "@/components/fields";

export function MFASetup({ estadoInicial }: { estadoInicial: EstadoMFA }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Datos del proceso de activación
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [codigo, setCodigo] = useState("");

  // ===== Ya activo → mostrar estado + opción de desactivar =====
  if (estadoInicial.activo) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-soft grid place-items-center text-lg shrink-0">
            🔐
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold">
                Verificación en dos pasos
              </h3>
              <span className="text-[11px] font-semibold text-green bg-green-soft rounded-full px-2 py-0.5">
                Activada
              </span>
            </div>
            <p className="text-sub text-sm mt-1">
              Tu cuenta está protegida. Cada vez que inicies sesión pediremos el
              código de tu app autenticadora.
            </p>

            <Aviso error={error} />

            <button
              onClick={() => {
                setError("");
                if (
                  !confirm(
                    "¿Seguro que quieres desactivar la verificación en dos pasos? Tu cuenta quedará menos protegida."
                  )
                )
                  return;
                startTransition(async () => {
                  const r = await desactivarMFA(estadoInicial.factorId!);
                  if ("error" in r) setError(r.error);
                  else router.refresh();
                });
              }}
              disabled={pendiente}
              className="mt-4 text-[13px] font-medium text-pink hover:underline disabled:opacity-60"
            >
              Desactivar verificación en dos pasos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== En proceso de activación (ya tenemos QR) =====
  if (qr) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="font-display font-extrabold">
          Escanea el código con tu app
        </h3>
        <p className="text-sub text-sm mt-1">
          Abre Google Authenticator, Authy o Microsoft Authenticator y escanea
          este código.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="Código QR para 2FA"
            className="w-44 h-44 rounded-xl border border-border bg-white p-2"
          />
          <div className="flex-1 w-full">
            <p className="text-[12px] text-sub">
              ¿No puedes escanear? Escribe esta clave en tu app:
            </p>
            <code className="block mt-1 text-[12px] bg-bg border border-border rounded-lg px-3 py-2 break-all font-mono">
              {secret}
            </code>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                startTransition(async () => {
                  const r = await confirmarEnrolamiento(factorId, codigo);
                  if ("error" in r) {
                    setError(r.error);
                    setCodigo("");
                  } else {
                    router.refresh();
                  }
                });
              }}
              className="mt-4 space-y-3"
            >
              <label className="block text-[13px] font-medium text-text">
                Código de 6 dígitos
              </label>
              <input
                value={codigo}
                onChange={(e) =>
                  setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="w-full text-center tracking-[0.4em] font-display text-xl rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <Aviso error={error} />
              <SubmitButton pendiente={pendiente} disabled={codigo.length < 6}>
                Confirmar y activar
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ===== Estado inicial: invitar a activar =====
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center text-lg shrink-0">
          🛡️
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-extrabold">
              Verificación en dos pasos
            </h3>
            <span className="text-[11px] font-semibold text-sub bg-bg border border-border rounded-full px-2 py-0.5">
              Opcional
            </span>
          </div>
          <p className="text-sub text-sm mt-1">
            Añade una capa extra de seguridad (opcional). Aunque alguien robe tu
            contraseña, no podrá entrar sin el código de tu celular.
          </p>

          <Aviso error={error} />

          <button
            onClick={() => {
              setError("");
              startTransition(async () => {
                const r = await iniciarEnrolamiento();
                if ("error" in r) {
                  setError(r.error);
                } else {
                  setQr(r.qr);
                  setSecret(r.secret);
                  setFactorId(r.factorId);
                }
              });
            }}
            disabled={pendiente}
            className="mt-4 bg-accent text-white font-semibold text-sm rounded-xl px-5 py-2.5 hover:brightness-110 disabled:opacity-60 transition"
          >
            {pendiente ? "Un momento…" : "Activar verificación en dos pasos"}
          </button>
        </div>
      </div>
    </div>
  );
}
