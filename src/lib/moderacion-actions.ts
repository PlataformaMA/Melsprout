"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";
import { notificar } from "@/lib/notificaciones-actions";

export type Ambito = "ruta" | "especiales" | "comunidad";
export type EstadoMod = "pendiente" | "aprobado" | "oculto" | "spam";
export type Accion = "aprobar" | "ocultar" | "spam";

export type ItemModeracion = {
  id: string;
  origen: "clase" | "post" | "respuesta" | "reto";
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
  // Lo que mandó adjunto: hasta ahora el panel solo enseñaba el texto y por eso
  // "las capturas no aparecían".
  imagen: string | null;
  video: string | null;
  // Lo escribió alguien del equipo: se marca para no confundirlo con una alumna.
  esEquipo: boolean;
  // Respuestas colgando de este comentario, como una conversación.
  hilo: Respuesta[];
  // Ya le contestó alguien del equipo: sirve para separar lo atendido de lo
  // que sigue esperando respuesta.
  respondido: boolean;
  // A dónde ir para verlo en la plataforma, en su sitio.
  enlace: string | null;
};

export type Respuesta = {
  id: string;
  autorNombre: string;
  autorAvatar: string | null;
  esEquipo: boolean;
  texto: string;
  fecha: string;
};

// Lo que manda la alumna puede ser foto o video: se distingue por la extensión.
function esVideo(url: string | null): boolean {
  return !!url && /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
}

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

  const [{ data: modulos }, { data: clases }, { data: miembros }, { data: grupos }, { data: equipo }] =
    await Promise.all([
      admin.from("cursos_modulos").select("id, nombre, orden, especial").order("orden"),
      admin.from("cursos_clases").select("id, titulo, modulo_id, orden").order("orden"),
      admin.from("grupo_miembros").select("user_id, grupo_id"),
      admin.from("grupos").select("id, nombre"),
      admin.from("profiles").select("id").eq("is_admin", true),
    ]);

  // Melissa, Alexia, Nancy y el resto del equipo: sus mensajes se marcan.
  const delEquipo = new Set((equipo || []).map((p) => p.id as string));

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
      .select("id, clase_id, autor_id, texto, created_at, estado, responde_a")
      .order("created_at", { ascending: false }).limit(400);
    const perfiles = await perfilesDe([...new Set((data || []).map((c) => c.autor_id as string))]);

    // Las respuestas se cuelgan de su comentario en vez de ir sueltas: el equipo
    // lee la conversación completa sin saltar de una fila a otra.
    const hilos = new Map<string, Respuesta[]>();
    for (const c of [...(data || [])].reverse()) {
      const padre = c.responde_a as string | null;
      if (!padre) continue;
      const p = perfiles.get(c.autor_id as string);
      const lista = hilos.get(padre) || [];
      lista.push({
        id: c.id as string,
        autorNombre: (p?.full_name as string) || "Creador",
        autorAvatar: (p?.avatar_url as string) || null,
        esEquipo: delEquipo.has(c.autor_id as string),
        texto: c.texto as string,
        fecha: c.created_at as string,
      });
      hilos.set(padre, lista);
    }

    for (const c of data || []) {
      if (c.responde_a) continue;   // ya va dentro de su hilo
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
        imagen: null, video: null,
        esEquipo: delEquipo.has(c.autor_id as string),
        hilo: hilos.get(c.id as string) || [],
        respondido: (hilos.get(c.id as string) || []).some((r) => r.esEquipo),
        enlace: `/app/clase/${c.clase_id as string}#c-${c.id as string}`,
      });
    }
  } else {
    const [{ data: posts }, { data: resp }] = await Promise.all([
      admin.from("foros_posts").select("id, autor_id, texto, categoria, created_at, estado, imagen_url, video_url")
        .order("created_at", { ascending: false }).limit(200),
      admin.from("foros_respuestas").select("id, autor_id, texto, post_id, created_at, estado")
        .order("created_at", { ascending: false }).limit(200),
    ]);
    const ids = [
      ...new Set([...(posts || []).map((p) => p.autor_id as string), ...(resp || []).map((r) => r.autor_id as string)]),
    ];
    const perfiles = await perfilesDe(ids);

    // Las respuestas van debajo de su publicación, como conversación.
    const hilos = new Map<string, Respuesta[]>();
    for (const r of [...(resp || [])].reverse()) {
      const per = perfiles.get(r.autor_id as string);
      const lista = hilos.get(r.post_id as string) || [];
      lista.push({
        id: r.id as string,
        autorNombre: (per?.full_name as string) || "Creador",
        autorAvatar: (per?.avatar_url as string) || null,
        esEquipo: delEquipo.has(r.autor_id as string),
        texto: r.texto as string,
        fecha: r.created_at as string,
      });
      hilos.set(r.post_id as string, lista);
    }

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
        imagen: (p.imagen_url as string) || null,
        video: (p.video_url as string) || null,
        esEquipo: delEquipo.has(p.autor_id as string),
        hilo: hilos.get(p.id as string) || [],
        respondido: (hilos.get(p.id as string) || []).some((r) => r.esEquipo),
        enlace: `/app/comunidad?post=${p.id as string}`,
      });
    }
    // Una respuesta cuya publicación no está en la lista (más vieja que el
    // límite) se muestra suelta, para que no desaparezca del panel.
    const conPadre = new Set((posts || []).map((p) => p.id as string));
    for (const r of resp || []) {
      if (conPadre.has(r.post_id as string)) continue;
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
        imagen: null, video: null,
        esEquipo: delEquipo.has(r.autor_id as string),
        hilo: [],
        respondido: false,
        enlace: `/app/comunidad?post=${r.post_id as string}`,
      });
    }
    // Las publicaciones de los retos de comunidad también son de la comunidad.
    const { data: retoPosts } = await admin
      .from("comunidad_reto_posts")
      .select("id, user_id, texto, dia, reto_id, created_at, estado, media_url")
      .order("created_at", { ascending: false }).limit(200);

    if (retoPosts?.length) {
      const { data: retos } = await admin.from("comunidad_retos").select("id, titulo");
      const tituloReto = new Map((retos || []).map((r) => [r.id as string, r.titulo as string]));
      const perfilesReto = await perfilesDe([...new Set(retoPosts.map((r) => r.user_id as string))]);
      for (const r of retoPosts) {
        const per = perfilesReto.get(r.user_id as string);
        items.push({
          id: r.id as string, origen: "reto",
          autorId: r.user_id as string,
          autorNombre: (per?.full_name as string) || "Creador",
          autorAvatar: (per?.avatar_url as string) || null,
          grupo: grupoDe.get(r.user_id as string) || null,
          texto: r.texto as string,
          fecha: r.created_at as string,
          estado: ((r.estado as string) || "pendiente") as EstadoMod,
          dondeId: null,
          donde: `Reto · ${tituloReto.get(r.reto_id as string) || "de comunidad"} · día ${r.dia ?? "?"}`,
          moduloId: null, mundo: null,
          imagen: esVideo(r.media_url as string) ? null : ((r.media_url as string) || null),
          video: esVideo(r.media_url as string) ? (r.media_url as string) : null,
          esEquipo: delEquipo.has(r.user_id as string),
          hilo: [],
          respondido: false,
          enlace: "/app/comunidad",
        });
      }
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
    reto: "comunidad_reto_posts",
  } as const;

  for (const origen of ["clase", "post", "respuesta", "reto"] as const) {
    const ids = items.filter((i) => i.origen === origen).map((i) => i.id);
    if (!ids.length) continue;
    const { error } = await admin.from(tabla[origen]).update({ estado, oculto }).in("id", ids);
    if (error) return { error: "No se pudo aplicar la acción." };
  }
  return { ok: true, n: items.length };
}

