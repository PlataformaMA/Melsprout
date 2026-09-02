"use server";

import { createAdminClient } from "@/lib/supabase/admin";
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
    .from("profiles").select("id, ultima_actividad").eq("onboarding_completo", true);

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
export type Reporte = "estudiantes" | "progreso" | "retos";

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

  if (tipo === "progreso") {
    const [{ data: prog }, { data: perfiles }, { data: clases }] = await Promise.all([
      admin.from("clase_progreso").select("user_id, clase_id, completada, updated_at"),
      admin.from("profiles").select("id, full_name"),
      admin.from("cursos_clases").select("id, titulo"),
    ]);
    const nombre = new Map((perfiles || []).map((p) => [p.id as string, (p.full_name as string) || ""]));
    const clase = new Map((clases || []).map((c) => [c.id as string, (c.titulo as string) || ""]));
    const filas: (string | number | null)[][] = [
      ["Estudiante", "Clase", "Completada", "Fecha"],
      ...(prog || []).map((p) => [
        nombre.get(p.user_id as string) || "", clase.get(p.clase_id as string) || "",
        p.completada ? "sí" : "no", String(p.updated_at).slice(0, 10),
      ]),
    ];
    return { csv: csv(filas), nombre: `progreso-${hoy}.csv` };
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
