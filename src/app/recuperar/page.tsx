"use client";

import Link from "next/link";
import { useActionState } from "react";
import { pedirReset, type EstadoAuth } from "@/lib/auth-actions";
import { AuthShell } from "@/components/AuthShell";
import { TextField, SubmitButton, Aviso } from "@/components/fields";

export default function RecuperarPage() {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(
    pedirReset,
    {}
  );

  return (
    <AuthShell
      titulo="Recupera tu contraseña"
      subtitulo="Te enviamos un enlace para crear una nueva."
      pie={
        <p className="text-center text-[13px] text-sub">
          <Link href="/login" className="text-accent font-semibold">
            ← Volver a iniciar sesión
          </Link>
        </p>
      }
    >
      {estado.mensaje ? (
        <Aviso mensaje={estado.mensaje} />
      ) : (
        <form action={formAction} className="space-y-3.5">
          <TextField
            label="Email de tu cuenta"
            name="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          <Aviso error={estado.error} />
          <SubmitButton pendiente={pendiente}>Enviarme el enlace</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
