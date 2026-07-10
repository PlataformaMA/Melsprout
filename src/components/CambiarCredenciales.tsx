"use client";

import { useActionState } from "react";
import { cambiarPassword, cambiarCorreo, type EstadoAuth } from "@/lib/auth-actions";
import { TextField, SubmitButton, Aviso } from "@/components/fields";

export function CambiarContrasena() {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(cambiarPassword, {});
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h2 className="font-display text-lg font-extrabold mb-1">Cambiar contraseña</h2>
      <p className="text-sub text-[13px] mb-4">Elige una contraseña nueva y segura.</p>
      {estado.mensaje ? (
        <Aviso mensaje={estado.mensaje} />
      ) : (
        <form action={formAction} className="space-y-3.5">
          <TextField label="Nueva contraseña" name="password" type="password" placeholder="••••••••" autoComplete="new-password" />
          <TextField label="Repite la nueva contraseña" name="confirm" type="password" placeholder="••••••••" autoComplete="new-password" />
          <Aviso error={estado.error} />
          <SubmitButton pendiente={pendiente}>Guardar contraseña</SubmitButton>
        </form>
      )}
    </div>
  );
}

export function CambiarEmail({ actual }: { actual: string }) {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(cambiarCorreo, {});
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h2 className="font-display text-lg font-extrabold mb-1">Cambiar correo</h2>
      <p className="text-sub text-[13px] mb-4">Actual: <b className="text-text">{actual}</b></p>
      {estado.mensaje ? (
        <Aviso mensaje={estado.mensaje} />
      ) : (
        <form action={formAction} className="space-y-3.5">
          <TextField label="Nuevo correo" name="email" type="email" placeholder="nuevo@correo.com" autoComplete="email" />
          <Aviso error={estado.error} />
          <SubmitButton pendiente={pendiente}>Enviar confirmación</SubmitButton>
        </form>
      )}
    </div>
  );
}
