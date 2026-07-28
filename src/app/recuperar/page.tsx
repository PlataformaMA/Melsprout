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

  // ——— Pantalla de confirmación "¡Correo enviado!" ———
  if (enviado) {
    return (
      <AuthShell titulo="" subtitulo="">
        <div className="flex flex-col items-center text-center">
          {/* Sobre con check */}
          <div className="relative w-24 h-24 rounded-full bg-accent-soft grid place-items-center text-accent mb-5">
            <SobreIcon grande />
            <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-green border-4 border-white grid place-items-center text-white text-[13px] font-bold">✓</span>
          </div>

          <h2 className="font-display text-2xl font-extrabold text-text">¡Correo enviado!</h2>
          <p className="text-sub text-sm mt-3">Hemos enviado un enlace de recuperación a:</p>
          <p className="font-semibold text-text text-sm mt-1 break-all">{email}</p>
          <p className="text-hint text-[13px] mt-5">El enlace expirará en 24 horas.</p>

          <Link href="/login"
            className="mt-7 w-full rounded-xl border-2 border-accent text-accent font-bold py-2.5 text-sm hover:bg-accent-soft transition">
            Volver al inicio de sesión
          </Link>

          <button type="button" onClick={() => enviarEnlace(email)} disabled={pendiente}
            className="mt-4 text-accent font-semibold text-[13px] hover:underline disabled:opacity-50">
            {pendiente ? "Reenviando…" : "Reenviar enlace"}
          </button>

          <div className="mt-6 w-full"><NotaSpam /></div>
        </div>
      </AuthShell>
    );
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

function SobreIcon({ grande = false }: { grande?: boolean }) {
  const s = grande ? 42 : 34;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
