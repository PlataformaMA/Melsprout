import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ETAPA_1, type ModuloCurso, type Clase } from "@/lib/data";

// Si la clase no tiene portada propia, usamos la miniatura del video de YouTube.
// Evita subir 55 imágenes a mano y se puede sobrescribir desde el admin.
function portadaDe(portada: unknown, videoUrl: unknown): string | null {
  if (typeof portada === "string" && portada.trim()) return portada;
  if (typeof videoUrl !== "string") return null;
  const yt = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : null;
}

// Lee los cursos de la BD con la MISMA forma que ETAPA_1 (ModuloCurso[]).
// Si aún no hay módulos en BD, usa el demo (fallback) para no romper nada.
export async function getCursos(incluirEspeciales = false): Promise<ModuloCurso[]> {
  try {
    const admin = createAdminClient();
    let q = admin
      .from("cursos_modulos")
      .select("*")
      .eq("activo", true);
    // Los cursos especiales viven en su propia seccion: no van en la Ruta ni
    // cuentan para el avance del curso.
    if (!incluirEspeciales) q = q.or("especial.is.null,especial.eq.false");
    const { data: mods } = await q.order("orden", { ascending: true });
    if (!mods || mods.length === 0) return ETAPA_1;

    const { data: clases } = await admin
      .from("cursos_clases")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    return mods.map((m, i) => ({
      id: i + 1,
      nombre: m.nombre as string,
      nivel: (m.nivel as string) || null,
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
          portada: portadaDe(c.portada, c.video_url),
          subtitulos: (c.subtitulos_url as string) || null,
          proximamente: !!c.proximamente,
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
export type ClaseRow = { id: string; modulo_id: string; titulo: string; instructor: string; duracion_min: number; nivel: string; video_url: string | null; reto_texto: string; reto_instrucciones: string; portada: string | null; revision: string; orden: number; activo: boolean; subtitulos_url: string | null; subtitulos_job: string | null };

export async function getCursosAdmin(): Promise<{ modulos: ModuloRow[]; clases: ClaseRow[] }> {
  const admin = createAdminClient();
  const { data: modulos } = await admin.from("cursos_modulos").select("*").order("orden");
  const { data: clases } = await admin.from("cursos_clases").select("*").order("orden");
  return { modulos: (modulos || []) as ModuloRow[], clases: (clases || []) as ClaseRow[] };
}

// ————— Cursos Especiales (patrocinados) —————
export type CursoEspecial = {
  id: string;
  nombre: string;
  descripcion: string;
  portada: string | null;
  patrocinador: string | null;
  patrocinadorLogo: string | null;
  instructor: string;
  clases: Clase[];
  minutos: number;      // duración total
  estudiantes: number;  // cuántas personas ya empezaron alguna clase
  // Datos de la landing de venta (vacíos hasta que se carguen desde admin)
  banner: string | null;
  precio: number | null;
  moneda: string;
  checkoutUrl: string | null;
  aprenderas: string[];
  habilidades: string[];
  herramientas: string[];
  incluye: string | null;
  nivel: string | null;
  semanas: number | null;
  rating: number | null;
  resenas: number | null;
  series: number | null;
};

// Los campos de lista vienen como jsonb: si traen basura, se ignoran.
function lista(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

async function armarEspeciales(filtroId?: string): Promise<CursoEspecial[]> {
  const admin = createAdminClient();
  let q = admin.from("cursos_modulos").select("*").eq("activo", true).eq("especial", true);
  if (filtroId) q = q.eq("id", filtroId);
  const { data: mods } = await q.order("orden", { ascending: true });
  if (!mods || mods.length === 0) return [];

  const { data: clases } = await admin
    .from("cursos_clases")
    .select("*")
    .in("modulo_id", mods.map((m) => m.id as string))
    .eq("activo", true)
    .order("orden", { ascending: true });

  const ids = (clases || []).map((c) => c.id as string);
  // Estudiantes reales: quienes ya tienen progreso en alguna clase del curso.
  const { data: prog } = ids.length
    ? await admin.from("clase_progreso").select("user_id, clase_id").in("clase_id", ids)
    : { data: [] as { user_id: string; clase_id: string }[] };

  return mods.map((m) => {
    const suyas = (clases || []).filter((c) => c.modulo_id === m.id);
    const suyasIds = new Set(suyas.map((c) => c.id as string));
    const alumnos = new Set(
      (prog || []).filter((p) => suyasIds.has(p.clase_id as string)).map((p) => p.user_id as string)
    );
    return {
      id: m.id as string,
      nombre: m.nombre as string,
      descripcion: (m.descripcion as string) || "",
      portada: (m.portada as string) || null,
      patrocinador: (m.patrocinador as string) || null,
      patrocinadorLogo: (m.patrocinador_logo as string) || null,
      instructor: (suyas[0]?.instructor as string) || "Melissa",
      minutos: suyas.reduce((n, c) => n + ((c.duracion_min as number) || 0), 0),
      estudiantes: alumnos.size,
      banner: (m.banner as string) || null,
      precio: m.precio != null ? Number(m.precio) : null,
      moneda: (m.moneda as string) || "MXN",
      checkoutUrl: (m.checkout_url as string) || null,
      aprenderas: lista(m.aprenderas),
      habilidades: lista(m.habilidades),
      herramientas: lista(m.herramientas),
      incluye: (m.incluye as string) || null,
      nivel: (m.nivel as string) || null,
      semanas: (m.semanas as number) ?? null,
      rating: m.rating != null ? Number(m.rating) : null,
      resenas: (m.resenas as number) ?? null,
      series: (m.series as number) ?? null,
      clases: suyas.map((c): Clase => ({
        id: c.id as string,
        titulo: c.titulo as string,
        instructor: (c.instructor as string) || "Melissa",
        duracionMin: (c.duracion_min as number) || 12,
        reto: (c.reto_texto as string) || "",
        revision: ((c.revision as string) || "auto") as Clase["revision"],
        grabada: !!c.video_url,
        portada: portadaDe(c.portada, c.video_url),
        subtitulos: (c.subtitulos_url as string) || null,
      })),
    };
  });
}

export async function getCursosEspeciales(): Promise<CursoEspecial[]> {
  try {
    return await armarEspeciales();
  } catch {
    return [];
  }
}

export async function getCursoEspecial(id: string): Promise<CursoEspecial | null> {
  try {
    const [c] = await armarEspeciales(id);
    return c ?? null;
  } catch {
    return null;
  }
}
