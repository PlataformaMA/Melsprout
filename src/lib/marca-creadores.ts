"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { miMarca } from "@/lib/marca-cuenta";
import { puedeVerCampania, puedeVerAplicacion } from "@/lib/acceso-campania";
import { notificar } from "@/lib/notificaciones-actions";

// Las creadoras, vistas por una marca.
//
// Solo se enseña lo que la creadora ya muestra en su perfil público de la
// comunidad: nombre, nicho, bio y redes. Nunca su correo ni su teléfono: si la
// marca quiere contactarla, lo pide al equipo.

export type CreadorFicha = {
  id: string;
  nombre: string;
  usuario: string | null;
  avatar: string | null;
  titular: string | null;
  nichos: string[];
  ciudad: string | null;
  pais: string | null;
  // Por red, lo que tenga conectado.
  redes: { red: string; usuario: string | null; seguidores: number }[];
  seguidores: number;
  engagement: number | null;
  campanias: number;
};

export type Postulacion = {
  id: string;
  creador: CreadorFicha;
  fecha: string;
  etapa: string;
  mensaje: string | null;
  enlace: string | null;
  respuestas: { pregunta: string; respuesta: string }[];
};

function fichaDe(p: Record<string, unknown>, campanias = 0): CreadorFicha {
  const redes = (p.redes as Record<string, { usuario?: string; seguidores?: number }>) || {};
  const lista = Object.entries(redes).map(([red, v]) => ({
    red,
    usuario: v?.usuario ?? null,
    seguidores: Number(v?.seguidores ?? 0),
  }));
  return {
    id: p.id as string,
    nombre: (p.full_name as string) || "Creador",
    usuario: (p.username as string) || null,
    avatar: (p.avatar_url as string) || null,
    titular: (p.headline as string) || null,
    nichos: [p.nicho as string].filter(Boolean) as string[],
    ciudad: (p.ciudad as string) || null,
    pais: (p.pais as string) || null,
    redes: lista,
    seguidores: lista.reduce((n, r) => n + r.seguidores, 0),
    engagement: null,
    campanias,
  };
}

// El Marketplace de la marca: busca creadoras entre las alumnas.
export async function buscarCreadores(
  texto = "", nichos: string[] = []
): Promise<CreadorFicha[]> {
  if (!(await miMarca())) return [];
  try {
    const admin = createAdminClient();
    let q = admin.from("profiles")
      .select("id, full_name, username, avatar_url, headline, nicho, ciudad, pais, redes")
      .eq("onboarding_completo", true)
      .neq("tipo", "empresa")
      .limit(60);

    if (texto.trim()) {
      const patron = `%${texto.trim().replace(/[%_\\]/g, (c) => "\\" + c)}%`;
      q = q.or(`full_name.ilike.${patron},headline.ilike.${patron},nicho.ilike.${patron}`);
    }
    if (nichos.length) q = q.in("nicho", nichos);

    const { data } = await q;
    if (!data?.length) return [];

    // Cuántas campañas lleva cada una: es lo que le interesa a la marca.
    const ids = data.map((p) => p.id as string);
    const { data: apps } = await admin
      .from("campania_aplicaciones").select("user_id").in("user_id", ids);
    const cuenta = new Map<string, number>();
    for (const a of apps || []) {
      const k = a.user_id as string;
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
    }

    return data.map((p) => fichaDe(p, cuenta.get(p.id as string) || 0));
  } catch {
    return [];
  }
}

export async function getCreador(id: string): Promise<CreadorFicha | null> {
  if (!(await miMarca())) return null;
  try {
    const { data } = await createAdminClient().from("profiles")
      .select("id, full_name, username, avatar_url, headline, bio, nicho, ciudad, pais, redes")
      .eq("id", id).maybeSingle();
    return data ? fichaDe(data) : null;
  } catch {
    return null;
  }
}

