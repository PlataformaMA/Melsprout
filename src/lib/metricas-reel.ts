"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  INSIGHTIQ_CONFIGURADO, crearUsuario, obtenerCuentas, obtenerContenidos,
} from "@/lib/insightiq";

// Las métricas del reel que la creadora publicó para una campaña.
//
// Hasta hoy la campaña se acababa cuando la marca aprobaba el video. Lo que
// pasó después —cuánta gente lo vio, si funcionó— se quedaba en Instagram.
// Es justo el dato que le sirve a ella para cobrar mejor la próxima vez.
//
// Los números NO se escriben a mano: se leen de la cuenta que ella misma
// conectó, y por eso también se guarda cuándo se leyeron.

export type MetricasReel = {
  vistas: number | null;
  likes: number | null;
  comentarios: number | null;
  compartidos: number | null;
  engagement: number | null;
};

export type Reel = {
  colaboracionId: string;
  campania: string;
  marca: string;
  url: string | null;
  titulo: string | null;
  descripcion: string | null;
  portada: string | null;
  publicadoAt: string | null;
  duracion: number | null;
  metricas: MetricasReel | null;
  leidasAt: string | null;
  // Cuánto se sale del promedio de la campaña, en porcentaje. null cuando no
  // hay con quién compararse: una sola creadora no tiene promedio.
  contraPromedio: Partial<Record<keyof MetricasReel, number>> | null;
};

async function yo() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  return user;
}

// La colaboración, su campaña y su dueña, de un viaje.
async function contexto(colaboracionId: string) {
  const { data } = await createAdminClient()
    .from("campania_colaboraciones")
    // Una sola cadena literal: partida con + el cliente tipado pierde el tipo
    // y devuelve GenericStringError en vez de las columnas.
    .select("id, post_url, post_titulo, post_descripcion, post_portada, post_publicado_at, post_duracion, post_metricas, post_metricas_at, campania_aplicaciones!inner(user_id, campania_id, campanias!inner(titulo, marcas!inner(nombre)))")
    .eq("id", colaboracionId)
    .maybeSingle();
  if (!data) return null;

  const a = data.campania_aplicaciones as unknown as {
    user_id: string; campania_id: string;
    campanias: { titulo: string; marcas: { nombre: string } };
  };
  return { fila: data as Record<string, unknown>, app: a };
}

function metricasDe(v: unknown): MetricasReel | null {
  if (!v || typeof v !== "object") return null;
  const m = v as Record<string, unknown>;
  const n = (k: string) => (typeof m[k] === "number" ? (m[k] as number) : null);
  return {
    vistas: n("vistas"), likes: n("likes"), comentarios: n("comentarios"),
    compartidos: n("compartidos"), engagement: n("engagement"),
  };
}

// El engagement del reel: lo que reaccionó entre lo que lo vio. Si no hay
// vistas no se inventa un porcentaje sobre seguidores — serían dos cosas
// distintas con el mismo nombre.
function engagementDe(
  vistas: number | null, likes: number | null,
  comentarios: number | null, compartidos: number | null
): number | null {
  if (!vistas || vistas <= 0) return null;
  const reacciones = (likes || 0) + (comentarios || 0) + (compartidos || 0);
  return Math.round((reacciones / vistas) * 1000) / 10;
}

// Dos URLs de Instagram son la misma aunque una traiga ?igsh=… y la otra no.
function mismaUrl(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const limpia = (u: string) =>
    u.trim().toLowerCase().split("?")[0].replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/, "");
  return limpia(a) === limpia(b);
}

// ————————————————— Leer —————————————————

export async function miReel(colaboracionId: string): Promise<Reel | null> {
  const user = await yo();
  if (!user) return null;

  const ctx = await contexto(colaboracionId);
  if (!ctx || ctx.app.user_id !== user.id) return null;

  return armar(colaboracionId, ctx, await promedios(ctx.app.campania_id, colaboracionId));
}

function armar(
  colaboracionId: string,
  ctx: NonNullable<Awaited<ReturnType<typeof contexto>>>,
  promedio: MetricasReel | null,
): Reel {
  const f = ctx.fila;
  const metricas = metricasDe(f.post_metricas);

  let contra: Reel["contraPromedio"] = null;
  if (metricas && promedio) {
    contra = {};
    for (const k of ["vistas", "likes", "comentarios", "compartidos", "engagement"] as const) {
      const mio = metricas[k];
      const med = promedio[k];
      // Sin promedio, o con promedio cero, el porcentaje no significa nada.
      if (mio == null || med == null || med <= 0) continue;
      contra[k] = Math.round(((mio - med) / med) * 1000) / 10;
    }
    if (Object.keys(contra).length === 0) contra = null;
  }

  return {
    colaboracionId,
    campania: ctx.app.campanias?.titulo || "la campaña",
    marca: ctx.app.campanias?.marcas?.nombre || "",
    url: (f.post_url as string) || null,
    titulo: (f.post_titulo as string) || null,
    descripcion: (f.post_descripcion as string) || null,
    portada: (f.post_portada as string) || null,
    publicadoAt: (f.post_publicado_at as string) || null,
    duracion: (f.post_duracion as number) ?? null,
    metricas,
    leidasAt: (f.post_metricas_at as string) || null,
    contraPromedio: contra,
  };
}

