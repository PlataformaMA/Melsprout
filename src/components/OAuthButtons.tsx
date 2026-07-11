"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Proveedor = "google" | "facebook";

export function OAuthButtons() {
  const [cargando, setCargando] = useState<Proveedor | null>(null);
  const [error, setError] = useState("");

  async function entrarCon(provider: Proveedor) {
    setError("");
    setCargando(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
        // Facebook: pedir solo public_profile (acceso avanzado automático) para que
        // TODOS puedan entrar. El permiso `email` sigue en revisión de Meta; cuando
        // lo aprueben, se puede volver a agregar "email" aquí para capturar el correo.
        ...(provider === "facebook" ? { scopes: "public_profile" } : {}),
      },
    });
    if (error) {
      setCargando(null);
      setError(
        "No se pudo abrir el login social. Verifica que el proveedor esté activado en Supabase."
      );
    }
    // Si todo va bien, el navegador redirige al proveedor.
  }

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => entrarCon("google")}
        disabled={cargando !== null}
        className="w-full bg-surface border border-border text-text font-semibold text-sm rounded-xl py-3 hover:bg-bg disabled:opacity-60 transition flex items-center justify-center gap-2.5"
      >
        <GoogleIcon />
        {cargando === "google" ? "Conectando…" : "Continuar con Google"}
      </button>

      <button
        type="button"
        onClick={() => entrarCon("facebook")}
        disabled={cargando !== null}
        className="w-full bg-[#1877F2] text-white font-semibold text-sm rounded-xl py-3 hover:brightness-110 disabled:opacity-60 transition flex items-center justify-center gap-2.5"
      >
        <FacebookIcon />
        {cargando === "facebook" ? "Conectando…" : "Continuar con Facebook"}
      </button>

      {error && (
        <p className="text-[12px] text-pink bg-pink-soft rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

export function Separador() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] text-hint uppercase tracking-wide">o</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}
