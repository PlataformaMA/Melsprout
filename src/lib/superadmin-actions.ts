"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { nivelPorXP } from "@/lib/data";

export type Rango = "hoy" | "7d" | "30d";

export type Barra = { etiqueta: string; valor: number; color?: string };
export type TopAlumno = { id: string; nombre: string; usuario: string | null; avatar: string | null; xp: number; nivel: number };
export type Evento = { icono: string; texto: string; hace: string };

export type Resumen = {
  retosPendientes: number;
  enRiesgo: number;
  estudiantes: number;
  nuevosSemana: number;
  activosSemana: number;
  pctActivos: number;
  certificaciones: number;
  certificacionesSemana: number;
  niveles: Barra[];
  ultimoAcceso: Barra[];
  segmentos: Barra[];
  avancePorMundo: { nombre: string; pct: number }[];
  top: TopAlumno[];
  actividad: Evento[];
};

const DIA = 864e5;
function hace(iso: string | null): string {
  if (!iso) return "—";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}

async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

// Todo el tablero del superadmin, con datos reales, en una sola pasada.
export async function getResumen(rango: Rango = "7d"): Promise<Resumen | null> {
  if (!(await soyAdmin())) return null;
  const admin = createAdminClient();
  const dias = rango === "hoy" ? 1 : rango === "7d" ? 7 : 30;
  const desde = new Date(Date.now() - dias * DIA).toISOString();
  const semana = new Date(Date.now() - 7 * DIA).toISOString();

  const [
    { data: perfiles },
    { data: subs },
    { data: progreso },
    { data: clases },
    { data: modulos },
  ] = await Promise.all([
    admin.from("profiles")
      .select("id, full_name, username, avatar_url, xp, created_at, ultima_actividad")
      .eq("onboarding_completo", true),
    admin.from("reto_submissions").select("user_id, estado, revision, updated_at"),
    admin.from("clase_progreso").select("user_id, clase_id, completada, updated_at"),
    admin.from("cursos_clases").select("id, modulo_id").eq("activo", true),
    admin.from("cursos_modulos").select("id, nombre, orden").eq("activo", true).order("orden"),
  ]);

  const gente = perfiles || [];
  const total = gente.length;

  // ——— Tarjetas de arriba ———
  const retosPendientes = (subs || []).filter(
    (s) => s.estado === "publicado" && s.revision === "pendiente"
  ).length;

  const actividadDe = (id: string): number => {
    const p = gente.find((g) => g.id === id);
    const ult = (p?.ultima_actividad as string) || null;
    return ult ? Date.now() - new Date(ult).getTime() : Infinity;
  };

  const enRiesgo = gente.filter((p) => actividadDe(p.id as string) > 7 * DIA).length;
  const nuevosSemana = gente.filter((p) => (p.created_at as string) > semana).length;
  const activosSemana = new Set(
    (progreso || []).filter((p) => (p.updated_at as string) > semana).map((p) => p.user_id as string)
  ).size;
  const pctActivos = total ? Math.round((activosSemana / total) * 100) : 0;

  // Certificación = terminó todas las clases activas del curso.
  const totalClases = (clases || []).length;
  const completasPorUsuario = new Map<string, number>();
  const ultimaCompleta = new Map<string, string>();
  for (const p of progreso || []) {
    if (!p.completada) continue;
    const u = p.user_id as string;
    completasPorUsuario.set(u, (completasPorUsuario.get(u) || 0) + 1);
    const f = p.updated_at as string;
    if (!ultimaCompleta.has(u) || f > (ultimaCompleta.get(u) as string)) ultimaCompleta.set(u, f);
  }
  const certificados = totalClases
    ? [...completasPorUsuario.entries()].filter(([, n]) => n >= totalClases).map(([u]) => u)
    : [];
  const certificaciones = certificados.length;
  const certificacionesSemana = certificados.filter(
    (u) => (ultimaCompleta.get(u) || "") > semana
  ).length;

  // ——— Distribución por niveles ———
  const porNivel = new Map<string, number>();
  for (const p of gente) {
    const n = nivelPorXP((p.xp as number) || 0).actual;
    porNivel.set(n.nombre, (porNivel.get(n.nombre) || 0) + 1);
  }
  const niveles: Barra[] = [...porNivel.entries()]
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  // ——— Último acceso ———
  const cubo = { hoy: 0, semana: 0, mes: 0, viejo: 0 };
  for (const p of gente) {
    const d = actividadDe(p.id as string);
    if (d <= DIA) cubo.hoy++;
    else if (d <= 7 * DIA) cubo.semana++;
    else if (d <= 30 * DIA) cubo.mes++;
    else cubo.viejo++;
  }
  const ultimoAcceso: Barra[] = [
    { etiqueta: "Hoy", valor: cubo.hoy, color: "#22C55E" },
    { etiqueta: "1–7 días", valor: cubo.semana, color: "#3B82F6" },
    { etiqueta: "8–30 días", valor: cubo.mes, color: "#F59E0B" },
    { etiqueta: "Más de 30 días", valor: cubo.viejo, color: "#EF4444" },
  ];

  // ——— Segmentación ———
  // Embajadora: activa esta semana y con al menos un reto aprobado.
  // Potencial: activa este mes. En riesgo: 8–30 días. Crítica: más de 30.
  const aprobados = new Set(
    (subs || []).filter((s) => s.revision === "aprobado").map((s) => s.user_id as string)
  );
  let embajadores = 0, potenciales = 0, riesgo = 0, criticos = 0;
  for (const p of gente) {
    const d = actividadDe(p.id as string);
    if (d <= 7 * DIA && aprobados.has(p.id as string)) embajadores++;
    else if (d <= 30 * DIA) potenciales++;
    else if (d <= 60 * DIA) riesgo++;
    else criticos++;
  }
  const segmentos: Barra[] = [
    { etiqueta: "Embajadores", valor: embajadores, color: "#22C55E" },
    { etiqueta: "Potenciales", valor: potenciales, color: "#3B82F6" },
    { etiqueta: "En riesgo", valor: riesgo, color: "#F59E0B" },
    { etiqueta: "Críticos", valor: criticos, color: "#EF4444" },
  ];

  // ——— Avance promedio por mundo ———
  const completasPorClase = new Set(
    (progreso || []).filter((p) => p.completada).map((p) => `${p.user_id}|${p.clase_id}`)
  );
  const avancePorMundo = (modulos || []).map((m) => {
    const suyas = (clases || []).filter((c) => c.modulo_id === m.id);
    if (!suyas.length || !total) return { nombre: m.nombre as string, pct: 0 };
    let hechas = 0;
    for (const p of gente) for (const c of suyas)
      if (completasPorClase.has(`${p.id}|${c.id}`)) hechas++;
    return { nombre: m.nombre as string, pct: Math.round((hechas / (suyas.length * total)) * 100) };
  });

  // ——— Top de alumnas ———
  const top: TopAlumno[] = [...gente]
    .sort((a, b) => ((b.xp as number) || 0) - ((a.xp as number) || 0))
    .slice(0, 5)
    .map((p) => ({
      id: p.id as string,
      nombre: (p.full_name as string) || "Creador",
      usuario: (p.username as string) || null,
      avatar: (p.avatar_url as string) || null,
      xp: (p.xp as number) || 0,
      nivel: nivelPorXP((p.xp as number) || 0).actual.nivel,
    }));

  // ——— Actividad reciente ———
  const nombreDe = (id: string) =>
    (gente.find((g) => g.id === id)?.full_name as string) || "Alguien";
  const eventos: { icono: string; texto: string; fecha: string }[] = [];
  for (const s of (subs || []).filter((s) => (s.updated_at as string) > desde).slice(0, 40)) {
    eventos.push({
      icono: "🎯",
      texto: `${nombreDe(s.user_id as string)} envió un reto`,
      fecha: s.updated_at as string,
    });
  }
  for (const p of (progreso || []).filter((p) => p.completada && (p.updated_at as string) > desde).slice(0, 40)) {
    eventos.push({
      icono: "📖",
      texto: `${nombreDe(p.user_id as string)} completó una clase`,
      fecha: p.updated_at as string,
    });
  }
  for (const p of gente.filter((p) => (p.created_at as string) > desde)) {
    eventos.push({
      icono: "✨",
      texto: `${(p.full_name as string) || "Alguien"} se unió a Melsprout`,
      fecha: p.created_at as string,
    });
  }
  const actividad: Evento[] = eventos
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 8)
    .map((e) => ({ icono: e.icono, texto: e.texto, hace: hace(e.fecha) }));

  return {
    retosPendientes, enRiesgo, estudiantes: total, nuevosSemana,
    activosSemana, pctActivos, certificaciones, certificacionesSemana,
    niveles, ultimoAcceso, segmentos, avancePorMundo, top, actividad,
  };
}
