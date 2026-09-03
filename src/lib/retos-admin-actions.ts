"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

export type EstadoReto = "publicado" | "borrador" | "oculto";

export type RetoRuta = {
  claseId: string;
  claseTitulo: string;
  portada: string | null;
  texto: string;            // lo que se le pide a la alumna
  instrucciones: string;
  tipo: string;
  xp: number;
  nivel: string | null;
  mundo: string;
  estado: EstadoReto;
  entregas: number;
  porRevisar: number;
};

export type RetoComunidadAdmin = {
  id: string;
  titulo: string;
  descripcion: string;
  portada: string | null;
  emoji: string;
  dias: number;
  xpDia: number;
  xpBonus: number;
  iniciaAt: string | null;
  activo: boolean;
  inscritos: number;
  diaActual: number;        // en qué día va, 0 si no ha empezado
};

export const TIPOS_RETO = ["Tarea", "Entrega", "Reto", "Proyecto", "Análisis"];

async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

// Los retos de la ruta: uno por clase.
export async function listarRetosRuta(): Promise<{
  retos: RetoRuta[]; mundos: { id: string; nombre: string }[];
}> {
  if (!(await soyAdmin())) return { retos: [], mundos: [] };
  const admin = createAdminClient();

  const [{ data: clases }, { data: modulos }, { data: subs }] = await Promise.all([
    admin.from("cursos_clases").select("*").order("orden"),
    admin.from("cursos_modulos").select("id, nombre, orden").order("orden"),
    admin.from("reto_submissions").select("reto_id, estado, revision"),
  ]);

  const nombreModulo = new Map((modulos || []).map((m) => [m.id as string, m.nombre as string]));
  const entregasPor = new Map<string, number>();
  const revisarPor = new Map<string, number>();
  for (const s of subs || []) {
    const k = s.reto_id as string;
    if (s.estado === "publicado") entregasPor.set(k, (entregasPor.get(k) || 0) + 1);
    if (s.estado === "publicado" && s.revision === "pendiente") revisarPor.set(k, (revisarPor.get(k) || 0) + 1);
  }

  const retos: RetoRuta[] = (clases || []).map((c) => {
    const id = c.id as string;
    const texto = ((c.reto_texto as string) || "").trim();
    return {
      claseId: id,
      claseTitulo: c.titulo as string,
      portada: (c.portada as string) || null,
      texto,
      instrucciones: ((c.reto_instrucciones as string) || "").trim(),
      tipo: (c.reto_tipo as string) || "Tarea",
      xp: (c.reto_xp as number) ?? 50,
      nivel: (c.nivel as string) || null,
      mundo: nombreModulo.get(c.modulo_id as string) || "—",
      estado: c.reto_activo === false ? "oculto" : texto ? "publicado" : "borrador",
      entregas: entregasPor.get(id) || 0,
      porRevisar: revisarPor.get(id) || 0,
    };
  });

  return {
    retos,
    mundos: (modulos || []).map((m) => ({ id: m.id as string, nombre: m.nombre as string })),
  };
}

export type RetoRutaForm = {
  claseId: string;
  texto: string;
  instrucciones: string;
  tipo: string;
  xp: number;
  activo: boolean;
};

export async function guardarRetoRuta(f: RetoRutaForm): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  if (!f.texto.trim()) return { error: "Escribe qué se le pide a la alumna." };
  const admin = createAdminClient();
  const { error } = await admin.from("cursos_clases").update({
    reto_texto: f.texto.trim(),
    reto_instrucciones: f.instrucciones.trim(),
    reto_tipo: f.tipo || "Tarea",
    reto_xp: Number(f.xp) || 0,
    reto_activo: f.activo,
  }).eq("id", f.claseId);
  if (error) return { error: "No se pudo guardar el reto." };
  return { ok: true };
}

