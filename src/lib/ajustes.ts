import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Ajustes de la plataforma que se cambian desde el panel, sin desplegar.
export async function getAjuste<T>(clave: string, porDefecto: T): Promise<T> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("ajustes_plataforma").select("valor").eq("clave", clave).maybeSingle();
    return data ? (data.valor as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

// ¿Están todas las clases abiertas? (mientras se termina de grabar el curso)
export async function todoDesbloqueado(): Promise<boolean> {
  return getAjuste<boolean>("todo_desbloqueado", true);
}
