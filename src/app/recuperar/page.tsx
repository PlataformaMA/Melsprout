"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emailValido } from "@/lib/validacion";
import { AuthShell } from "@/components/AuthShell";
import { TextField, SubmitButton, Aviso } from "@/components/fields";

export default function RecuperarPage() {
  const [pendiente, setPendiente] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function enviarEnlace(correo: string) {
    setError("");
    if (!emailValido(correo)) { setError("Escribe un correo válido."); return; }
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

  // ——— Pantalla 3: "¡Correo enviado!" ———
  if (enviado) {
    return (
      <AuthShell titulo="" subtitulo="">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-24 h-24 rounded-full bg-accent-soft grid place-items-center text-accent mb-5">
            <SobreIcon grande />
            <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-green border-4 border-white grid place-items-center text-white text-[13px] font-bold">✓</span>
          </div>

          <h2 className="font-display text-2xl font-extrabold text-text">¡Correo enviado!</h2>
          <p className="text-sub text-sm mt-3 max-w-[280px]">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>

          <Link href="/login"
            className="mt-7 w-full rounded-xl bg-accent text-white font-bold py-3 text-sm hover:brightness-110 transition">
            Ir al login
          </Link>
        </div>
      </AuthShell>
    );
  }

  // ——— Pantalla 2: "Recuperar contraseña" ———
  return (
    <AuthShell
      titulo="Recuperar contraseña"
      subtitulo="Ingresa tu correo y te enviaremos un enlace para restablecerla."
      pie={
        <p className="text-center text-[13px] text-sub">
          <Link href="/login" className="text-accent font-semibold">Volver al login</Link>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const correo = String(new FormData(e.currentTarget).get("email") ?? "").trim();
          enviarEnlace(correo);
        }}
        className="space-y-3.5"
      >
        <TextField
          label="Email"
          name="email"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
        />
        <Aviso error={error} />
        <SubmitButton pendiente={pendiente}>Enviar enlace</SubmitButton>
      </form>
    </AuthShell>
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
