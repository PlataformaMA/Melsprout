"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { correosDeUsuarios } from "@/lib/usuarios-auth";
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
  fechaNacimiento: string | null;  // YYYY-MM-DD
  miembroDesde: string;
  certificado: boolean;
  experiencia: string | null;   // lo que contestó en el onboarding
  cursos: string[];             // cursos especiales a los que tiene acceso (comprados o dados)
  onboarding: boolean;          // false = compró pero aún no entra a la app
  avance: AvanceCurso[];        // en qué va dentro de cada curso especial
};

// Dónde va una alumna dentro de un curso: módulo interno y clase.
export type AvanceCurso = {
  cursoId: string;
  curso: string;
  hechas: number;
  total: number;
  pct: number;
  bloque: string | null;        // módulo interno ("Módulo 2 · …")
  clase: string | null;         // clase en la que va (la siguiente por ver)
  numero: number;               // número de esa clase dentro del curso
  terminado: boolean;
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

  const [{ data: perfilesTodos }, { data: progreso }, { data: subs }, { data: clases }, { data: modulos }, { data: accesos }] =
    await Promise.all([
      admin.from("profiles")
        .select("id, full_name, avatar_url, xp, racha, pais, fecha_nacimiento, created_at, ultima_actividad, notas_equipo, renovacion, experiencia, onboarding_completo")
        .order("xp", { ascending: false }),
      admin.from("clase_progreso").select("user_id, clase_id, completada"),
      admin.from("reto_submissions").select("user_id, estado, revision"),
      admin.from("cursos_clases").select("id, modulo_id, orden, titulo, bloque").eq("activo", true).order("orden"),
      admin.from("cursos_modulos").select("id, nombre, orden, especial").eq("activo", true).order("orden"),
      admin.from("curso_accesos").select("user_id, modulo_id"),
    ]);

  // Cursos especiales de cada quien (por nombre). Quien compró un curso aparece
  // en la lista aunque todavía no haya terminado el onboarding.
  const nombreEspecial = new Map((modulos || []).filter((m) => m.especial).map((m) => [m.id as string, m.nombre as string]));
  const cursosPorUsuario = new Map<string, string[]>();
  for (const a of accesos || []) {
    const n = nombreEspecial.get(a.modulo_id as string);
    if (!n) continue;
    const u = a.user_id as string;
    if (!cursosPorUsuario.has(u)) cursosPorUsuario.set(u, []);
    cursosPorUsuario.get(u)!.push(n);
  }
  const perfiles = (perfilesTodos || []).filter((p) => p.onboarding_completo || cursosPorUsuario.has(p.id as string));

  // Clases de cada curso especial, en orden, para saber en qué clase va cada quien.
  const clasesDeCurso = new Map<string, { id: string; titulo: string; bloque: string | null }[]>();
  for (const c of clases || []) {
    const mid = c.modulo_id as string;
    if (!nombreEspecial.has(mid)) continue;
    if (!clasesDeCurso.has(mid)) clasesDeCurso.set(mid, []);
    clasesDeCurso.get(mid)!.push({ id: c.id as string, titulo: c.titulo as string, bloque: (c.bloque as string) ?? null });
  }
  const cursosIdPorUsuario = new Map<string, string[]>();
  for (const a of accesos || []) {
    const mid = a.modulo_id as string;
    if (!nombreEspecial.has(mid)) continue;
    const u = a.user_id as string;
    if (!cursosIdPorUsuario.has(u)) cursosIdPorUsuario.set(u, []);
    cursosIdPorUsuario.get(u)!.push(mid);
  }

  // Correos: viven en auth, no en el perfil.
  const correo = await correosDeUsuarios(admin);

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
      fechaNacimiento: typeof p.fecha_nacimiento === "string" ? p.fecha_nacimiento.slice(0, 10) : null,
      miembroDesde: p.created_at as string,
      certificado,
      experiencia: (p.experiencia as string) || null,
      cursos: cursosPorUsuario.get(id) || [],
      onboarding: !!p.onboarding_completo,
      avance: (cursosIdPorUsuario.get(id) || []).map((mid) => {
        const lista = clasesDeCurso.get(mid) || [];
        const hechasCurso = lista.filter((c) => hechas.has(c.id)).length;
        // Va en la primera clase que aún no completa (o terminó el curso).
        const siguiente = lista.find((c) => !hechas.has(c.id)) ?? null;
        const idx = siguiente ? lista.findIndex((c) => c.id === siguiente.id) : lista.length - 1;
        return {
          cursoId: mid,
          curso: nombreEspecial.get(mid) as string,
          hechas: hechasCurso,
          total: lista.length,
          pct: lista.length ? Math.round((hechasCurso / lista.length) * 100) : 0,
          bloque: siguiente ? siguiente.bloque : lista[lista.length - 1]?.bloque ?? null,
          clase: siguiente ? siguiente.titulo : null,
          numero: idx + 1,
          terminado: !siguiente && lista.length > 0,
        };
      }),
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

// Editar los datos básicos de la cuenta de una alumna (nombre, correo, nacimiento).
export async function editarDatosEstudiante(
  userId: string,
  datos: { nombre: string; email: string; fechaNacimiento: string },
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();

  const nombre = datos.nombre.trim().replace(/\s+/g, " ").slice(0, 80);
  if (nombre.length < 2) return { error: "Escribe el nombre." };
  const email = datos.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El correo no es válido." };
  const nac = datos.fechaNacimiento.trim();
  if (nac && (!/^\d{4}-\d{2}-\d{2}$/.test(nac) || Number.isNaN(new Date(nac).getTime())))
    return { error: "La fecha de nacimiento no es válida." };

  // El correo vive en auth; el nombre y la fecha en el perfil.
  const { data: actual } = await admin.auth.admin.getUserById(userId);
  if (!actual?.user) return { error: "No encontramos la cuenta." };
  if ((actual.user.email ?? "").toLowerCase() !== email) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
    if (error) return { error: /already|exists|registered/i.test(error.message) ? "Ese correo ya lo usa otra cuenta." : "No se pudo cambiar el correo." };
  }
  const { error } = await admin.from("profiles")
    .update({ full_name: nombre, fecha_nacimiento: nac || null }).eq("id", userId);
  if (error) return { error: "No se pudieron guardar los datos." };
  return { ok: true };
}