// La marca manda al equipo la lista de creadoras con las que quiere trabajar.
// No las contacta directo: el equipo hace de puente.
export async function solicitarCreadores(
  ids: string[], mensaje = ""
): Promise<{ ok: true } | { error: string }> {
  const marca = await miMarca();
  if (!marca) return { error: "Esta cuenta no es de una empresa." };
  if (ids.length === 0) return { error: "Selecciona al menos una creadora." };

  try {
    const admin = createAdminClient();
    const { data: perfiles } = await admin
      .from("profiles").select("full_name").in("id", ids.slice(0, 50));
    const nombres = (perfiles || []).map((p) => (p.full_name as string) || "Creador");

    const { data: equipo } = await admin.from("profiles").select("id").eq("is_admin", true);
    await Promise.all(
      (equipo || []).map((p) => notificar(p.id as string, "general",
        `${marca.nombre} quiere colaborar con ${nombres.length} ${nombres.length === 1 ? "creadora" : "creadoras"}`,
        `${nombres.slice(0, 6).join(", ")}${nombres.length > 6 ? "…" : ""}${mensaje ? ` · ${mensaje}` : ""}`,
        "/app/admin"))
    );
    return { ok: true };
  } catch {
    return { error: "No se pudo enviar la solicitud." };
  }
}

// ————— Quién se postuló a una campaña —————
export async function postulacionesDe(campaniaId: string): Promise<Postulacion[]> {
  // La dueña de la campaña, o el equipo. Si no, nadie ve postulaciones ajenas.
  if (!(await puedeVerCampania(campaniaId))) return [];
  try {
    const admin = createAdminClient();
    const { data: c } = await admin.from("campanias")
      .select("marca_id, preguntas").eq("id", campaniaId).maybeSingle();
    if (!c) return [];

    const preguntas = (c.preguntas as { id: string; texto: string }[]) || [];

    const { data } = await admin.from("campania_aplicaciones")
      .select("*")
      .eq("campania_id", campaniaId)
      .order("created_at", { ascending: false });
    if (!data?.length) return [];

    // Aparte: la postulación apunta a auth.users, no a profiles.
    const { data: perfiles } = await admin.from("profiles")
      .select("id, full_name, username, avatar_url, headline, nicho, ciudad, pais, redes")
      .in("id", data.map((a) => a.user_id as string));
    const pm = new Map((perfiles || []).map((x) => [x.id as string, x]));

    return data.map((a) => {
      const resp = (a.respuestas as Record<string, string>) || {};
      return {
        id: a.id as string,
        creador: fichaDe((pm.get(a.user_id as string) ?? { id: a.user_id }) as Record<string, unknown>),
        fecha: a.created_at as string,
        etapa: (a.etapa as string) || "postulada",
        mensaje: (a.mensaje as string) || null,
        enlace: (a.enlace as string) || null,
        respuestas: preguntas
          .filter((p) => resp[p.id])
          .map((p) => ({ pregunta: p.texto, respuesta: resp[p.id] })),
      };
    });
  } catch {
    return [];
  }
}

// Mover una postulación de etapa: seleccionarla o descartarla.
export async function moverPostulacion(
  id: string, etapa: "postulada" | "seleccionada" | "descartada"
): Promise<{ ok: true } | { error: string }> {
  if (!(await puedeVerAplicacion(id))) return { error: "Esa postulación no es tuya." };

  try {
    const admin = createAdminClient();
    const { data: a } = await admin.from("campania_aplicaciones")
      .select("user_id, campanias!inner(titulo, marca_id)").eq("id", id).maybeSingle();
    const c = a?.campanias as unknown as { titulo: string; marca_id: string } | undefined;
    if (!a) return { error: "Esa postulación no es tuya." };

    // El nombre de la marca para el aviso. No se saca de miMarca() porque
    // quien mueve la postulación puede ser el equipo, que no tiene marca.
    const { data: m } = await admin
      .from("marcas").select("nombre").eq("id", c?.marca_id as string).maybeSingle();
    const nombreMarca = (m?.nombre as string) || "La marca";

    const { error } = await admin.from("campania_aplicaciones")
      .update({
        etapa,
        estado: etapa === "seleccionada" ? "aceptada" : etapa === "descartada" ? "rechazada" : "enviada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { error: "No se pudo guardar." };

    if (etapa !== "postulada") {
      await notificar(a.user_id as string, "general",
        etapa === "seleccionada" ? "¡Te seleccionaron para una campaña! 🎉" : "Respuesta a tu postulación",
        etapa === "seleccionada"
          ? `${nombreMarca} te eligió para «${c?.titulo ?? "la campaña"}».`
          : `Esta vez no quedaste en «${c?.titulo ?? "la campaña"}». Hay más campañas abiertas.`,
        "/app/campanias");
    }
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar." };
  }
}
