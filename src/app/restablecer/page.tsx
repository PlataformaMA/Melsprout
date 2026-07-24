"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { evaluarPassword } from "@/lib/validacion";
import { AuthShell } from "@/components/AuthShell";
import { PasswordField, SubmitButton, Aviso } from "@/components/fields";

// Se llega desde el enlace del correo. Todo del lado del navegador: canjeamos el
// enlace por una sesión de recuperación y guardamos la nueva contraseña.
export default function RestablecerPage() {
  const [supabase] = useState(() =>
    createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { detectSessionInUrl: false } })
  );
  const [estado, setEstado] = useState<"validando" | "listo" | "malo">("validando");
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        setEstado(error ? "malo" : "listo");
        return;
      }
      const { data } = await supabase.auth.getSession();
      setEstado(data.session ? "listo" : "malo");
    })();
  }, [supabase]);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const fuerza = evaluarPassword(password);
    if (!fuerza.cumpleMinimo) { setError(`Tu contraseña necesita: ${fuerza.faltantes.join(", ")}.`); return; }
    setPendiente(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPendiente(false);
    if (error) { setError("No se pudo guardar. Intenta de nuevo."); return; }
    setOk(true);
    setTimeout(() => { window.location.href = "/app"; }, 900);
  }

  return (
    <AuthShell titulo="Crea una nueva contraseña" subtitulo="Elige una contraseña segura para tu cuenta.">
      {estado === "validando" ? (
        <p className="text-sub text-sm text-center py-3">Validando el enlace…</p>
      ) : estado === "malo" ? (
        <div className="space-y-3">
          <Aviso error="El enlace no es válido o ya expiró. Pide uno nuevo." />
          <Link href="/recuperar" className="block text-center text-accent font-semibold text-[14px]">Pedir un enlace nuevo</Link>
        </div>
      ) : ok ? (
        <Aviso mensaje="¡Contraseña actualizada! Entrando…" />
      ) : (
        <form onSubmit={guardar} className="space-y-3.5">
          <PasswordField label="Nueva contraseña" autoComplete="new-password" placeholder="Crea una contraseña segura" medidor />
          <Aviso error={error} />
          <SubmitButton pendiente={pendiente}>Guardar y entrar</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
