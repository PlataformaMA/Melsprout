import "server-only"; // Falla el build si esto se importa en el navegador.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";

// Cliente ADMINISTRADOR (usa la Secret key). Se salta la seguridad a nivel fila,
// así que SOLO se usa en el servidor y para operaciones muy puntuales
// (guardar/verificar códigos de respaldo y quitar el 2FA en una recuperación).
export function createAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. Los códigos de respaldo no están configurados."
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
