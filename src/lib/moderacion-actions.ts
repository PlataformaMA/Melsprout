"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

export type Ambito = "ruta" | "especiales" | "comunidad";
export type EstadoMod = "pendiente" | "aprobado" | "oculto" | "spam";
export type Accion = "aprobar" | "ocultar" | "spam";

export type ItemModeracion = {
  id: string;
  origen: "clase" | "post" | "respuesta";
  autorId: string;
  autorNombre: string;
  autorAvatar: string | null;
  grupo: string | null;      // el grupo al que pertenece, si está en uno
  texto: string;
  fecha: string;
  estado: EstadoMod;
  dondeId: string | null;    // clase o categoría
  donde: string;             // "Clase 2: …" o "Foro · Marketing"
  moduloId: string | null;
  mundo: string | null;
};

async function soyAdmin(): Promise<boolean> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

// Todo lo que el equipo puede moderar, por ámbito.
export async function listarModeracion(ambito: Ambito): Promise<{
  items: ItemModeracion[];
  mundos: { id: string; nombre: string }[];
}> {
  if (!(await soyAdmin())) return { items: [], mundos: [] };
  const admin = createAdminClient();

  const [{ data: modulos }, { data: clases }, { data: miembros }, { data: grupos }] = await Promise.all([
    admin.from("cursos_modulos").select("id, nombre, orden, especial").order("orden"),
    admin.from("cursos_clases").select("id, titulo, modulo_id, orden").order("orden"),
    admin.from("grupo_miembros").select("user_id, grupo_id"),
    admin.from("grupos").select("id, nombre"),
  ]);

  const nombreModulo = new Map((modulos || []).map((m) => [m.id as string, m.nombre as string]));
  const esEspecial = new Map((modulos || []).map((m) => [m.id as string, m.especial === true]));
  const nombreGrupo = new Map((grupos || []).map((g) => [g.id as string, g.nombre as string]));
  const grupoDe = new Map<string, string>();
  for (const m of miembros || []) {
    const u = m.user_id as string;
    if (!grupoDe.has(u)) grupoDe.set(u, nombreGrupo.get(m.grupo_id as string) || "");
  }

  const claseInfo = new Map(
    (clases || []).map((c, i) => [c.id as string, {
      titulo: c.titulo as string,
      moduloId: c.modulo_id as string,
      numero: i + 1,
    }])
  );

  async function perfilesDe(ids: string[]) {
    if (!ids.length) return new Map<string, { full_name?: string; avatar_url?: string }>();
    const { data } = await admin.from("profiles").select("id, full_name, avatar_url").in("id", ids);
    return new Map((data || []).map((p) => [p.id as string, p as { full_name?: string; avatar_url?: string }]));
  }

  const items: ItemModeracion[] = [];

  if (ambito === "ruta" || ambito === "especiales") {
    const { data } = await admin.from("clase_comentarios")
      .select("id, clase_id, autor_id, texto, created_at, estado")
      .order("created_at", { ascending: false }).limit(300);
    const perfiles = await perfilesDe([...new Set((data || []).map((c) => c.autor_id as string))]);

    for (const c of data || []) {
      const info = claseInfo.get(c.clase_id as string);
      if (!info) continue;
      const especial = esEspecial.get(info.moduloId) === true;
      if (ambito === "ruta" && especial) continue;
      if (ambito === "especiales" && !especial) continue;

      const p = perfiles.get(c.autor_id as string);
      items.push({
        id: c.id as string,
        origen: "clase",
        autorId: c.autor_id as string,
        autorNombre: (p?.full_name as string) || "Creador",
        autorAvatar: (p?.avatar_url as string) || null,
        grupo: grupoDe.get(c.autor_id as string) || null,
        texto: c.texto as string,
        fecha: c.created_at as string,
        estado: ((c.estado as string) || "pendiente") as EstadoMod,
        dondeId: c.clase_id as string,
        donde: `Clase ${info.numero}: ${info.titulo}`,
        moduloId: info.moduloId,
        mundo: nombreModulo.get(info.moduloId) || null,
      });
    }
  } else {
    const [{ data: posts }, { data: resp }] = await Promise.all([
      admin.from("foros_posts").select("id, autor_id, texto, categoria, created_at, estado")
        .order("created_at", { ascending: false }).limit(200),
      admin.from("foros_respuestas").select("id, autor_id, texto, post_id, created_at, estado")
        .order("created_at", { ascending: false }).limit(200),
    ]);
    const ids = [
      ...new Set([...(posts || []).map((p) => p.autor_id as string), ...(resp || []).map((r) => r.autor_id as string)]),
    ];
    const perfiles = await perfilesDe(ids);

    for (const p of posts || []) {
      const per = perfiles.get(p.autor_id as string);
      items.push({
        id: p.id as string, origen: "post",
        autorId: p.autor_id as string,
        autorNombre: (per?.full_name as string) || "Creador",
        autorAvatar: (per?.avatar_url as string) || null,
        grupo: grupoDe.get(p.autor_id as string) || null,
        texto: p.texto as string,
        fecha: p.created_at as string,
        estado: ((p.estado as string) || "pendiente") as EstadoMod,
        dondeId: null,
        donde: `Foro · ${(p.categoria as string) || "General"}`,
        moduloId: null, mundo: null,
      });
    }
    for (const r of resp || []) {
      const per = perfiles.get(r.autor_id as string);
      items.push({
        id: r.id as string, origen: "respuesta",
        autorId: r.autor_id as string,
        autorNombre: (per?.full_name as string) || "Creador",
        autorAvatar: (per?.avatar_url as string) || null,
        grupo: grupoDe.get(r.autor_id as string) || null,
        texto: r.texto as string,
        fecha: r.created_at as string,
        estado: ((r.estado as string) || "pendiente") as EstadoMod,
        dondeId: null,
        donde: "Respuesta en el foro",
        moduloId: null, mundo: null,
      });
    }
    items.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  const mundos = (modulos || [])
    .filter((m) => (ambito === "especiales" ? m.especial === true : m.especial !== true))
    .map((m) => ({ id: m.id as string, nombre: m.nombre as string }));

  return { items, mundos };
}

// Aprobar, ocultar o marcar como spam. Acepta varios de golpe.
export async function moderar(
  items: { id: string; origen: ItemModeracion["origen"] }[], accion: Accion
): Promise<{ ok: true; n: number } | { error: string }> {
  if (!(await soyAdmin())) return { error: "No autorizado." };
  if (!items.length) return { error: "No hay nada seleccionado." };

  const admin = createAdminClient();
  const estado: EstadoMod = accion === "aprobar" ? "aprobado" : accion === "ocultar" ? "oculto" : "spam";
  const oculto = accion !== "aprobar";

  const tabla = {
    clase: "clase_comentarios",
    post: "foros_posts",
    respuesta: "foros_respuestas",
  } as const;

  for (const origen of ["clase", "post", "respuesta"] as const) {
    const ids = items.filter((i) => i.origen === origen).map((i) => i.id);
    if (!ids.length) continue;
    const { error } = await admin.from(tabla[origen]).update({ estado, oculto }).in("id", ids);
    if (error) return { error: "No se pudo aplicar la acción." };
  }
  return { ok: true, n: items.length };
}
