"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

// Los enlaces de embajador de una campaña de afiliados.
//
// El enlace que se comparte es nuestro (melsprout.boostacademy.io/r/abc123),
// no el de Hotmart. Así podemos contar el clic y, de paso, cambiar a dónde
// manda sin que nadie tenga que volver a publicar su enlace.

const SITIO = (() => {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) return env;
  return "https://melsprout.boostacademy.io";
})();

// Sin i, l, 1, o ni 0: el código se dicta en voz alta y se escribe a mano.
const LETRAS = "abcdefghjkmnpqrstuvwxyz23456789";

function codigoNuevo(largo = 7): string {
  const n = new Uint8Array(largo);
  crypto.getRandomValues(n);
  return Array.from(n, (x) => LETRAS[x % LETRAS.length]).join("");
}

export type MiEnlace = {
  codigo: string;
  url: string;
  clics: number;
  ventas: number;
  destino: string | null;
};

// A dónde manda el enlace: lo que diga la campaña, o el checkout del curso.
async function destinoDe(
  db: ReturnType<typeof createAdminClient>, campaniaId: string,
): Promise<string | null> {
  const { data: c } = await db
    .from("campanias").select("enlace_destino, requiere_curso").eq("id", campaniaId).maybeSingle();
  if (!c) return null;
  if (c.enlace_destino) return c.enlace_destino as string;
  if (!c.requiere_curso) return null;
  const { data: m } = await db
    .from("cursos_modulos").select("checkout_url").eq("id", c.requiere_curso as string).maybeSingle();
  return (m?.checkout_url as string) || null;
}

// El enlace de quien está usando la plataforma. Se crea la primera vez que lo
// pide: no tiene caso generar enlaces para gente que todavía no quedó.
export async function miEnlace(campaniaId: string): Promise<MiEnlace | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const db = createAdminClient();
  try {
    // Solo quien quedó seleccionada tiene enlace: es el premio de haber
    // quedado, no algo que se reparta a todo el que se postula.
    const { data: app } = await db
      .from("campania_aplicaciones").select("etapa")
      .eq("campania_id", campaniaId).eq("user_id", user.id).maybeSingle();
    if (!app || app.etapa !== "seleccionada") {
      return { error: "Tu enlace aparece aquí en cuanto quedes seleccionada en la campaña." };
    }

    const destino = await destinoDe(db, campaniaId);

    const { data: ya } = await db
      .from("campania_enlaces").select("codigo, clics, ventas")
      .eq("campania_id", campaniaId).eq("user_id", user.id).maybeSingle();
    if (ya) {
      return {
        codigo: ya.codigo as string,
        url: `${SITIO}/r/${ya.codigo as string}`,
        clics: (ya.clics as number) || 0,
        ventas: (ya.ventas as number) || 0,
        destino,
      };
    }

    // Se intenta un par de veces por si el código ya existía: con 31^7 es
    // rarísimo, pero el choque se resuelve solo en vez de dar error.
    for (let intento = 0; intento < 5; intento++) {
      const codigo = codigoNuevo();
      const { error } = await db.from("campania_enlaces")
        .insert({ campania_id: campaniaId, user_id: user.id, codigo });
      if (!error) {
        return { codigo, url: `${SITIO}/r/${codigo}`, clics: 0, ventas: 0, destino };
      }
      // 23505 = llave repetida. Si es la de (campania, user), ya lo creó otra
      // pestaña: se vuelve a leer y listo.
      if (error.code !== "23505") break;
      const { data: otro } = await db
        .from("campania_enlaces").select("codigo, clics, ventas")
        .eq("campania_id", campaniaId).eq("user_id", user.id).maybeSingle();
      if (otro) {
        return {
          codigo: otro.codigo as string,
          url: `${SITIO}/r/${otro.codigo as string}`,
          clics: (otro.clics as number) || 0,
          ventas: (otro.ventas as number) || 0,
          destino,
        };
      }
    }
    return { error: "No se pudo generar tu enlace. Vuelve a intentarlo." };
  } catch (e) {
    console.error("[enlaces] miEnlace:", e);
    return { error: "No se pudo generar tu enlace. Puede que falte correr la migración 81." };
  }
}

export type EnlaceDeCampania = {
  userId: string;
  nombre: string;
  usuario: string | null;
  avatar: string | null;
  codigo: string;
  url: string;
  clics: number;
  ventas: number;
  ultimoClic: string | null;
};

// La tabla que ve el equipo: quién movió qué.
export async function enlacesDeCampania(campaniaId: string): Promise<EnlaceDeCampania[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { puedeVerCampania } = await import("@/lib/acceso-campania");
  if (!(await puedeVerCampania(campaniaId))) return [];

  const db = createAdminClient();
  try {
    const { data } = await db
      .from("campania_enlaces")
      .select("user_id, codigo, clics, ventas, ultimo_clic")
      .eq("campania_id", campaniaId)
      .order("ventas", { ascending: false })
      .order("clics", { ascending: false });
    if (!data?.length) return [];

    const { data: perfiles } = await db
      .from("profiles").select("id, full_name, username, avatar_url")
      .in("id", data.map((e) => e.user_id as string));
    const perfil = new Map((perfiles || []).map((p) => [p.id as string, p]));

    return data.map((e) => {
      const p = perfil.get(e.user_id as string);
      return {
        userId: e.user_id as string,
        nombre: (p?.full_name as string) || "Creador",
        usuario: (p?.username as string) || null,
        avatar: (p?.avatar_url as string) || null,
        codigo: e.codigo as string,
        url: `${SITIO}/r/${e.codigo as string}`,
        clics: (e.clics as number) || 0,
        ventas: (e.ventas as number) || 0,
        ultimoClic: (e.ultimo_clic as string) || null,
      };
    });
  } catch {
    return [];
  }
}

// Generar de golpe los enlaces de toda la gente seleccionada, para no esperar
// a que cada quien entre a pedirlo.
export async function generarEnlacesFaltantes(
  campaniaId: string,
): Promise<{ creados: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return { error: "No autorizado." };

  const db = createAdminClient();
  try {
    const { data: seleccionadas } = await db
      .from("campania_aplicaciones").select("user_id")
      .eq("campania_id", campaniaId).eq("etapa", "seleccionada");
    if (!seleccionadas?.length) return { creados: 0 };

    const { data: tienen } = await db
      .from("campania_enlaces").select("user_id").eq("campania_id", campaniaId);
    const ya = new Set((tienen || []).map((e) => e.user_id as string));

    const faltan = seleccionadas
      .map((a) => a.user_id as string)
      .filter((id) => !ya.has(id));
    if (!faltan.length) return { creados: 0 };

    const { error } = await db.from("campania_enlaces")
      .insert(faltan.map((user_id) => ({ campania_id: campaniaId, user_id, codigo: codigoNuevo() })));
    if (error) return { error: "No se pudieron generar los enlaces." };
    return { creados: faltan.length };
  } catch {
    return { error: "No se pudieron generar los enlaces. Puede que falte la migración 81." };
  }
}
