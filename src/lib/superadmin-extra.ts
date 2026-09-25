"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { traerTodo } from "@/lib/traer-todo";
import { correosDeUsuarios } from "@/lib/usuarios-auth";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

// ————— Mensajes: aviso para toda la comunidad —————
export async function enviarAviso(
  titulo: string, cuerpo: string, destino: "todos" | "activos" | "riesgo"
): Promise<{ ok: true; enviados: number } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const t = titulo.trim(), c = cuerpo.trim();
  if (t.length < 3) return { error: "Ponle un título al aviso." };
  if (c.length < 5) return { error: "Escribe el mensaje." };

  const admin = createAdminClient();
  const { data: gente } = await admin
    .from("profiles").select("id, ultima_actividad").eq("onboarding_completo", true).range(0, 9999);

  const DIA = 864e5;
  const destinatarios = (gente || []).filter((p) => {
    if (destino === "todos") return true;
    const ult = p.ultima_actividad as string | null;
    const d = ult ? Date.now() - new Date(ult).getTime() : Infinity;
    return destino === "activos" ? d <= 7 * DIA : d > 7 * DIA;
  });
  if (destinatarios.length === 0) return { error: "No hay nadie en ese grupo." };

  const filas = destinatarios.map((p) => ({
    user_id: p.id as string, tipo: "general", titulo: t, cuerpo: c, href: "/app/ruta",
  }));
  // Se manda por tandas para no pasarnos del límite de la petición.
  for (let i = 0; i < filas.length; i += 200) {
    const { error } = await admin.from("notificaciones").insert(filas.slice(i, i + 200));
    if (error) return { error: "No se pudo enviar el aviso." };
  }
  return { ok: true, enviados: filas.length };
}

// ————— Reportes: datos en CSV —————
export type Reporte = "estudiantes" | "progreso" | "clases" | "retos";

function csv(filas: (string | number | null)[][]): string {
  const escapar = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return filas.map((f) => f.map(escapar).join(",")).join("\n");
}

