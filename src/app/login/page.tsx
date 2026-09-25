"use client";

import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { iniciarSesion, type EstadoAuth } from "@/lib/auth-actions";
import { AuthShell } from "@/components/AuthShell";
import { OAuthButtons, Separador } from "@/components/OAuthButtons";
import { TextField, PasswordField, SubmitButton, Aviso } from "@/components/fields";
import { Turnstile } from "@/components/Turnstile";

function Login() {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(
    iniciarSesion,
    {}
  );
  const [captchaToken, setCaptchaToken] = useState("");
  // Cada error obliga a renovar el captcha: su token es de un solo uso, así que
  // el reinicio se deriva del propio mensaje de error (sin estado extra).
  const reiniciarCaptcha = estado.error ? estado.error.length : 0;

  // Mensajes que llegan del regreso del login social.
  const motivo = useSearchParams().get("error");
  const avisoSocial =
    motivo === "cancelado" ? "Cancelaste el acceso. Puedes intentarlo otra vez o entrar con tu correo."
    : motivo === "social" ? "No pudimos completar el acceso con esa red. Intenta con tu correo y contraseña."
    : motivo === "enlace" ? "Ese enlace ya no es válido. Entra con tu correo y contraseña."
    : "";

  return (
    <AuthShell
      titulo="Bienvenido"
      subtitulo="Entra para seguir tu camino como creador."
      pie={
        <p className="text-center text-[13px] text-sub">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/registro" className="text-accent font-semibold">
            Regístrate gratis
          </Link>
        </p>
      }
    >
      <OAuthButtons />
      <Separador />

      <form action={formAction} className="space-y-3.5">
        <TextField
          label="Email"
          name="email"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
        />
        <PasswordField autoComplete="current-password" />

        <div className="flex justify-end">
          <Link href="/recuperar" className="text-[13px] text-accent font-medium">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Filtro invisible anti-robots (solo aparece si está configurado) */}
        <Turnstile onToken={setCaptchaToken} reiniciar={reiniciarCaptcha} />
        <input type="hidden" name="captchaToken" value={captchaToken} />

        <Aviso error={estado.error || avisoSocial} />
        <SubmitButton pendiente={pendiente}>Entrar</SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><Login /></Suspense>;
}
