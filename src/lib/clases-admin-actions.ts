"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

export type EstadoClase = "publicada" | "borrador" | "oculta" | "programada";

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
  publicarAt: string | null;   // si es futura, la clase está programada
  calificacion: number | null;
  votos: number;
  comentarios: number;
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

  const [{ data: clases }, { data: modulos }, { data: recursos }, { data: progreso },
         { data: calif }, { data: coments }] = await Promise.all([
    admin.from("cursos_clases").select("*").order("orden"),
    admin.from("cursos_modulos").select("id, nombre, orden").order("orden"),
    admin.from("recursos").select("clase_id").eq("activo", true),
    admin.from("clase_progreso").select("clase_id, segundos_vistos, completada"),
    admin.from("clase_calificaciones").select("clase_id, estrellas"),
    admin.from("clase_comentarios").select("clase_id").eq("oculto", false),
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

  const califPorClase = new Map<string, number[]>();
  for (const c of calif || []) {
    const k = c.clase_id as string;
    if (!califPorClase.has(k)) califPorClase.set(k, []);
    califPorClase.get(k)!.push((c.estrellas as number) || 0);
  }
  const comentariosPorClase = new Map<string, number>();
  for (const c of coments || []) {
    const k = c.clase_id as string;
    comentariosPorClase.set(k, (comentariosPorClase.get(k) || 0) + 1);
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
      estado: !c.activo
        ? "oculta"
        : c.publicar_at && new Date(c.publicar_at as string).getTime() > Date.now()
          ? "programada"
          : tieneVideo ? "publicada" : "borrador",
      avd,
      iniciaron,
      completaron: v?.hechas ?? 0,
      publicarAt: (c.publicar_at as string) || null,
      calificacion: (() => {
        const xs = califPorClase.get(id);
        if (!xs?.length) return null;
        return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
      })(),
      votos: califPorClase.get(id)?.length ?? 0,
      comentarios: comentariosPorClase.get(id) || 0,
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

// ————— Alta y edición de una clase desde el panel —————
export type ClaseForm = {
  id?: string;
  titulo: string;
  moduloId: string;
  instructor: string;
  instructorRol: string;
  nivel: string;
  duracionMin: number;
  videoUrl: string;
  publicarAt: string;        // "" = sin programar
  portadaDataUrl?: string;   // portada nueva, ya recortada en el navegador
  portadaActual?: string | null;
  activo: boolean;
};

export async function guardarClase(f: ClaseForm): Promise<{ ok: true; id: string } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const titulo = f.titulo?.trim();
  if (!titulo) return { error: "Ponle título a la clase." };
  if (!f.moduloId) return { error: "Elige el mundo al que pertenece." };

  const admin = createAdminClient();

  const fila: Record<string, unknown> = {
    titulo,
    modulo_id: f.moduloId,
    instructor: f.instructor?.trim() || "Melissa",
    instructor_rol: f.instructorRol?.trim() || null,
    nivel: f.nivel?.trim() || null,
    duracion_min: Number(f.duracionMin) || 0,
    video_url: f.videoUrl?.trim() || null,
    publicar_at: f.publicarAt ? new Date(f.publicarAt).toISOString() : null,
    activo: f.activo,
  };

  let id = f.id;
  if (id) {
    const { error } = await admin.from("cursos_clases").update(fila).eq("id", id);
    if (error) return { error: "No se pudo guardar la clase." };
  } else {
    const { data: max } = await admin.from("cursos_clases")
      .select("orden").eq("modulo_id", f.moduloId).order("orden", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await admin.from("cursos_clases")
      .insert({ ...fila, orden: ((max?.orden as number) || 0) + 1, reto_texto: "", reto_instrucciones: "" })
      .select("id").single();
    if (error || !data) return { error: "No se pudo crear la clase." };
    id = data.id as string;
  }

  // La portada va al bucket público de recursos de retos.
  if (f.portadaDataUrl?.startsWith("data:image/")) {
    const coma = f.portadaDataUrl.indexOf(",");
    const bytes = Buffer.from(f.portadaDataUrl.slice(coma + 1), "base64");
    const ruta = `portadas/${id}.jpg`;
    const { error: eSub } = await admin.storage.from("retos")
      .upload(ruta, bytes, { contentType: "image/jpeg", upsert: true });
    if (!eSub) {
      const { data: pub } = admin.storage.from("retos").getPublicUrl(ruta);
      await admin.from("cursos_clases").update({ portada: `${pub.publicUrl}?v=${Date.now()}` }).eq("id", id);
    }
  }

  return { ok: true, id: id as string };
}

export async function borrarClaseAdmin(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("cursos_clases").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar (¿tiene progreso o retos?)." };
  return { ok: true };
}

// ————— Recursos descargables de una clase —————
export async function subirRecurso(
  claseId: string, nombre: string, dataUrl: string
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  if (!dataUrl.startsWith("data:")) return { error: "Archivo no válido." };

  const admin = createAdminClient();
  const coma = dataUrl.indexOf(",");
  const tipoMime = dataUrl.slice(5, dataUrl.indexOf(";"));
  const bytes = Buffer.from(dataUrl.slice(coma + 1), "base64");
  if (bytes.length > 25 * 1024 * 1024) return { error: "El archivo pasa de 25 MB." };

  const limpio = nombre.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const ruta = `clases/${claseId}/${Date.now()}-${limpio}`;
  const { error: eSub } = await admin.storage.from("retos")
    .upload(ruta, bytes, { contentType: tipoMime || "application/octet-stream", upsert: false });
  if (eSub) return { error: "No se pudo subir el archivo." };

  const { data: pub } = admin.storage.from("retos").getPublicUrl(ruta);
  const { data: max } = await admin.from("recursos")
    .select("orden").eq("clase_id", claseId).order("orden", { ascending: false }).limit(1).maybeSingle();

  const { error } = await admin.from("recursos").insert({
    clase_id: claseId,
    titulo: nombre.slice(0, 120),
    tipo: tipoMime?.split("/")[1]?.toUpperCase() || "Archivo",
    url: pub.publicUrl,
    peso: `${(bytes.length / 1024 / 1024).toFixed(1)} MB`,
    orden: ((max?.orden as number) || 0) + 1,
    activo: true,
  });
  if (error) return { error: "Se subió el archivo pero no se pudo registrar." };
  return { ok: true };
}

export async function borrarRecurso(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("recursos").update({ activo: false }).eq("id", id);
  if (error) return { error: "No se pudo quitar." };
  return { ok: true };
}
