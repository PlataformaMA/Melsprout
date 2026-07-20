import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ETAPA_1, type ModuloCurso, type Clase } from "@/lib/data";

// Lee los cursos de la BD con la MISMA forma que ETAPA_1 (ModuloCurso[]).
// Si aún no hay módulos en BD, usa el demo (fallback) para no romper nada.
export async function getCursos(): Promise<ModuloCurso[]> {
  try {
    const admin = createAdminClient();
    const { data: mods } = await admin
      .from("cursos_modulos")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (!mods || mods.length === 0) return ETAPA_1;

    const { data: clases } = await admin
      .from("cursos_clases")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    return mods.map((m, i) => ({
      id: i + 1,
      nombre: m.nombre as string,
      descripcion: (m.descripcion as string) || "",
      color: ((m.color as string) || "accent") as ModuloCurso["color"],
      clases: (clases || [])
        .filter((c) => c.modulo_id === m.id)
        .map((c): Clase => ({
          id: c.id as string,
          titulo: c.titulo as string,
          instructor: (c.instructor as string) || "Melissa",
          duracionMin: (c.duracion_min as number) || 12,
          reto: (c.reto_texto as string) || "",
          revision: ((c.revision as string) || "auto") as Clase["revision"],
          grabada: !!c.video_url,
        })),
    }));
  } catch {
    return ETAPA_1;
  }
}

// Video de una clase (para el reproductor).
export async function getVideoClaseDB(claseId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("cursos_clases").select("video_url").eq("id", claseId).maybeSingle();
    return (data?.video_url as string) || null;
  } catch {
    return null;
  }
}

// Datos crudos para el panel admin (con ids reales para editar).
export type ModuloRow = { id: string; nombre: string; descripcion: string; color: string; orden: number; activo: boolean };
export type ClaseRow = { id: string; modulo_id: string; titulo: string; instructor: string; duracion_min: number; nivel: string; video_url: string | null; reto_texto: string; revision: string; orden: number; activo: boolean };

export async function getCursosAdmin(): Promise<{ modulos: ModuloRow[]; clases: ClaseRow[] }> {
  const admin = createAdminClient();
  const { data: modulos } = await admin.from("cursos_modulos").select("*").order("orden");
  const { data: clases } = await admin.from("cursos_clases").select("*").order("orden");
  return { modulos: (modulos || []) as ModuloRow[], clases: (clases || []) as ClaseRow[] };
}
