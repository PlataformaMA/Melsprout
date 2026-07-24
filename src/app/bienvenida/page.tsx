import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/env";

// Pantalla de bienvenida OCULTA por ahora: siempre manda al login
// (o a la app si ya hay sesión). El diseño anterior está en el historial de git
// por si se quiere reactivar más adelante.
export default async function BienvenidaPage() {
  let logueado = false;
  if (SUPABASE_CONFIGURADO) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      logueado = !!user;
    } catch {
      // Sin conexión: cae al login.
    }
  }
  // redirect() se llama FUERA del try/catch (lanza una excepción especial).
  redirect(logueado ? "/app" : "/login");
}
