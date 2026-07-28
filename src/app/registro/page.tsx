"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { crearCuenta, type EstadoAuth } from "@/lib/auth-actions";
import { AuthShell } from "@/components/AuthShell";
import { OAuthButtons, Separador } from "@/components/OAuthButtons";
import { TextField, PasswordField, SubmitButton, Aviso } from "@/components/fields";
import { Turnstile } from "@/components/Turnstile";

export default function RegistroPage() {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(
    crearCuenta,
    {}
  );
  const [captchaToken, setCaptchaToken] = useState("");

  // Guarda quién invitó (?ref=...) para dar +100 XP, y el canal de origen
  // (?utm_source/medium/campaign=...) para saber de qué anuncio o red llegó.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ref = p.get("ref");
    if (ref) localStorage.setItem("melsprout_ref", ref);
    const canal = ["utm_source", "utm_medium", "utm_campaign"]
      .map((k) => p.get(k))
      .filter(Boolean)
      .join(" / ");
    if (canal) localStorage.setItem("melsprout_canal", canal);
  }, []);

  // Si ya se creó la cuenta, mostramos el aviso de "revisa tu correo".
  if (estado.mensaje) {
    return (
      <AuthShell
        titulo="¡Casi listo! 📬"
        subtitulo="Un último paso para proteger tu cuenta."
        pie={
          <p className="text-center text-[13px] text-sub">
            ¿Ya confirmaste?{" "}
            <Link href="/login" className="text-accent font-semibold">
              Inicia sesión
            </Link>
          </p>
        }
      >
        <Aviso mensaje={estado.mensaje} />
        <p className="text-sm text-sub mt-4 leading-relaxed">
          Abre el correo que te enviamos y toca el botón de confirmación. Sin
          confirmar tu correo no podrás recibir tu diploma ni aparecer en el
          ranking.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titulo="Crea tu cuenta gratis"
      subtitulo="Solo 3 datos. Todo lo demás lo vemos después."
      pie={
        <p className="text-center text-[13px] text-sub">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent font-semibold">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <OAuthButtons />
      <Separador />

      <form action={formAction} className="space-y-3.5">
        <TextField
          label="Nombre completo"
          name="nombre"
          placeholder="Ej. Valentina Rodríguez"
          autoComplete="name"
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
        />
        <PasswordField
          label="Contraseña"
          autoComplete="new-password"
          placeholder="Crea una contraseña segura"
          medidor
        />

        <label className="flex items-start gap-2.5 text-[13px] text-sub cursor-pointer pt-1">
          <input
            type="checkbox"
            name="acepta"
            className="mt-0.5 w-4 h-4 accent-[#7c3aed]"
          />
          <span>
            Acepto los{" "}
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-accent font-medium underline">
              Términos y Condiciones
            </a>{" "}
            y el{" "}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-accent font-medium underline">
              Aviso de Privacidad
            </a>
            .
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-[13px] text-sub cursor-pointer">
          <input
            type="checkbox"
            name="noticias"
            defaultChecked
            className="mt-0.5 w-4 h-4 accent-[#7c3aed]"
          />
          <span>Quiero recibir noticias y recordatorios (opcional).</span>
        </label>

        {/* Filtro invisible anti-robots (solo aparece si está configurado) */}
        <Turnstile onToken={setCaptchaToken} />
        <input type="hidden" name="captchaToken" value={captchaToken} />

        <Aviso error={estado.error} />
        <SubmitButton pendiente={pendiente}>Crear cuenta gratis</SubmitButton>

        <p className="text-[11px] text-hint text-center leading-relaxed">
          🔒 Tu contraseña se guarda cifrada. Nunca la vemos ni la compartimos.
        </p>
      </form>
    </AuthShell>
  );
}
