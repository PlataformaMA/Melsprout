import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Cliente de Supabase para el NAVEGADOR (componentes "use client").
// Se usa para el login social (Google/Facebook) que redirige al proveedor.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
