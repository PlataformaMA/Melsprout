"use client";

import Link from "next/link";
import { useActionState } from "react";
import { crearCuenta, type EstadoAuth } from "@/lib/auth-actions";
import { AuthShell } from "@/components/AuthShell";
import { OAuthButtons, Separador } from "@/components/OAuthButtons";
import { TextField, PasswordField, SubmitButton, Aviso } from "@/components/fields";

export default function RegistroPage() {
  const [estado, formAction, pendiente] = useActionState<EstadoAuth, FormData>(
    crearCuenta,
    {}
  );

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
            <span className="text-accent">términos</span> y el{" "}
            <span className="text-accent">aviso de privacidad</span>.
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-[13px] text-sub cursor-pointer">
          <input
            type="checkbox"
            name="noticias"
            defaultChecked
            className="mt-0.5 w-4 h-4 accent-[#7c3aed]"
          />
          <span>Quiero recibir noticias y recordatorios.</span>
        </label>

        <Aviso error={estado.error} />
        <SubmitButton pendiente={pendiente}>Crear cuenta gratis</SubmitButton>

        <p className="text-[11px] text-hint text-center leading-relaxed">
          🔒 Tu contraseña se guarda cifrada. Nunca la vemos ni la compartimos.
        </p>
      </form>
    </AuthShell>
  );
}
