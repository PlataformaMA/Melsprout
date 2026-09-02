"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

export type EstadoClase = "publicada" | "borrador" | "oculta";

export type ClaseAdmin = {
  id: string;
  orden: number;
  titulo: string;
  portada: string | null;
  instructor: string;
  instructorRol: string | null;
  nivel: string | null;
  moduloId: string;
  mundo: string;
  duracionMin: number;
  recursos: number;
  tieneVideo: boolean;
  tieneSubtitulos: boolean;
  estado: EstadoClase;
  avd: number;            // % promedio visto de quienes la abrieron
  iniciaron: number;
  completaron: number;
};

export type MundoAdmin = { id: string; nombre: string; orden: number };

async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

// Todas las clases con lo que la tabla del panel necesita mostrar.
export async function listarClasesAdmin(): Promise<{ clases: ClaseAdmin[]; mundos: MundoAdmin[] }> {
  if (!(await soyAdmin())) return { clases: [], mundos: [] };
  const admin = createAdminClient();

  const [{ data: clases }, { data: modulos }, { data: recursos }, { data: progreso }] = await Promise.all([
    admin.from("cursos_clases").select("*").order("orden"),
    admin.from("cursos_modulos").select("id, nombre, orden").order("orden"),
    admin.from("recursos").select("clase_id").eq("activo", true),
    admin.from("clase_progreso").select("clase_id, segundos_vistos, completada"),
  ]);

  const nombreModulo = new Map((modulos || []).map((m) => [m.id as string, m.nombre as string]));
  const recursosPorClase = new Map<string, number>();
  for (const r of recursos || []) {
    const c = r.clase_id as string;
    recursosPorClase.set(c, (recursosPorClase.get(c) || 0) + 1);
  }

  const vistoPorClase = new Map<string, { seg: number[]; hechas: number }>();
  for (const p of progreso || []) {
    const c = p.clase_id as string;
    if (!vistoPorClase.has(c)) vistoPorClase.set(c, { seg: [], hechas: 0 });
    const v = vistoPorClase.get(c)!;
    v.seg.push((p.segundos_vistos as number) || 0);
    if (p.completada) v.hechas++;
  }

  const salida: ClaseAdmin[] = (clases || []).map((c, i) => {
    const id = c.id as string;
    const dur = (c.duracion_min as number) || 0;
    const v = vistoPorClase.get(id);
    const iniciaron = v?.seg.length ?? 0;
    const promedio = iniciaron ? v!.seg.reduce((a, b) => a + b, 0) / iniciaron : 0;
    const avd = dur > 0 && iniciaron ? Math.min(100, Math.round((promedio / (dur * 60)) * 100)) : 0;
    const tieneVideo = !!c.video_url;

    return {
      id,
      orden: (c.orden as number) ?? i + 1,
      titulo: c.titulo as string,
      portada: (c.portada as string) || null,
      instructor: (c.instructor as string) || "Melissa",
      instructorRol: (c.instructor_rol as string) || null,
      nivel: (c.nivel as string) || null,
      moduloId: c.modulo_id as string,
      mundo: nombreModulo.get(c.modulo_id as string) || "—",
      duracionMin: dur,
      recursos: recursosPorClase.get(id) || 0,
      tieneVideo,
      tieneSubtitulos: !!c.subtitulos_url,
      estado: !c.activo ? "oculta" : tieneVideo ? "publicada" : "borrador",
      avd,
      iniciaron,
      completaron: v?.hechas ?? 0,
    };
  });

  return {
    clases: salida,
    mundos: (modulos || []).map((m) => ({
      id: m.id as string, nombre: m.nombre as string, orden: (m.orden as number) ?? 0,
    })),
  };
}

// Mostrar u ocultar una clase de la plataforma.
export async function alternarVisibilidad(claseId: string, visible: boolean): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("cursos_clases").update({ activo: visible }).eq("id", claseId);
  if (error) return { error: "No se pudo cambiar." };
  return { ok: true };
}

export type RecursoClase = { id: string; titulo: string; tipo: string | null; url: string | null; peso: string | null };

// Los recursos de una clase, para el detalle.
export async function recursosDeClase(claseId: string): Promise<RecursoClase[]> {
  if (!(await soyAdmin())) return [];
  const admin = createAdminClient();
  const { data } = await admin.from("recursos")
    .select("id, titulo, tipo, url, archivo, peso").eq("clase_id", claseId).eq("activo", true).order("orden");
  return (data || []).map((r) => ({
    id: r.id as string,
    titulo: (r.titulo as string) || "Recurso",
    tipo: (r.tipo as string) || null,
    url: (r.url as string) || (r.archivo as string) || null,
    peso: (r.peso as string) || null,
  }));
}

// Exportar el listado de clases a CSV.
export async function exportarClases(): Promise<{ csv: string; nombre: string } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const { clases } = await listarClasesAdmin();
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const filas = [
    ["#", "Clase", "Mundo", "Nivel", "Instructor", "Duración (min)", "Recursos", "Estado", "AVD %", "Iniciaron", "Completaron"],
    ...clases.map((c) => [
      c.orden, c.titulo, c.mundo, c.nivel || "", c.instructor, c.duracionMin,
      c.recursos, c.estado, c.avd, c.iniciaron, c.completaron,
    ]),
  ];
  return {
    csv: filas.map((f) => f.map(esc).join(",")).join("\n"),
    nombre: `clases-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}
