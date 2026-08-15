import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ETAPA_1 } from "@/lib/data";
import { getReto as getRetoCatalogo, type RetoDef, type PasoReto } from "@/lib/retos";

export type RetoTipo = "curso" | "semanal" | "grupal" | "personal";

export type RetoRow = {
  id: string;
  tipo: RetoTipo;
  clase_id: string | null;
  titulo: string;
  emoji: string | null;
  descripcion: string | null;
  intro: string | null;
  instrucciones: string | null;
  accion: string | null;
  revisa: string | null;
  xp: number;
  pasos: PasoReto[] | null;
  tips: { titulo: string; items: string[] } | null;
  sobre: string[] | null;
  ejemplo: RetoDef["ejemplo"] | null;
  consejo: string | null;
  activo: boolean;
  orden: number | null;
};

export const TIPO_LABEL: Record<RetoTipo, string> = {
  curso: "Reto de curso",
  semanal: "Reto de la semana",
  grupal: "Reto grupal",
  personal: "Reto personal",
};

const SOBRE_DEFAULT = [
  "Comparte tu avance con la comunidad.",
  "Inspira a otros y recibe apoyo en tu camino.",
  "Revisa los comentarios y conecta con creadores como tú.",
];
const EJEMPLO_DEFAULT: RetoDef["ejemplo"] = {
  autor: "Valentina L.",
  rol: "Creadora de contenido",
  tituloCard: "Mira otras publicaciones",
  bloques: [{ titulo: "Mi avance 💜", texto: "Apliqué lo aprendido y lo compartí con la comunidad." }],
};

// Convierte una fila de BD al formato que consume RetoVista.
export function rowToDef(r: RetoRow): RetoDef {
  const clase = r.clase_id ? ETAPA_1.flatMap((m) => m.clases).find((c) => c.id === r.clase_id) : null;
  return {
    claseId: r.id, // el id de la ruta /app/reto/[id] es el uuid del reto de BD
    modulo: clase?.titulo || TIPO_LABEL[r.tipo],
    titulo: r.titulo,
    emoji: r.emoji || "🎯",
    descripcion: r.descripcion || "",
    intro: r.intro || "",
    instrucciones: r.instrucciones || "",
    accion: r.accion || "compartirlo",
    revisa: (r.revisa as "sola" | "equipo") || "equipo",
    xp: r.xp ?? 50,
    pasos: (r.pasos && r.pasos.length ? r.pasos : [{ id: "respuesta", titulo: "Tu respuesta", tipo: "textarea", placeholder: "Escribe aquí...", max: 500 }]) as PasoReto[],
    tips: r.tips || { titulo: "Tips:", items: ["Sé claro", "Aplica lo aprendido", "Comparte con la comunidad"] },
    sobre: r.sobre && r.sobre.length ? r.sobre : SOBRE_DEFAULT,
    ejemplo: r.ejemplo || EJEMPLO_DEFAULT,
    consejo: r.consejo || "La constancia es lo que te lleva lejos. Un reto a la vez. 💜",
  };
}

// Lee un reto de BD por id (uuid). Devuelve null si no existe o está inactivo.
export async function getRetoDB(id: string): Promise<RetoDef | null> {
  // Los ids de catálogo ("1.1") no son uuid: evitamos consultar la BD con ellos.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("retos").select("*").eq("id", id).eq("activo", true).maybeSingle();
  return data ? rowToDef(data as RetoRow) : null;
}

// Reto genérico a partir de una clase del currículum (cursos_clases).
async function getRetoDeClase(id: string): Promise<RetoDef | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("cursos_clases").select("titulo, reto_texto, reto_instrucciones").eq("id", id).maybeSingle();
  if (!data) return null;
  const reto = (data.reto_texto as string) || `Aplica lo aprendido en «${data.titulo}» y compártelo.`;
  return {
    claseId: id,
    modulo: data.titulo as string,
    titulo: reto,
    emoji: "🎯",
    descripcion: "Pon en práctica lo de la clase y compártelo con la comunidad.",
    intro: "Completa este reto para afianzar lo aprendido y ganar XP.",
    instrucciones: (data.reto_instrucciones as string) || "",
    accion: "compartirlo",
    revisa: "equipo",
    xp: 50,
    pasos: [{ id: "respuesta", titulo: "Tu respuesta al reto", subtitulo: reto, tipo: "textarea", placeholder: "Escribe aquí tu respuesta...", max: 500 }],
    tips: { titulo: "Tips:", items: ["Sé claro", "Aplica lo de la clase", "Comparte con la comunidad"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: EJEMPLO_DEFAULT,
    consejo: "La constancia es lo que te lleva lejos. Un reto a la vez. 💜",
  };
}

// Resolutor unificado: reto de admin (BD) → reto de clase (currículum) → catálogo demo.
export async function getRetoUnificado(id: string): Promise<RetoDef | null> {
  const db = await getRetoDB(id);
  if (db) return db;
  const clase = await getRetoDeClase(id);
  if (clase) return clase;
  return getRetoCatalogo(id);
}

// Lista los retos de BD (activos) agrupados por tipo, para la vista de usuario.
export async function listarRetosPorTipo(): Promise<Record<RetoTipo, RetoRow[]>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("retos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  const out: Record<RetoTipo, RetoRow[]> = { semanal: [], grupal: [], personal: [], curso: [] };
  for (const r of (data || []) as RetoRow[]) out[r.tipo]?.push(r);
  return out;
}
