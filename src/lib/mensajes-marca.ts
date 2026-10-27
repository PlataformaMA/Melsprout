"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { miMarca } from "@/lib/marca-cuenta";
import { notificar } from "@/lib/notificaciones-actions";

// La conversación entre el equipo y cada marca.
//
// Un solo hilo por marca. Lo abren los dos lados: el equipo desde su panel y
// la empresa desde el suyo. Quien escribe se guarda como 'equipo' o 'marca',
// que es lo único que hace falta para pintar el chat.

type Quien =
  | { tipo: "equipo"; userId: string }
  | { tipo: "marca"; userId: string; marcaId: string }
  | null;

// Quién está preguntando y de qué lado del hilo está.
async function quienEscribe(): Promise<Quien> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (await esAdminUsuario(user.id, user.email)) return { tipo: "equipo", userId: user.id };
  const marca = await miMarca();
  return marca ? { tipo: "marca", userId: user.id, marcaId: marca.id } : null;
}

// ¿Puede entrar a ESTE hilo? El equipo a todos; una empresa solo al suyo.
async function puedeEntrar(marcaId: string): Promise<Quien> {
  const q = await quienEscribe();
  if (!q) return null;
  if (q.tipo === "equipo") return q;
  return q.marcaId === marcaId ? q : null;
}

export type Conversacion = {
  marcaId: string;
  nombre: string;
  logoUrl: string | null;
  categoria: string | null;
  ultimo: string | null;
  fecha: string | null;
  sinLeer: number;
};

// La lista de la izquierda: una marca por renglón, la más reciente arriba.
export async function conversaciones(): Promise<Conversacion[]> {
  const q = await quienEscribe();
  if (q?.tipo !== "equipo") return [];
  const db = createAdminClient();

  try {
    const { data: marcas } = await db
      .from("marcas").select("id, nombre, logo_url, categoria").order("nombre");
    if (!marcas?.length) return [];

    // Aparte y tolerante: si la migración 79 todavía no corre, la tabla no
    // existe. Entonces se enseña la lista de marcas sin conversación, que es
    // la verdad, en vez de una bandeja vacía que parece que no hay marcas.
    const { data: msgs } = await db
      .from("marca_mensajes")
      .select("marca_id, texto, adjuntos, created_at, autor_tipo, leido_equipo")
      .order("created_at", { ascending: false })
      .then((r) => r, () => ({ data: null }));

    const ultimo = new Map<string, { texto: string; fecha: string }>();
    const sinLeer = new Map<string, number>();
    for (const m of msgs || []) {
      const k = m.marca_id as string;
      if (!ultimo.has(k)) {
        const adj = (m.adjuntos as unknown[]) || [];
        ultimo.set(k, {
          texto: (m.texto as string) || (adj.length ? "📎 Archivo adjunto" : ""),
          fecha: m.created_at as string,
        });
      }
      if (m.autor_tipo === "marca" && m.leido_equipo !== true) {
        sinLeer.set(k, (sinLeer.get(k) || 0) + 1);
      }
    }

    return marcas
      .map((m) => {
        const u = ultimo.get(m.id as string);
        return {
          marcaId: m.id as string,
          nombre: m.nombre as string,
          logoUrl: (m.logo_url as string) || null,
          categoria: (m.categoria as string) || null,
          ultimo: u?.texto ?? null,
          fecha: u?.fecha ?? null,
          sinLeer: sinLeer.get(m.id as string) || 0,
        };
      })
      // Las que tienen conversación primero, y de esas la más fresca arriba.
      .sort((a, b) => {
        if (!!a.fecha !== !!b.fecha) return a.fecha ? -1 : 1;
        if (a.fecha && b.fecha) return b.fecha.localeCompare(a.fecha);
        return a.nombre.localeCompare(b.nombre);
      });
  } catch (e) {
    console.error("[mensajes] conversaciones:", e);
    return [];
  }
}

export type CreadorEnMensaje = {
  id: string; nombre: string; usuario: string | null; avatar: string | null;
  ciudad: string | null; pais: string | null; redes: string[];
};

export type Mensaje = {
  id: string;
  autorTipo: string;
  autorNombre: string;
  texto: string | null;
  adjuntos: { ruta: string; nombre: string; peso: number | null }[];
  creador: CreadorEnMensaje | null;
  fecha: string;
};

export async function mensajesDe(marcaId: string): Promise<Mensaje[]> {
  if (!(await puedeEntrar(marcaId))) return [];
  const db = createAdminClient();

  try {
    const { data } = await db
      .from("marca_mensajes")
      .select("id, autor_tipo, autor_id, texto, adjuntos, creador_id, created_at")
      .eq("marca_id", marcaId)
      .order("created_at", { ascending: true })
      .limit(300);
    if (!data?.length) return [];

    // Los nombres van aparte: los mensajes apuntan a auth.users, no a profiles.
    const ids = [...new Set([
      ...data.map((m) => m.autor_id as string),
      ...data.map((m) => m.creador_id as string),
    ].filter(Boolean))];
    const { data: perfiles } = await db
      .from("profiles").select("id, full_name, username, avatar_url, ciudad, pais, redes").in("id", ids);
    const perfil = new Map((perfiles || []).map((p) => [p.id as string, p]));

    return data.map((m) => {
      const c = m.creador_id ? perfil.get(m.creador_id as string) : null;
      return {
        id: m.id as string,
        autorTipo: (m.autor_tipo as string) || "equipo",
        autorNombre: (perfil.get(m.autor_id as string)?.full_name as string)
          || (m.autor_tipo === "marca" ? "La marca" : "Boost Academy"),
        texto: (m.texto as string) || null,
        adjuntos: ((m.adjuntos as { ruta: string; nombre: string; peso: number | null }[]) || []),
        creador: c
          ? {
              id: c.id as string,
              nombre: (c.full_name as string) || "Creador",
              usuario: (c.username as string) || null,
              avatar: (c.avatar_url as string) || null,
              ciudad: (c.ciudad as string) || null,
              pais: (c.pais as string) || null,
              redes: Object.keys((c.redes as Record<string, unknown>) || {}),
            }
          : null,
        fecha: m.created_at as string,
      };
    });
  } catch (e) {
    console.error("[mensajes] hilo:", e);
    return [];
  }
}

