import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Clase } from "@/lib/data";

// Los cursos especiales (BYW) se llevan en orden: una clase se abre cuando la
// anterior ya se terminó. Las clases "Próximamente" no cortan la cadena.

/** Todo lo que el alumno puede abrir de un curso especial: el orden por
 *  módulos, más lo que ya venía trabajando (clases empezadas o con reto
 *  entregado), para no cerrarle la puerta a nadie que ya iba avanzando. */
export async function abiertasDelCurso(
  userId: string,
  clases: Clase[],
  completadas: Set<string>,
): Promise<Set<string>> {
  const ids = clases.map((c) => c.id);
  const [retos, empezadas] = await Promise.all([
    retosEntregados(userId, ids),
    clasesEmpezadas(userId, ids),
  ]);
  const terminadas = new Set([...ids.filter((id) => completadas.has(id)), ...retos]);
  return new Set([...abiertasEnOrden(clases, terminadas), ...empezadas]);
}

/** Clases donde ya hay tiempo visto (aunque no las haya terminado). */
export async function clasesEmpezadas(userId: string, claseIds: string[]): Promise<Set<string>> {
  if (claseIds.length === 0) return new Set();
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("clase_progreso")
      .select("clase_id, segundos_vistos, completada")
      .eq("user_id", userId)
      .in("clase_id", claseIds);
    return new Set(
      (data ?? [])
        .filter((r) => r.completada || (r.segundos_vistos as number) > 0)
        .map((r) => r.clase_id as string),
    );
  } catch {
    return new Set();
  }
}

/** Clases con reto ya entregado (cuentan como terminadas aunque el video no se
 *  haya registrado: el reto va después de ver la clase). */
export async function retosEntregados(userId: string, claseIds: string[]): Promise<Set<string>> {
  if (claseIds.length === 0) return new Set();
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reto_submissions")
      .select("reto_id, estado, revision")
      .eq("user_id", userId)
      .in("reto_id", claseIds);
    return new Set(
      (data ?? [])
        .filter((r) => r.estado === "publicado" || r.revision === "aprobado")
        .map((r) => r.reto_id as string),
    );
  } catch {
    return new Set();
  }
}

/** Ids de las clases que el alumno puede abrir. Dentro de cada módulo van en
 *  orden (una se abre al terminar la anterior), pero la PRIMERA clase de cada
 *  módulo está siempre abierta: así nadie se queda atorado y puede pasar al
 *  módulo siguiente. Lo que ya terminó se queda abierto siempre. */
export function abiertasEnOrden(clases: Clase[], terminadas: Set<string>): Set<string> {
  const abiertas = new Set<string>();
  let seccion: string | null | undefined;
  let anteriorLista = true; // arranque de módulo: la primera siempre se abre
  for (const c of clases) {
    if (c.seccion !== seccion) { seccion = c.seccion; anteriorLista = true; }
    if (c.proximamente || !c.grabada) continue; // aún no existe; no corta la fila
    if (anteriorLista || terminadas.has(c.id)) abiertas.add(c.id);
    anteriorLista = terminadas.has(c.id);
  }
  return abiertas;
}
