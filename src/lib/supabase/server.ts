import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Cliente de Supabase para el SERVIDOR (Server Components, Server Actions y
// Route Handlers). Guarda la sesión en cookies httpOnly (no accesibles desde
// JavaScript del navegador = mucho más seguro contra robo de sesión).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Llamado desde un Server Component: lo maneja el proxy al refrescar.
        }
      },
    },
  });
}
