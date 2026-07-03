"use client";

import { useActionState } from "react";
import { actualizarPassword, type EstadoAuth } from "@/lib/auth-actions";
import { AuthShell } from "@/components/AuthShell";
import { PasswordField, SubmitButton, Aviso } from "@/components/fields";

// A esta pantalla se llega desde el enlace del correo (ya con sesión temporal,
// gracias al callback). Aquí el usuario define su nueva contraseña.
export default function RestablecerPage() {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(
    actualizarPassword,
    {}
  );

  return (
    <AuthShell
      titulo="Crea una nueva contraseña"
      subtitulo="Elige una contraseña segura para tu cuenta."
    >
      <form action={formAction} className="space-y-3.5">
        <PasswordField
          label="Nueva contraseña"
          autoComplete="new-password"
          placeholder="Crea una contraseña segura"
          medidor
        />
        <Aviso error={estado.error} />
        <SubmitButton pendiente={pendiente}>Guardar y entrar</SubmitButton>
      </form>
    </AuthShell>
  );
}