// ————— Retos de la comunidad —————
export async function listarRetosComunidadAdmin(): Promise<RetoComunidadAdmin[]> {
  if (!(await soyAdmin())) return [];
  const admin = createAdminClient();
  const [{ data: retos }, { data: inscritos }] = await Promise.all([
    admin.from("comunidad_retos").select("*").order("orden"),
    admin.from("comunidad_reto_inscritos").select("reto_id"),
  ]);

  const porReto = new Map<string, number>();
  for (const i of inscritos || []) {
    const k = i.reto_id as string;
    porReto.set(k, (porReto.get(k) || 0) + 1);
  }

  return (retos || []).map((r) => {
    const inicia = (r.inicia_at as string) || null;
    const dias = (r.dias as number) || 0;
    let diaActual = 0;
    if (inicia) {
      const pasados = Math.floor((Date.now() - new Date(inicia).getTime()) / 864e5) + 1;
      diaActual = Math.max(0, Math.min(dias, pasados));
    }
    return {
      id: r.id as string,
      titulo: r.titulo as string,
      descripcion: (r.descripcion as string) || "",
      portada: (r.portada as string) || null,
      emoji: (r.emoji as string) || "🎯",
      dias,
      xpDia: (r.xp_dia as number) || 0,
      xpBonus: (r.xp_bonus as number) || 0,
      iniciaAt: inicia,
      activo: r.activo !== false,
      inscritos: porReto.get(r.id as string) || 0,
      diaActual,
    };
  });
}

export type RetoComunidadForm = {
  id?: string;
  titulo: string;
  descripcion: string;
  emoji: string;
  dias: number;
  xpDia: number;
  xpBonus: number;
  iniciaAt: string;   // "" = sin fecha
  activo: boolean;
  portadaDataUrl?: string;
};

export async function guardarRetoComunidad(f: RetoComunidadForm): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  if (!f.titulo.trim()) return { error: "Ponle título al reto." };
  const admin = createAdminClient();

  const fila: Record<string, unknown> = {
    titulo: f.titulo.trim(),
    descripcion: f.descripcion.trim(),
    emoji: f.emoji || "🎯",
    dias: Number(f.dias) || 7,
    xp_dia: Number(f.xpDia) || 0,
    xp_bonus: Number(f.xpBonus) || 0,
    inicia_at: f.iniciaAt ? new Date(f.iniciaAt).toISOString() : null,
    activo: f.activo,
  };

  let id = f.id;
  if (id) {
    const { error } = await admin.from("comunidad_retos").update(fila).eq("id", id);
    if (error) return { error: "No se pudo guardar." };
  } else {
    const { data: max } = await admin.from("comunidad_retos")
      .select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await admin.from("comunidad_retos")
      .insert({ ...fila, orden: ((max?.orden as number) || 0) + 1 }).select("id").single();
    if (error || !data) return { error: "No se pudo crear el reto." };
    id = data.id as string;
  }

  if (f.portadaDataUrl?.startsWith("data:image/")) {
    const coma = f.portadaDataUrl.indexOf(",");
    const bytes = Buffer.from(f.portadaDataUrl.slice(coma + 1), "base64");
    const ruta = `retos-comunidad/${id}.jpg`;
    const { error: eSub } = await admin.storage.from("retos")
      .upload(ruta, bytes, { contentType: "image/jpeg", upsert: true });
    if (!eSub) {
      const { data: pub } = admin.storage.from("retos").getPublicUrl(ruta);
      await admin.from("comunidad_retos").update({ portada: `${pub.publicUrl}?v=${Date.now()}` }).eq("id", id);
    }
  }
  return { ok: true };
}

export async function borrarRetoComunidad(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("comunidad_retos").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar (¿tiene participantes?)." };
  return { ok: true };
}

// Exportar los retos de la ruta a CSV.
export async function exportarRetos(): Promise<{ csv: string; nombre: string } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  const { retos } = await listarRetosRuta();
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const filas = [
    ["Clase", "Reto", "Mundo", "Nivel", "Tipo", "XP", "Estado", "Entregas", "Por revisar"],
    ...retos.map((r) => [
      r.claseTitulo, r.texto, r.mundo, r.nivel || "", r.tipo, r.xp, r.estado, r.entregas, r.porRevisar,
    ]),
  ];
  return {
    csv: filas.map((f) => f.map(esc).join(",")).join("\n"),
    nombre: `retos-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}