// Responder desde el panel, sin entrar al curso ni al foro.
//
// La respuesta del equipo entra ya aprobada: hacer que Melissa o Alexia esperen
// a que alguien apruebe lo que ellas mismas escribieron no tiene sentido, y era
// parte de lo que tenía el panel atascado.
export async function responderModeracion(
  item: { id: string; origen: ItemModeracion["origen"] },
  texto: string
): Promise<{ ok: true } | { error: string }> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return { error: "No autorizado." };

  const t = texto.trim().slice(0, 2000);
  if (!t) return { error: "Escribe la respuesta." };

  const admin = createAdminClient();
  const yaAprobado = { estado: "aprobado" as const, oculto: false };

  if (item.origen === "clase") {
    const { data: padre } = await admin.from("clase_comentarios")
      .select("clase_id, autor_id, responde_a").eq("id", item.id).maybeSingle();
    if (!padre) return { error: "Ya no existe ese comentario." };
    // Si contestan a una respuesta, el hilo se mantiene plano bajo el original.
    const raiz = (padre.responde_a as string) || item.id;
    const { error } = await admin.from("clase_comentarios").insert({
      clase_id: padre.clase_id, autor_id: user.id, texto: t, responde_a: raiz, ...yaAprobado,
    });
    if (error) return { error: "No se pudo responder." };
    await avisar(admin, padre.autor_id as string, user.id, t, `/app/clase/${padre.clase_id as string}`);
    return { ok: true };
  }

  if (item.origen === "post" || item.origen === "respuesta") {
    let postId = item.id;
    let dueno: string | null = null;
    if (item.origen === "respuesta") {
      const { data: r } = await admin.from("foros_respuestas")
        .select("post_id, autor_id").eq("id", item.id).maybeSingle();
      if (!r) return { error: "Ya no existe esa respuesta." };
      postId = r.post_id as string;
      dueno = r.autor_id as string;
    } else {
      const { data: p } = await admin.from("foros_posts").select("autor_id").eq("id", item.id).maybeSingle();
      dueno = (p?.autor_id as string) ?? null;
    }
    const { error } = await admin.from("foros_respuestas").insert({
      post_id: postId, autor_id: user.id, texto: t, ...yaAprobado,
    });
    if (error) return { error: "No se pudo responder." };
    await avisar(admin, dueno, user.id, t, `/app/comunidad?post=${postId}`);
    return { ok: true };
  }

  // Las publicaciones de los retos de comunidad no llevan comentarios: ahí solo
  // se da "me gusta". Para no dejar al equipo sin respuesta, se le manda un
  // aviso directo a la alumna con lo que le quieren decir.
  const { data: rp } = await admin.from("comunidad_reto_posts")
    .select("user_id, reto_id").eq("id", item.id).maybeSingle();
  if (!rp) return { error: "Ya no existe esa publicación." };
  await avisar(admin, rp.user_id as string, user.id, t, "/app/comunidad");
  return { ok: true };
}

// Le avisa a la persona que el equipo le contestó.
async function avisar(
  admin: ReturnType<typeof createAdminClient>,
  paraId: string | null, deId: string, texto: string, href: string
): Promise<void> {
  if (!paraId || paraId === deId) return;
  const { data: yo } = await admin.from("profiles").select("full_name").eq("id", deId).maybeSingle();
  await notificar(paraId, "comentario",
    `${(yo?.full_name as string) || "El equipo"} te respondió`,
    texto.length > 90 ? texto.slice(0, 90) + "…" : texto, href);
}