export async function generarReporte(tipo: Reporte): Promise<{ csv: string; nombre: string } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const hoy = new Date().toISOString().slice(0, 10);

  if (tipo === "estudiantes") {
    const { data } = await admin.from("profiles")
      .select("full_name, username, pais, ciudad, xp, racha, gemas, created_at, ultima_actividad, onboarding_completo")
      .eq("onboarding_completo", true).order("xp", { ascending: false });
    const filas: (string | number | null)[][] = [
      ["Nombre", "Usuario", "País", "Ciudad", "XP", "Racha", "Gemas", "Se unió", "Última actividad"],
      ...(data || []).map((p) => [
        (p.full_name as string) || "", (p.username as string) || "", (p.pais as string) || "",
        (p.ciudad as string) || "", (p.xp as number) || 0, (p.racha as number) || 0,
        (p.gemas as number) || 0, String(p.created_at).slice(0, 10),
        p.ultima_actividad ? String(p.ultima_actividad).slice(0, 10) : "",
      ]),
    ];
    return { csv: csv(filas), nombre: `estudiantes-${hoy}.csv` };
  }

  // Avance por alumna y curso: una fila por curso en el que está inscrita.
  if (tipo === "progreso") {
    const [{ data: prog }, { data: perfiles }, { data: clases }, { data: modulos }, { data: accesos }] = await Promise.all([
      traerTodo((d, h) => admin.from("clase_progreso").select("user_id, clase_id, completada, updated_at, completada_at").range(d, h)).then((data) => ({ data })),
      admin.from("profiles").select("id, full_name, ultima_actividad"),
      admin.from("cursos_clases").select("id, modulo_id, orden, titulo, bloque").eq("activo", true).order("orden"),
      admin.from("cursos_modulos").select("id, nombre, orden, especial").eq("activo", true).order("orden"),
      traerTodo((d, h) => admin.from("curso_accesos").select("user_id, modulo_id, created_at, entrada_at").range(d, h)).then((data) => ({ data })),
    ]);
    const correo = await correosDeUsuarios(admin);
    const perfil = new Map((perfiles || []).map((p) => [p.id as string, p]));

    // Clases de cada curso, en orden.
    const porCurso = new Map<string, { id: string; titulo: string; bloque: string | null }[]>();
    for (const c of clases || []) {
      const mid = c.modulo_id as string;
      if (!porCurso.has(mid)) porCurso.set(mid, []);
      porCurso.get(mid)!.push({ id: c.id as string, titulo: c.titulo as string, bloque: (c.bloque as string) ?? null });
    }
    const esEspecial = new Map((modulos || []).map((m) => [m.id as string, !!m.especial]));
    const nombreCurso = new Map((modulos || []).map((m) => [m.id as string, (m.nombre as string) || ""]));
    const cursoDeClase = new Map((clases || []).map((c) => [c.id as string, c.modulo_id as string]));

    // Avance de cada alumna, clase por clase.
    type Paso = { completada: boolean; fecha: string; completadaAt: string | null };
    const pasos = new Map<string, Map<string, Paso>>();   // user -> clase -> paso
    for (const p of prog || []) {
      const u = p.user_id as string;
      if (!pasos.has(u)) pasos.set(u, new Map());
      pasos.get(u)!.set(p.clase_id as string, {
        completada: !!p.completada,
        fecha: String(p.updated_at),
        completadaAt: p.completada_at ? String(p.completada_at) : null,
      });
    }

    // La Ruta cuenta como un "curso" más para quien no tiene curso especial.
    const rutaIds = (modulos || []).filter((m) => !m.especial).map((m) => m.id as string);

    const filas: (string | number | null)[][] = [[
      "Estudiante", "Correo", "Curso", "Clases completadas", "Total de clases", "% de avance",
      "Módulo en el que va", "Clase en la que va", "Fecha de inicio", "Fecha de último avance",
      "Última actividad en la app", "Inscrita desde", "Primera entrada al curso",
    ]];

    const fecha = (v: unknown) => (v ? String(v).slice(0, 10) : "");

    // 1) Cursos especiales: una fila por alumna inscrita.
    for (const a of accesos || []) {
      const mid = a.modulo_id as string;
      if (!esEspecial.get(mid)) continue;
      const uid = a.user_id as string;
      const lista = porCurso.get(mid) || [];
      const mios = pasos.get(uid) || new Map<string, Paso>();
      const vistas = lista.filter((c) => mios.has(c.id));
      const hechas = lista.filter((c) => mios.get(c.id)?.completada);
      const siguiente = lista.find((c) => !mios.get(c.id)?.completada) ?? null;
      const fechas = vistas.map((c) => mios.get(c.id)!.fecha).sort();
      const inicios = vistas.map((c) => mios.get(c.id)!.completadaAt ?? mios.get(c.id)!.fecha).sort();
      const per = perfil.get(uid);
      filas.push([
        (per?.full_name as string) || "", correo.get(uid) || "", nombreCurso.get(mid) || "",
        hechas.length, lista.length, lista.length ? Math.round((hechas.length / lista.length) * 100) + "%" : "0%",
        siguiente ? (siguiente.bloque || "") : "Terminado",
        siguiente ? siguiente.titulo : "Terminó el curso",
        fecha(inicios[0]), fecha(fechas[fechas.length - 1]),
        fecha(per?.ultima_actividad), fecha(a.created_at), fecha(a.entrada_at),
      ]);
    }

    // 2) La Ruta de aprendizaje: una fila por alumna con avance en ella.
    const clasesRuta = rutaIds.flatMap((mid) => (porCurso.get(mid) || []).map((c) => ({ ...c, mid })));
    for (const [uid, mios] of pasos) {
      const vistas = clasesRuta.filter((c) => mios.has(c.id));
      if (vistas.length === 0) continue;
      const hechas = clasesRuta.filter((c) => mios.get(c.id)?.completada);
      const siguiente = clasesRuta.find((c) => !mios.get(c.id)?.completada) ?? null;
      const fechas = vistas.map((c) => mios.get(c.id)!.fecha).sort();
      const inicios = vistas.map((c) => mios.get(c.id)!.completadaAt ?? mios.get(c.id)!.fecha).sort();
      const per = perfil.get(uid);
      filas.push([
        (per?.full_name as string) || "", correo.get(uid) || "", "Ruta de aprendizaje",
        hechas.length, clasesRuta.length, clasesRuta.length ? Math.round((hechas.length / clasesRuta.length) * 100) + "%" : "0%",
        siguiente ? (nombreCurso.get(siguiente.mid) || "") : "Terminada",
        siguiente ? siguiente.titulo : "Terminó la ruta",
        fecha(inicios[0]), fecha(fechas[fechas.length - 1]),
        fecha(per?.ultima_actividad), "", "",
      ]);
    }
    return { csv: csv(filas), nombre: `avance-por-curso-${hoy}.csv` };
  }

  // Detalle clase por clase (lo que traía antes el reporte de progreso, con curso y módulo).
  if (tipo === "clases") {
    const [{ data: prog }, { data: perfiles }, { data: clases }, { data: modulos }] = await Promise.all([
      traerTodo((d, h) => admin.from("clase_progreso").select("user_id, clase_id, completada, updated_at, completada_at").range(d, h)).then((data) => ({ data })),
      admin.from("profiles").select("id, full_name"),
      admin.from("cursos_clases").select("id, modulo_id, titulo, bloque, orden").order("orden"),
      admin.from("cursos_modulos").select("id, nombre"),
    ]);
    const correo = await correosDeUsuarios(admin);
    const nombre = new Map((perfiles || []).map((p) => [p.id as string, (p.full_name as string) || ""]));
    const curso = new Map((modulos || []).map((m) => [m.id as string, (m.nombre as string) || ""]));
    const clase = new Map((clases || []).map((c) => [c.id as string, c]));
    const filas: (string | number | null)[][] = [
      ["Estudiante", "Correo", "Curso", "Módulo", "Clase", "Completada", "Fecha en que la completó", "Último avance"],
      ...(prog || []).map((p) => {
        const c = clase.get(p.clase_id as string);
        return [
          nombre.get(p.user_id as string) || "", correo.get(p.user_id as string) || "",
          c ? curso.get(c.modulo_id as string) || "" : "", c ? ((c.bloque as string) || "") : "",
          c ? (c.titulo as string) : "", p.completada ? "sí" : "no",
          p.completada_at ? String(p.completada_at).slice(0, 10) : "", String(p.updated_at).slice(0, 10),
        ];
      }),
    ];
    return { csv: csv(filas), nombre: `progreso-por-clase-${hoy}.csv` };
  }

  const [{ data: subs }, { data: perfiles }] = await Promise.all([
    admin.from("reto_submissions").select("user_id, reto_id, estado, revision, updated_at"),
    admin.from("profiles").select("id, full_name"),
  ]);
  const nombre = new Map((perfiles || []).map((p) => [p.id as string, (p.full_name as string) || ""]));
  const filas: (string | number | null)[][] = [
    ["Estudiante", "Reto", "Estado", "Revisión", "Fecha"],
    ...(subs || []).map((s) => [
      nombre.get(s.user_id as string) || "", (s.reto_id as string) || "",
      (s.estado as string) || "", (s.revision as string) || "", String(s.updated_at).slice(0, 10),
    ]),
  ];
  return { csv: csv(filas), nombre: `retos-${hoy}.csv` };
}

// ————— Configuración —————
export async function getDesbloqueo(): Promise<boolean> {
  if (!(await soyAdmin())) return true;
  const admin = createAdminClient();
  const { data } = await admin.from("ajustes_plataforma").select("valor").eq("clave", "todo_desbloqueado").maybeSingle();
  return data ? data.valor === true : true;
}

// Abrir todas las clases o volver a que se desbloqueen conforme avanzan.
export async function setDesbloqueo(abierto: boolean): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("ajustes_plataforma")
    .upsert({ clave: "todo_desbloqueado", valor: abierto, updated_at: new Date().toISOString() });
  if (error) return { error: "No se pudo guardar." };
  return { ok: true };
}
