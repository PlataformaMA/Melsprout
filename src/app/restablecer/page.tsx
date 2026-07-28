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
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const password2 = String(fd.get("password2") ?? "");
    const fuerza = evaluarPassword(password);
    if (!fuerza.cumpleMinimo) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    setPendiente(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setPendiente(false); setError("No se pudo guardar. Intenta de nuevo."); return; }
    // Cerramos la sesión de recuperación para que inicie sesión con su nueva contraseña.
    await supabase.auth.signOut();
    setPendiente(false);
    setOk(true);
  }

  // ——— Pantalla 5: "¡Contraseña actualizada!" ———
  if (ok) {
    return (
      <AuthShell titulo="" subtitulo="">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-green/15 grid place-items-center mb-5">
            <span className="w-16 h-16 rounded-full bg-green grid place-items-center text-white text-3xl">✓</span>
          </div>
          <h2 className="font-display text-2xl font-extrabold text-text">¡Contraseña actualizada!</h2>
          <p className="text-sub text-sm mt-3">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link href="/login"
            className="mt-7 w-full rounded-xl bg-accent text-white font-bold py-3 text-sm hover:brightness-110 transition">
            Ir al login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell titulo="Crea una nueva contraseña" subtitulo="Ingresa tu nueva contraseña.">
      {estado === "validando" ? (
        <p className="text-sub text-sm text-center py-3">Validando el enlace…</p>
      ) : estado === "malo" ? (
        <div className="space-y-3">
          <Aviso error="El enlace no es válido o ya expiró. Pide uno nuevo." />
          <Link href="/recuperar" className="block text-center text-accent font-semibold text-[14px]">Pedir un enlace nuevo</Link>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-3.5">
          <PasswordField label="Nueva contraseña" name="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" medidor />
          <PasswordField label="Confirmar nueva contraseña" name="password2" autoComplete="new-password" placeholder="Repite tu contraseña" />
          <Aviso error={error} />
          <SubmitButton pendiente={pendiente}>Guardar nueva contraseña</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
