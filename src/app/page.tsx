import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/env";

// Puerta de entrada: si hay sesión, a la app; si no, al login.
export default async function Home() {
  let logueado = false;

  if (SUPABASE_CONFIGURADO) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      logueado = !!user;
    } catch {
      // Sin conexión a Supabase: tratamos como no logueado.
    }
  }

  // redirect() se llama FUERA del try/catch (funciona lanzando una excepción).
  redirect(logueado ? "/app" : "/login");
}