export async function enviarMensaje(
  marcaId: string,
  texto: string,
  adjuntos: { ruta: string; nombre: string; peso: number | null }[] = [],
): Promise<{ ok: true } | { error: string }> {
  const q = await puedeEntrar(marcaId);
  if (!q) return { error: "No puedes escribir en esta conversación." };
  if (!texto.trim() && adjuntos.length === 0) return { error: "Escribe algo antes de mandar." };

  // Que los adjuntos sean de este hilo: la ruta la firmó el servidor con este
  // prefijo, así que una ruta de otra marca no se cuela.
  if (adjuntos.some((a) => !a.ruta.startsWith(`${marcaId}/`))) {
    return { error: "Adjunto inválido." };
  }

  const db = createAdminClient();
  const { error } = await db.from("marca_mensajes").insert({
    marca_id: marcaId,
    autor_tipo: q.tipo,
    autor_id: q.userId,
    texto: texto.trim() || null,
    adjuntos,
    // Lo que uno escribe ya está leído de su lado.
    leido_equipo: q.tipo === "equipo",
    leido_marca: q.tipo === "marca",
  });
  if (error) {
    console.error("[mensajes] enviar:", error.message);
    return { error: "No se pudo mandar. Puede que falte correr la migración 79." };
  }

  await avisarAlOtroLado(db, marcaId, q.tipo, texto.trim());
  return { ok: true };
}

// El aviso le llega a quien NO escribió: si no, la conversación se queda ahí
// hasta que alguien se acuerde de entrar a verla.
async function avisarAlOtroLado(
  db: ReturnType<typeof createAdminClient>,
  marcaId: string,
  quienEscribio: "equipo" | "marca",
  texto: string,
) {
  try {
    const { data: m } = await db
      .from("marcas").select("nombre, dueno_id").eq("id", marcaId).maybeSingle();
    if (!m) return;
    const resumen = texto.slice(0, 120) || "Te mandaron un archivo.";

    if (quienEscribio === "equipo") {
      if (m.dueno_id) {
        await notificar(m.dueno_id as string, "general",
          "Mensaje del equipo de Melsprout 💬", resumen, "/app/marca/mensajes");
      }
      return;
    }

    const { data: equipo } = await db.from("profiles").select("id").eq("is_admin", true);
    await Promise.all((equipo || []).map((p) => notificar(p.id as string, "general",
      `Mensaje de ${m.nombre} 💬`, resumen,
      `/app/admin/marketplace/mensajes?marca=${marcaId}`)));
  } catch {
    // Un aviso que no sale no debe tumbar el mensaje, que ya quedó guardado.
  }
}

// Dejar el hilo como leído por el lado de quien lo abrió.
export async function marcarLeidos(marcaId: string): Promise<void> {
  const q = await puedeEntrar(marcaId);
  if (!q) return;
  try {
    const db = createAdminClient();
    if (q.tipo === "equipo") {
      await db.from("marca_mensajes").update({ leido_equipo: true })
        .eq("marca_id", marcaId).eq("autor_tipo", "marca").eq("leido_equipo", false);
    } else {
      await db.from("marca_mensajes").update({ leido_marca: true })
        .eq("marca_id", marcaId).eq("autor_tipo", "equipo").eq("leido_marca", false);
    }
  } catch {
    // Si falla, lo peor que pasa es que el punto azul siga ahí.
  }
}

// ————— Adjuntos —————

const ADJUNTO_MB = 10;
const ADJUNTO_TIPOS = ["png", "jpg", "jpeg", "webp", "pdf", "doc", "docx", "xls", "xlsx"];

export async function urlParaAdjunto(
  marcaId: string, nombre: string, peso: number,
): Promise<{ ruta: string; token: string } | { error: string }> {
  if (!(await puedeEntrar(marcaId))) return { error: "No autorizado." };

  const ext = (nombre.split(".").pop() || "").toLowerCase();
  if (!ADJUNTO_TIPOS.includes(ext)) {
    return { error: `Ese archivo no se puede adjuntar. Se aceptan: ${ADJUNTO_TIPOS.join(", ").toUpperCase()}.` };
  }
  if (peso > ADJUNTO_MB * 1024 * 1024) return { error: `El archivo pasa de ${ADJUNTO_MB} MB.` };

  const ruta = `${marcaId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from("mensajes").createSignedUploadUrl(ruta);
  if (error || !data) return { error: "No se pudo preparar la subida." };
  return { ruta, token: data.token };
}

export async function urlDeAdjunto(marcaId: string, ruta: string): Promise<string | null> {
  if (!(await puedeEntrar(marcaId))) return null;
  if (!ruta.startsWith(`${marcaId}/`)) return null;
  try {
    const { data } = await createAdminClient()
      .storage.from("mensajes").createSignedUrl(ruta, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

// ————— El lado de la empresa —————

export type MiHilo = { marcaId: string; nombre: string; logoUrl: string | null; mensajes: Mensaje[] };

export async function miHilo(): Promise<MiHilo | null> {
  const marca = await miMarca();
  if (!marca) return null;
  return {
    marcaId: marca.id,
    nombre: marca.nombre,
    logoUrl: marca.logoUrl,
    mensajes: await mensajesDe(marca.id),
  };
}
