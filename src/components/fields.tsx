"use client";

import { useState } from "react";
import { evaluarPassword } from "@/lib/validacion";

export function TextField({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-text">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition"
      />
    </label>
  );
}

export function PasswordField({
  label = "Contraseña",
  name = "password",
  autoComplete = "current-password",
  medidor = false,
  placeholder = "Tu contraseña",
}: {
  label?: string;
  name?: string;
  autoComplete?: string;
  medidor?: boolean;
  placeholder?: string;
}) {
  const [valor, setValor] = useState("");
  const [ver, setVer] = useState(false);
  const fuerza = evaluarPassword(valor);

  const colores = ["#DC2626", "#DC2626", "#D97706", "#059669", "#059669"];
  const anchos = ["12%", "30%", "55%", "80%", "100%"];

  return (
    <label className="block">
      <span className="text-[13px] font-medium text-text">{label}</span>
      <div className="mt-1.5 relative">
        <input
          name={name}
          type={ver ? "text" : "password"}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-11 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition"
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sub hover:text-text text-xs font-medium"
          aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {ver ? "Ocultar" : "Ver"}
        </button>
      </div>

      {medidor && valor.length > 0 && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: anchos[fuerza.puntaje],
                background: colores[fuerza.puntaje],
              }}
            />
          </div>
          <p className="text-[11px] mt-1" style={{ color: colores[fuerza.puntaje] }}>
            {fuerza.etiqueta}
            {fuerza.faltantes.length > 0 && (
              <span className="text-hint">
                {" "}
                · falta: {fuerza.faltantes.join(", ")}
              </span>
            )}
          </p>
        </div>
      )}
    </label>
  );
}

export function SubmitButton({
  children,
  pendiente,
  disabled,
}: {
  children: React.ReactNode;
  pendiente?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pendiente || disabled}
      className="w-full bg-accent text-white font-semibold text-sm rounded-xl py-3 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {pendiente ? "Un momento…" : children}
    </button>
  );
}

export function Aviso({ error, mensaje }: { error?: string; mensaje?: string }) {
  if (error)
    return (
      <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2.5">
        {error}
      </p>
    );
  if (mensaje)
    return (
      <p className="text-[13px] text-green bg-green-soft rounded-lg px-3 py-2.5">
        {mensaje}
      </p>
    );
  return null;
}
