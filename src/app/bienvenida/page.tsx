import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/env";
import { Octi } from "@/components/Octi";
import { LogoMarca } from "@/components/LogoMarca";

// Pantalla de bienvenida (primer contacto). Si ya hay sesión, entra a la app.
export default async function BienvenidaPage() {
  if (SUPABASE_CONFIGURADO) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) redirect("/app");
    } catch { /* sin conexión: mostramos la bienvenida */ }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-8 bg-bg">
      <div className="mt-3">
        <LogoMarca />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full">
        <Octi size={200} conBurbuja={false} />
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-6 leading-tight">
          La manera divertida de empezar a crear!
        </h1>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-4">
        <Link href="/registro"
          className="block w-full bg-accent text-white font-bold text-center rounded-2xl py-3.5 text-[14px] uppercase tracking-wide shadow-lg shadow-accent/25 hover:brightness-110 active:scale-[0.99] transition">
          Empezar
        </Link>
        <Link href="/login"
          className="block w-full bg-surface border border-border text-accent font-bold text-center rounded-2xl py-3.5 text-[14px] uppercase tracking-wide hover:bg-bg transition">
          Ya tengo una cuenta
        </Link>
      </div>
    </main>
  );
}
