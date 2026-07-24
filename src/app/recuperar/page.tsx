"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emailValido } from "@/lib/validacion";
import { AuthShell } from "@/components/AuthShell";
import { TextField, SubmitButton, Aviso } from "@/components/fields";

export default function RecuperarPage() {
  const [pendiente, setPendiente] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!emailValido(email)) { setError("Escribe un correo válido."); return; }
    setPendiente(true);
    // Se dispara desde el NAVEGADOR: así el "verificador" de seguridad (PKCE)
    // queda en este mismo navegador y el enlace del correo funciona al regresar.
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setPendiente(false);
    // Respondemos igual exista o no la cuenta (no filtra qué correos están registrados).
    setMensaje("Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Revisa tu bandeja y el spam.");
  }

  return (
    <AuthShell
      titulo="Recupera tu contraseña"
      subtitulo="Te enviamos un enlace para crear una nueva."
      pie={
        <p className="text-center text-[13px] text-sub">
          <Link href="/login" className="text-accent font-semibold">← Volver a iniciar sesión</Link>
        </p>
      }
    >
      {mensaje ? (
        <Aviso mensaje={mensaje} />
      ) : (
        <form onSubmit={enviar} className="space-y-3.5">
          <TextField
            label="Email de tu cuenta"
            name="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          <Aviso error={error} />
          <SubmitButton pendiente={pendiente}>Enviarme el enlace</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
