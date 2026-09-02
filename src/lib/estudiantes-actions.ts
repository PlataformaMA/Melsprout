"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";
import { nivelPorXP } from "@/lib/data";

export type EstadoAlumna = "activo" | "inactivo" | "riesgo" | "certificado";

export type Estudiante = {
  id: string;
  nombre: string;
  email: string | null;
  avatar: string | null;
  nivel: string;
  nivelNum: number;
  porRevisar: number;      // retos suyos esperando revisión
  estado: EstadoAlumna;
  mundo: string | null;    // módulo en el que va
  progreso: number;        // % de clases completadas
  xp: number;
  clasesHechas: number;
  clasesTotal: number;
  racha: number;
  ultimaActividad: string | null;
  renovacion: boolean | null;
  notas: string | null;
  pais: string | null;
  edad: number | null;
  miembroDesde: string;
  certificado: boolean;
  experiencia: string | null;   // lo que contestó en el onboarding
};

const DIA = 864e5;

async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

function edadDe(fecha: unknown): number | null {
  if (typeof fecha !== "string" || !fecha) return null;
  const n = new Date(fecha);
  if (Number.isNaN(n.getTime())) return null;
  const hoy = new Date();
  let a = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) a--;
  return a > 0 && a < 120 ? a : null;
}

// La tabla de estudiantes del panel, con todo lo que muestra cada columna.
export async function listarEstudiantes(): Promise<Estudiante[]> {
  if (!(await soyAdmin())) return [];
  const admin = createAdminClient();

  const [{ data: perfiles }, { data: progreso }, { data: subs }, { data: clases }, { data: modulos }] =
    await Promise.all([
      admin.from("profiles")
        .select("id, full_name, avatar_url, xp, racha, pais, fecha_nacimiento, created_at, ultima_actividad, notas_equipo, renovacion, experiencia")
        .eq("onboarding_completo", true)
        .order("xp", { ascending: false }),
      admin.from("clase_progreso").select("user_id, clase_id, completada"),
      admin.from("reto_submissions").select("user_id, estado, revision"),
      admin.from("cursos_clases").select("id, modulo_id, orden").eq("activo", true).order("orden"),
      admin.from("cursos_modulos").select("id, nombre, orden").eq("activo", true).order("orden"),
    ]);

  // Correos: viven en auth, no en el perfil.
  const { data: auth } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const correo = new Map((auth?.users || []).map((u) => [u.id, u.email ?? null]));

  const clasesTotal = (clases || []).length;
  const moduloDe = new Map((clases || []).map((c) => [c.id as string, c.modulo_id as string]));
  const nombreModulo = new Map((modulos || []).map((m) => [m.id as string, m.nombre as string]));
  const ordenClase = new Map((clases || []).map((c, i) => [c.id as string, i]));

  const hechasPorUsuario = new Map<string, Set<string>>();
  for (const p of progreso || []) {
    if (!p.completada) continue;
    const u = p.user_id as string;
    if (!hechasPorUsuario.has(u)) hechasPorUsuario.set(u, new Set());
    hechasPorUsuario.get(u)!.add(p.clase_id as string);
  }

  const pendientesPorUsuario = new Map<string, number>();
  for (const s of subs || []) {
    if (s.estado !== "publicado" || s.revision !== "pendiente") continue;
    const u = s.user_id as string;
    pendientesPorUsuario.set(u, (pendientesPorUsuario.get(u) || 0) + 1);
  }

  return (perfiles || []).map((p) => {
    const id = p.id as string;
    const hechas = hechasPorUsuario.get(id) ?? new Set<string>();
    const xp = (p.xp as number) || 0;
    const nivel = nivelPorXP(xp).actual;

    // El mundo actual es el módulo de la última clase que terminó.
    let mundo: string | null = null;
    let ultimaOrden = -1;
    for (const cid of hechas) {
      const o = ordenClase.get(cid) ?? -1;
      if (o > ultimaOrden) { ultimaOrden = o; mundo = nombreModulo.get(moduloDe.get(cid) || "") || null; }
    }
    if (!mundo && modulos?.length) mundo = modulos[0].nombre as string;

    const ult = (p.ultima_actividad as string) || null;
    const desde = ult ? Date.now() - new Date(ult).getTime() : Infinity;
    const certificado = clasesTotal > 0 && hechas.size >= clasesTotal;
    const estado: EstadoAlumna = certificado
      ? "certificado"
      : desde <= 7 * DIA ? "activo"
      : desde <= 30 * DIA ? "inactivo"
      : "riesgo";

    return {
      id,
      nombre: (p.full_name as string) || "Sin nombre",
      email: correo.get(id) ?? null,
      avatar: (p.avatar_url as string) || null,
      nivel: nivel.nombre,
      nivelNum: nivel.nivel,
      porRevisar: pendientesPorUsuario.get(id) || 0,
      estado,
      mundo,
      progreso: clasesTotal ? Math.round((hechas.size / clasesTotal) * 100) : 0,
      xp,
      clasesHechas: hechas.size,
      clasesTotal,
      racha: (p.racha as number) || 0,
      ultimaActividad: ult,
      renovacion: (p.renovacion as boolean | null) ?? null,
      notas: (p.notas_equipo as string) || null,
      pais: (p.pais as string) || null,
      edad: edadDe(p.fecha_nacimiento),
      miembroDesde: p.created_at as string,
      certificado,
      experiencia: (p.experiencia as string) || null,
    };
  });
}

export async function guardarNotas(userId: string, notas: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles")
    .update({ notas_equipo: notas.trim().slice(0, 2000) || null }).eq("id", userId);
  if (error) return { error: "No se pudo guardar la nota." };
  return { ok: true };
}

export async function setRenovacion(userId: string, valor: boolean | null): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ renovacion: valor }).eq("id", userId);
  if (error) return { error: "No se pudo guardar." };
  return { ok: true };
}