// El promedio de la campaña, SIN contar el reel que se está mirando: si no,
// cada quien se compara consigo misma y el porcentaje se aplana.
async function promedios(
  campaniaId: string, exceptoColaboracion: string
): Promise<MetricasReel | null> {
  try {
    const { data } = await createAdminClient()
      .from("campania_colaboraciones")
      .select("id, post_metricas, campania_aplicaciones!inner(campania_id)")
      .eq("campania_aplicaciones.campania_id", campaniaId)
      .not("post_metricas", "is", null);
    if (!data?.length) return null;

    const otras = data
      .filter((r) => r.id !== exceptoColaboracion)
      .map((r) => metricasDe(r.post_metricas))
      .filter(Boolean) as MetricasReel[];
    if (otras.length === 0) return null;

    const medio = (k: keyof MetricasReel): number | null => {
      const vals = otras.map((m) => m[k]).filter((v): v is number => v != null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    return {
      vistas: medio("vistas"), likes: medio("likes"), comentarios: medio("comentarios"),
      compartidos: medio("compartidos"), engagement: medio("engagement"),
    };
  } catch {
    return null;
  }
}

// ————————————————— Escribir —————————————————

// La creadora pega el enlace de su reel. Es la única que sabe cuál de todos
// sus posts es el de esta campaña, y por eso no se adivina por fecha.
export async function guardarEnlaceReel(
  colaboracionId: string, url: string
): Promise<{ ok: true } | { error: string }> {
  const user = await yo();
  if (!user) return { error: "Inicia sesión." };

  const ctx = await contexto(colaboracionId);
  if (!ctx || ctx.app.user_id !== user.id) return { error: "Esta campaña no es tuya." };

  const limpia = url.trim();
  if (limpia && !/^https?:\/\//i.test(limpia)) {
    return { error: "Pega el enlace completo, empezando por https://" };
  }

  const { error } = await createAdminClient()
    .from("campania_colaboraciones")
    .update({
      post_url: limpia || null,
      // Enlace nuevo, métricas viejas: se tiran, si no se enseñarían los
      // números del reel anterior junto a la miniatura del nuevo.
      post_metricas: null, post_metricas_at: null,
      post_titulo: null, post_descripcion: null, post_portada: null,
      post_publicado_at: null, post_duracion: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", colaboracionId);
  if (error) return { error: "No se pudo guardar el enlace." };

  if (limpia) await sincronizarReel(colaboracionId);
  return { ok: true };
}

// Trae de InsightIQ los números del reel. Solo lee de la cuenta que ella
// conectó: si no hay red conectada, no hay nada que leer y se dice así.
export async function sincronizarReel(
  colaboracionId: string
): Promise<{ ok: true } | { error: string }> {
  const user = await yo();
  if (!user) return { error: "Inicia sesión." };

  const ctx = await contexto(colaboracionId);
  if (!ctx || ctx.app.user_id !== user.id) return { error: "Esta campaña no es tuya." };

  const url = (ctx.fila.post_url as string) || "";
  if (!url) return { error: "Primero pega el enlace de tu reel." };
  if (!INSIGHTIQ_CONFIGURADO) {
    return { error: "La lectura de métricas todavía no está habilitada." };
  }

  try {
    const iqUserId = await crearUsuario(user.id, "creador");
    if (!iqUserId) return { error: "No pudimos leer tus métricas." };

    const cuentas = await obtenerCuentas(iqUserId);
    if (!cuentas.length) {
      return { error: "Conecta tu red social en tu perfil para ver las métricas de tu reel." };
    }

    for (const cuenta of cuentas) {
      const contenidos = await obtenerContenidos(cuenta.accountId);
      const reel = contenidos.find((c) => mismaUrl(c.url, url));
      if (!reel) continue;

      const engagement = engagementDe(reel.vistas, reel.likes, reel.comentarios, reel.compartidos);
      const { error } = await createAdminClient()
        .from("campania_colaboraciones")
        .update({
          post_titulo: reel.titulo,
          post_descripcion: reel.descripcion,
          post_portada: reel.portada,
          post_publicado_at: reel.publicadoAt,
          post_duracion: reel.duracion,
          post_metricas: {
            vistas: reel.vistas, likes: reel.likes, comentarios: reel.comentarios,
            compartidos: reel.compartidos, engagement,
          },
          post_metricas_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", colaboracionId);
      if (error) return { error: "No se pudieron guardar las métricas." };
      return { ok: true };
    }

    return {
      error: "No encontramos ese reel en tu cuenta conectada. Revisa que el enlace sea " +
             "de la red que conectaste y que la publicación sea pública.",
    };
  } catch {
    return { error: "No pudimos leer tus métricas. Inténtalo de nuevo en un momento." };
  }
}

// ————————————————— La pestaña completa —————————————————

// Todas sus colaboraciones que ya llegaron a la parte de publicar: es lo que
// alimenta la pestaña «Métricas» de Campañas.
export async function misReels(): Promise<Reel[]> {
  const user = await yo();
  if (!user) return [];
  try {
    const { data } = await createAdminClient()
      .from("campania_colaboraciones")
      .select("id, campania_aplicaciones!inner(user_id, etapa)")
      .eq("campania_aplicaciones.user_id", user.id)
      .eq("campania_aplicaciones.etapa", "seleccionada")
      .order("created_at", { ascending: false })
      .limit(30);
    if (!data?.length) return [];

    const reels: Reel[] = [];
    for (const fila of data) {
      const r = await miReel(fila.id as string);
      if (r) reels.push(r);
    }
    // Primero las que ya tienen números: es lo que se vino a ver.
    return reels.sort((a, b) => Number(!!b.metricas) - Number(!!a.metricas));
  } catch {
    return [];
  }
}
