"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { getCursos } from "@/lib/cursos-db";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { abiertasEnOrden, abiertasDelCurso } from "@/lib/secuencia";
import { todoDesbloqueado } from "@/lib/ajustes";

// Buscar una clase por nombre, sin recorrer todo el camino a mano.
//
// Solo devuelve lo que esa persona puede ver: su Ruta y los cursos especiales
// que compró. Las clases que todavía no le tocan salen, pero marcadas con
// candado, para que sepa que existen y qué le falta para llegar.
export type ClaseEncontrada = {
  id: string;
  titulo: string;
  modulo: string;
  // "Ruta de aprendizaje" o el nombre del curso especial.
  donde: string;
  href: string;
  abierta: boolean;
  completada: boolean;
};

export async function buscarClases(texto: string): Promise<ClaseEncontrada[]> {
  const q = texto.trim().toLowerCase();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const soyDelEquipo = await esAdminUsuario(user.id, user.email);
  const [cursos, completadas] = await Promise.all([
    getCursos(true),
    getClasesCompletadas(),
  ]);

  // Los cursos especiales solo se buscan si se compraron.
  const admin = createAdminClient();
  const { data: accesos } = await admin
    .from("curso_accesos").select("modulo_id").eq("user_id", user.id);
  const mios = new Set((accesos || []).map((a) => a.modulo_id as string));

  const rutaAbierta = soyDelEquipo || (await todoDesbloqueado());

  // La Ruta: una sola secuencia, módulo tras módulo.
  const deLaRuta = cursos.filter((m) => !m.especialId);
  const clasesRuta = deLaRuta.flatMap((m) => m.clases.filter((c) => !c.proximamente));
  const abiertasRuta = rutaAbierta
    ? new Set(clasesRuta.map((c) => c.id))
    : abiertasEnOrden(clasesRuta, completadas);

  const out: ClaseEncontrada[] = [];

  for (const m of deLaRuta) {
    for (const c of m.clases) {
      if (!c.titulo.toLowerCase().includes(q)) continue;
      out.push({
        id: c.id,
        titulo: c.titulo,
        modulo: m.nombre,
        donde: "Ruta de aprendizaje",
        href: `/app/clase/${c.id}`,
        abierta: abiertasRuta.has(c.id) || completadas.has(c.id),
        completada: completadas.has(c.id),
      });
    }
  }

  for (const m of cursos) {
    if (!m.especialId || !(soyDelEquipo || mios.has(m.especialId))) continue;
    const coinciden = m.clases.filter((c) => c.titulo.toLowerCase().includes(q));
    if (!coinciden.length) continue;
    const abiertas = soyDelEquipo
      ? new Set(m.clases.map((c) => c.id))
      : await abiertasDelCurso(user.id, m.clases, completadas);
    for (const c of coinciden) {
      out.push({
        id: c.id,
        titulo: c.titulo,
        modulo: m.nombre,
        donde: m.nombre,
        href: `/app/clase/${c.id}`,
        abierta: abiertas.has(c.id) || completadas.has(c.id),
        completada: completadas.has(c.id),
      });
    }
  }

  // Lo que ya puede ver, primero: es a lo que de verdad puede entrar.
  return out.sort((a, b) => Number(b.abierta) - Number(a.abierta)).slice(0, 25);
}
