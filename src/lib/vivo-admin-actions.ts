"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

export type EstadoVivo = "programada" | "en_vivo" | "terminada" | "borrador";

export type ClaseVivoAdmin = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string | null;
  instructor: string;
  instructorRol: string | null;
  nivel: string | null;
  moduloId: string | null;
  mundo: string | null;
  iniciaAt: string;
  duracionMin: number;
  zonaHoraria: string;
  portada: string | null;
  streamUrl: string | null;
  grabacionUrl: string | null;
  xp: number;
  activo: boolean;
  estado: EstadoVivo;
  recursos: number;
  asistentes: number;
};


async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

export async function listarVivoAdmin(): Promise<{
  clases: ClaseVivoAdmin[]; mundos: { id: string; nombre: string }[];
}> {
  if (!(await soyAdmin())) return { clases: [], mundos: [] };
  const admin = createAdminClient();

  const [{ data: clases }, { data: modulos }, { data: recursos }, { data: asist }] = await Promise.all([
    admin.from("clases_vivo").select("*").order("inicia_at", { ascending: false }),
    admin.from("cursos_modulos").select("id, nombre, orden").order("orden"),
    admin.from("recursos").select("clase_vivo_id").eq("activo", true).not("clase_vivo_id", "is", null),
    admin.from("asistencias_vivo").select("clase_vivo_id"),
  ]);

  const nombreModulo = new Map((modulos || []).map((m) => [m.id as string, m.nombre as string]));
  const recPor = new Map<string, number>();
  for (const r of recursos || []) {
    const k = r.clase_vivo_id as string;
    recPor.set(k, (recPor.get(k) || 0) + 1);
  }
  const asisPor = new Map<string, number>();
  for (const a of asist || []) {
    const k = a.clase_vivo_id as string;
    asisPor.set(k, (asisPor.get(k) || 0) + 1);
  }

  return {
    clases: (clases || []).map((c) => {
      const id = c.id as string;
      const ini = new Date(c.inicia_at as string).getTime();
      const fin = ini + ((c.duracion_min as number) || 60) * 60000;
      const ahora = Date.now();
      const estado: EstadoVivo = !c.activo
        ? "borrador"
        : ahora >= ini && ahora <= fin ? "en_vivo"
        : ahora < ini ? "programada" : "terminada";

      return {
        id,
        titulo: c.titulo as string,
        descripcion: (c.descripcion as string) || "",
        categoria: (c.categoria as string) || null,
        instructor: (c.instructor as string) || "Melissa",
        instructorRol: (c.instructor_rol as string) || null,
        nivel: (c.nivel as string) || null,
        moduloId: (c.modulo_id as string) || null,
        mundo: c.modulo_id ? nombreModulo.get(c.modulo_id as string) || null : null,
        iniciaAt: c.inicia_at as string,
        duracionMin: (c.duracion_min as number) || 60,
        zonaHoraria: (c.zona_horaria as string) || "America/Mexico_City",
        portada: (c.thumbnail_url as string) || null,
        streamUrl: (c.stream_url as string) || null,
        grabacionUrl: (c.grabacion_url as string) || null,
        xp: (c.xp as number) ?? 50,
        activo: c.activo !== false,
        estado,
        recursos: recPor.get(id) || 0,
        asistentes: asisPor.get(id) || 0,
      };
    }),
    mundos: (modulos || []).map((m) => ({ id: m.id as string, nombre: m.nombre as string })),
  };
}

export type VivoForm = {
  id?: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  instructor: string;
  instructorRol: string;
  nivel: string;
  moduloId: string;
  fecha: string;          // AAAA-MM-DD
  hora: string;           // HH:MM
  duracionMin: number;
  zonaHoraria: string;
  streamUrl: string;
  grabacionUrl: string;
  xp: number;
  activo: boolean;
  portadaDataUrl?: string;
};

export async function guardarVivo(f: VivoForm): Promise<{ ok: true; id: string } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  if (!f.titulo.trim()) return { error: "Ponle título a la clase." };
  if (!f.fecha || !f.hora) return { error: "Falta la fecha o la hora." };
  if (f.activo && !f.streamUrl.trim()) return { error: "Para publicarla necesitas el enlace de la clase." };

  const admin = createAdminClient();
  const fila: Record<string, unknown> = {
    titulo: f.titulo.trim(),
    descripcion: f.descripcion.trim() || null,
    categoria: f.categoria.trim() || null,
    instructor: f.instructor.trim() || "Melissa",
    instructor_rol: f.instructorRol.trim() || null,
    nivel: f.nivel.trim() || null,
    modulo_id: f.moduloId || null,
    inicia_at: new Date(`${f.fecha}T${f.hora}`).toISOString(),
    duracion_min: Number(f.duracionMin) || 60,
    zona_horaria: f.zonaHoraria || "America/Mexico_City",
    stream_url: f.streamUrl.trim() || null,
    grabacion_url: f.grabacionUrl.trim() || null,
    xp: Number(f.xp) || 50,
    activo: f.activo,
  };

  let id = f.id;
  if (id) {
    const { error } = await admin.from("clases_vivo").update(fila).eq("id", id);
    if (error) return { error: "No se pudo guardar la clase." };
  } else {
    const { data, error } = await admin.from("clases_vivo").insert(fila).select("id").single();
    if (error || !data) return { error: "No se pudo crear la clase." };
    id = data.id as string;
  }

  if (f.portadaDataUrl?.startsWith("data:image/")) {
    const coma = f.portadaDataUrl.indexOf(",");
    const bytes = Buffer.from(f.portadaDataUrl.slice(coma + 1), "base64");
    const ruta = `vivo/${id}.jpg`;
    const { error: eSub } = await admin.storage.from("retos")
      .upload(ruta, bytes, { contentType: "image/jpeg", upsert: true });
    if (!eSub) {
      const { data: pub } = admin.storage.from("retos").getPublicUrl(ruta);
      await admin.from("clases_vivo").update({ thumbnail_url: `${pub.publicUrl}?v=${Date.now()}` }).eq("id", id);
    }
  }
  return { ok: true, id: id as string };
}

export async function borrarVivo(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("clases_vivo").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar (¿tiene asistencias?)." };
  return { ok: true };
}

export async function exportarVivo(): Promise<{ csv: string; nombre: string } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const { clases } = await listarVivoAdmin();
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const filas = [
    ["Clase", "Instructor", "Fecha", "Duración (min)", "Mundo", "Nivel", "Estado", "Asistentes", "Recursos"],
    ...clases.map((c) => [
      c.titulo, c.instructor, new Date(c.iniciaAt).toLocaleString("es-MX"),
      c.duracionMin, c.mundo || "", c.nivel || "", c.estado, c.asistentes, c.recursos,
    ]),
  ];
  return {
    csv: filas.map((f) => f.map(esc).join(",")).join("\n"),
    nombre: `clases-en-vivo-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}
