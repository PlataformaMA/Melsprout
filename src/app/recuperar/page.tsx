"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emailValido } from "@/lib/validacion";
import { AuthShell } from "@/components/AuthShell";
import { TextField, SubmitButton, Aviso } from "@/components/fields";

export default function RecuperarPage() {
  const [email, setEmail] = useState(""); // se guarda al enviar, para poder reenviar
  const [pendiente, setPendiente] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function enviarEnlace(correo: string) {
    setError("");
    if (!emailValido(correo)) { setError("Escribe un correo válido."); return; }
    setEmail(correo);
    setPendiente(true);
    // Se dispara desde el NAVEGADOR: así el "verificador" de seguridad (PKCE)
    // queda en este mismo navegador y el enlace del correo funciona al regresar.
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setPendiente(false);
    setEnviado(true);
  }

  return (
    <AuthShell
      titulo="Recupera tu contraseña"
      subtitulo="Te enviaremos un enlace a tu correo para crear una nueva."
      pie={
        <p className="text-center text-[13px] text-sub">
          <Link href="/login" className="text-accent font-semibold">← Volver a iniciar sesión</Link>
        </p>
      }
    >
      {/* Ícono de sobre */}
      <div className="flex justify-center mb-5">
        <div className="w-20 h-20 rounded-full bg-accent-soft grid place-items-center text-accent">
          <SobreIcon />
        </div>
      </div>

      {enviado ? (
        <div className="space-y-4">
          <Aviso mensaje="Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña." />
          <p className="text-center text-[13px] text-sub">
            ¿No recibiste el correo?{" "}
            <button
              type="button"
              onClick={() => enviarEnlace(email)}
              disabled={pendiente}
              className="text-accent font-semibold hover:underline disabled:opacity-50"
            >
              {pendiente ? "Reenviando…" : "Reenviar enlace"}
            </button>
          </p>
          <NotaSpam />
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const correo = String(new FormData(e.currentTarget).get("email") ?? "").trim();
            enviarEnlace(correo);
          }}
          className="space-y-3.5"
        >
          <TextField
            label="Email de tu cuenta"
            name="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          <Aviso error={error} />
          <SubmitButton pendiente={pendiente}>Enviar enlace de recuperación</SubmitButton>
          <NotaSpam />
        </form>
      )}
    </AuthShell>
  );
}

function NotaSpam() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-bg border border-border p-3 text-[12.5px] text-sub">
      <span className="text-accent shrink-0 mt-0.5">📬</span>
      <span>Revisa tu carpeta de spam si no ves el correo en tu bandeja principal.</span>
    </div>
  );
}

function SobreIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
