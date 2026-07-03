"use client";

import Link from "next/link";
import { useActionState } from "react";
import { iniciarSesion, type EstadoAuth } from "@/lib/auth-actions";
import { AuthShell } from "@/components/AuthShell";
import { OAuthButtons, Separador } from "@/components/OAuthButtons";
import { TextField, PasswordField, SubmitButton, Aviso } from "@/components/fields";

export default function LoginPage() {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(
    iniciarSesion,
    {}
  );

  return (
    <AuthShell
      titulo="Bienvenido de vuelta"
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

        <Aviso error={estado.error} />
        <SubmitButton pendiente={pendiente}>Entrar</SubmitButton>
      </form>
    </AuthShell>
  );
}
