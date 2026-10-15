"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { nivelPorXP } from "@/lib/data";

// Marketplace: marcas, campañas y aplicaciones.
//
// Mientras no se corra supabase/72_marketplace.sql las tablas no existen y
// todo esto devuelve vacío en vez de reventar: así la sección se puede
// desplegar antes que la migración, sin tumbar nada.

export type Marca = {
  id: string;
  nombre: string;
  lema: string | null;
  categoria: string | null;
  logoUrl: string | null;
  destacada: boolean;
  // Se calculan a partir de sus campañas, no se guardan a mano.
  activas: number;
  total: number;
  creadores: number;
};

export type Campania = {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  marca: string;
  marcaId: string;
  categoria: string | null;
  etiquetas: string[];
  plataformas: string[];
  pagoMin: number | null;
  pagoMax: number | null;
  moneda: string;
  popular: boolean;
  nivelMinimo: number;
  cierraAt: string | null;
  aplicantes: number;
  // Lo mío: si ya apliqué y cómo va.
  miEstado: "enviada" | "aceptada" | "rechazada" | null;
  // Me falta nivel para esta campaña.
  bajoNivel: boolean;
};

export type Filtros = {
  texto?: string;
  categorias?: string[];
  plataformas?: string[];
  tipos?: string[];
  orden?: "nuevas" | "pago" | "cierre";
  pagina?: number;
};

// Sin export: en un archivo "use server" solo se exportan funciones async.
const POR_PAGINA = 6;

// Las listas de los filtros, tal cual el diseño.
export async function opcionesDeFiltro(): Promise<{
  categorias: string[]; plataformas: string[]; tipos: string[];
}> {
  return {
    categorias: [
      "Belleza", "Moda", "Comida y Bebidas", "Fitness y Bienestar", "Viajes",
      "Hogar y Vida", "Tecnología", "Finanzas", "E-commerce", "Educación",
      "Salud", "Entretenimiento",
    ],
    plataformas: ["Instagram", "TikTok", "YouTube", "Twitter"],
    tipos: ["UGC", "Post patrocinado", "Embajador", "Reseña"],
  };
}

async function quienSoy() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function listarCampanias(
  f: Filtros = {}
): Promise<{ campanias: Campania[]; paginas: number }> {
  const vacio = { campanias: [], paginas: 1 };
  const user = await quienSoy();
  if (!user) return vacio;

  try {
    const admin = createAdminClient();
    let q = admin
      .from("campanias")
      .select("*, marcas!inner(id, nombre)")
      .eq("activa", true);

    if (f.texto?.trim()) {
      const patron = `%${f.texto.trim().replace(/[%_\\]/g, (c) => "\\" + c)}%`;
      q = q.or(`titulo.ilike.${patron},descripcion.ilike.${patron}`);
    }
    if (f.categorias?.length) q = q.in("categoria", f.categorias);
    if (f.plataformas?.length) q = q.overlaps("plataformas", f.plataformas);
    if (f.tipos?.length) q = q.overlaps("etiquetas", f.tipos);

    q = f.orden === "pago"
      ? q.order("pago_max", { ascending: false, nullsFirst: false })
      : f.orden === "cierre"
        ? q.order("cierra_at", { ascending: true, nullsFirst: false })
        : q.order("created_at", { ascending: false });

    const { data, error } = await q.limit(200);
    if (error || !data) return vacio;

    // Cuántas personas aplicaron a cada una, y en cuáles estoy yo.
    const ids = data.map((c) => c.id as string);
    const [{ data: todas }, { data: mias }, { data: perfil }] = await Promise.all([
      admin.from("campania_aplicaciones").select("campania_id").in("campania_id", ids.length ? ids : ["_"]),
      admin.from("campania_aplicaciones").select("campania_id, estado").eq("user_id", user.id),
      admin.from("profiles").select("xp").eq("id", user.id).maybeSingle(),
    ]);
    const cuenta = new Map<string, number>();
    for (const a of todas || []) {
      const k = a.campania_id as string;
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
    }
    const mioPor = new Map((mias || []).map((a) => [a.campania_id as string, a.estado as string]));
    const miNivel = nivelPorXP((perfil?.xp as number) || 0).actual.nivel;

    const todasLasPaginas = data.map((c): Campania => {
      const marca = c.marcas as unknown as { id: string; nombre: string };
      return {
        id: c.id as string,
        titulo: c.titulo as string,
        descripcion: (c.descripcion as string) || null,
        imagenUrl: (c.imagen_url as string) || null,
        marca: marca?.nombre ?? "Marca",
        marcaId: marca?.id ?? "",
        categoria: (c.categoria as string) || null,
        etiquetas: (c.etiquetas as string[]) || [],
        plataformas: (c.plataformas as string[]) || [],
        pagoMin: (c.pago_min as number) ?? null,
        pagoMax: (c.pago_max as number) ?? null,
        moneda: (c.moneda as string) || "USD",
        popular: c.popular === true,
        nivelMinimo: (c.nivel_minimo as number) || 0,
        cierraAt: (c.cierra_at as string) || null,
        aplicantes: cuenta.get(c.id as string) || 0,
        miEstado: (mioPor.get(c.id as string) as Campania["miEstado"]) ?? null,
        bajoNivel: ((c.nivel_minimo as number) || 0) > miNivel,
      };
    });

    const pagina = Math.max(1, f.pagina ?? 1);
    const paginas = Math.max(1, Math.ceil(todasLasPaginas.length / POR_PAGINA));
    const desde = (pagina - 1) * POR_PAGINA;
    return { campanias: todasLasPaginas.slice(desde, desde + POR_PAGINA), paginas };
  } catch {
    return vacio;
  }
}

export async function listarMarcas(
  texto = "", categorias: string[] = [], pagina = 1
): Promise<{ marcas: Marca[]; paginas: number }> {
  const vacio = { marcas: [], paginas: 1 };
  if (!(await quienSoy())) return vacio;

  try {
    const admin = createAdminClient();
    let q = admin.from("marcas").select("*").eq("activa", true)
      .order("destacada", { ascending: false }).order("nombre");
    if (texto.trim()) {
      const patron = `%${texto.trim().replace(/[%_\\]/g, (c) => "\\" + c)}%`;
      q = q.or(`nombre.ilike.${patron},lema.ilike.${patron}`);
    }
    if (categorias.length) q = q.in("categoria", categorias);

    const { data, error } = await q.limit(120);
    if (error || !data) return vacio;

    // Los números de cada tarjeta salen de sus campañas, no se escriben a mano.
    const ids = data.map((m) => m.id as string);
    const { data: camps } = await admin
      .from("campanias").select("id, marca_id, activa").in("marca_id", ids.length ? ids : ["_"]);
    const campIds = (camps || []).map((c) => c.id as string);
    const { data: apps } = await admin
      .from("campania_aplicaciones").select("campania_id, user_id")
      .in("campania_id", campIds.length ? campIds : ["_"]);

    const marcaDeCampania = new Map((camps || []).map((c) => [c.id as string, c.marca_id as string]));
    const creadoresPor = new Map<string, Set<string>>();
    for (const a of apps || []) {
      const m = marcaDeCampania.get(a.campania_id as string);
      if (!m) continue;
      if (!creadoresPor.has(m)) creadoresPor.set(m, new Set());
      creadoresPor.get(m)!.add(a.user_id as string);
    }

    const todas = data.map((m): Marca => {
      const suyas = (camps || []).filter((c) => c.marca_id === m.id);
      return {
        id: m.id as string,
        nombre: m.nombre as string,
        lema: (m.lema as string) || null,
        categoria: (m.categoria as string) || null,
        logoUrl: (m.logo_url as string) || null,
        destacada: m.destacada === true,
        activas: suyas.filter((c) => c.activa).length,
        total: suyas.length,
        creadores: creadoresPor.get(m.id as string)?.size ?? 0,
      };
    });

    const p = Math.max(1, pagina);
    const paginas = Math.max(1, Math.ceil(todas.length / 9));
    return { marcas: todas.slice((p - 1) * 9, (p - 1) * 9 + 9), paginas };
  } catch {
    return vacio;
  }
}

// Aplicar a una campaña: mensaje y enlace a su contenido.
export async function aplicarACampania(
  campaniaId: string, mensaje: string, enlace: string
): Promise<{ ok: true } | { error: string }> {
  const user = await quienSoy();
  if (!user) return { error: "Inicia sesión." };

  const texto = mensaje.trim().slice(0, 1500);
  if (texto.length < 20) return { error: "Cuéntale a la marca por qué eres tú, aunque sea en dos líneas." };

  const url = enlace.trim();
  if (url && !/^https?:\/\//i.test(url)) return { error: "El enlace tiene que empezar con http o https." };

  try {
    const admin = createAdminClient();
    const { data: c } = await admin
      .from("campanias").select("id, titulo, activa, nivel_minimo").eq("id", campaniaId).maybeSingle();
    if (!c || c.activa !== true) return { error: "Esta campaña ya no está abierta." };

    // El nivel se vuelve a revisar aquí: esconder el botón no basta.
    const { data: perfil } = await admin
      .from("profiles").select("xp, full_name").eq("id", user.id).maybeSingle();
    const miNivel = nivelPorXP((perfil?.xp as number) || 0).actual.nivel;
    if (((c.nivel_minimo as number) || 0) > miNivel) {
      return { error: "Todavía no tienes el nivel que pide esta campaña." };
    }

    const { error } = await admin.from("campania_aplicaciones").upsert({
      campania_id: campaniaId, user_id: user.id,
      mensaje: texto, enlace: url || null,
      estado: "enviada", updated_at: new Date().toISOString(),
    }, { onConflict: "campania_id,user_id" });
    if (error) return { error: "No se pudo enviar tu aplicación." };

    // Avisa al equipo, que es quien decide.
    const { notificar } = await import("@/lib/notificaciones-actions");
    const { data: equipo } = await admin.from("profiles").select("id").eq("is_admin", true);
    await Promise.all(
      (equipo || []).map((p) => notificar(p.id as string, "general",
        "Nueva aplicación a una campaña",
        `${(perfil?.full_name as string) || "Alguien"} aplicó a «${c.titulo as string}»`,
        "/app/admin"))
    );
    return { ok: true };
  } catch {
    return { error: "No se pudo enviar tu aplicación." };
  }
}

// Mis campañas: a lo que apliqué y cómo va.
export type MiCampania = {
  id: string;
  campaniaId: string;
  titulo: string;
  marca: string;
  imagenUrl: string | null;
  pagoMin: number | null;
  pagoMax: number | null;
  moneda: string;
  estado: "enviada" | "aceptada" | "rechazada";
  notaEquipo: string | null;
  fecha: string;
};

export async function misCampanias(): Promise<MiCampania[]> {
  const user = await quienSoy();
  if (!user) return [];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("campania_aplicaciones")
      .select("*, campanias!inner(id, titulo, imagen_url, pago_min, pago_max, moneda, marcas!inner(nombre))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    return data.map((a) => {
      const c = a.campanias as unknown as {
        id: string; titulo: string; imagen_url: string | null;
        pago_min: number | null; pago_max: number | null; moneda: string;
        marcas: { nombre: string };
      };
      return {
        id: a.id as string,
        campaniaId: c.id,
        titulo: c.titulo,
        marca: c.marcas?.nombre ?? "Marca",
        imagenUrl: c.imagen_url,
        pagoMin: c.pago_min,
        pagoMax: c.pago_max,
        moneda: c.moneda || "USD",
        estado: a.estado as MiCampania["estado"],
        notaEquipo: (a.nota_equipo as string) || null,
        fecha: a.created_at as string,
      };
    });
  } catch {
    return [];
  }
}

// ————— Panel —————
export async function soyDelEquipo(): Promise<boolean> {
  const user = await quienSoy();
  return !!user && (await esAdminUsuario(user.id, user.email));
}

// ————————————— Panel: alta de marcas y campañas —————————————

export type MarcaAdmin = {
  id: string; nombre: string; lema: string | null; categoria: string | null;
  logoUrl: string | null; destacada: boolean; activa: boolean; campanias: number;
};

export async function listarMarcasAdmin(): Promise<MarcaAdmin[]> {
  if (!(await soyDelEquipo())) return [];
  try {
    const admin = createAdminClient();
    const [{ data }, { data: camps }] = await Promise.all([
      admin.from("marcas").select("*").order("nombre"),
      admin.from("campanias").select("marca_id"),
    ]);
    const cuenta = new Map<string, number>();
    for (const c of camps || []) {
      const k = c.marca_id as string;
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
    }
    return (data || []).map((m) => ({
      id: m.id as string,
      nombre: m.nombre as string,
      lema: (m.lema as string) || null,
      categoria: (m.categoria as string) || null,
      logoUrl: (m.logo_url as string) || null,
      destacada: m.destacada === true,
      activa: m.activa !== false,
      campanias: cuenta.get(m.id as string) || 0,
    }));
  } catch {
    return [];
  }
}

export async function guardarMarca(datos: {
  id?: string; nombre: string; lema?: string; categoria?: string;
  logoUrl?: string; destacada?: boolean; activa?: boolean;
}): Promise<{ ok: true } | { error: string }> {
  if (!(await soyDelEquipo())) return { error: "No autorizado." };
  const nombre = datos.nombre.trim();
  if (!nombre) return { error: "La marca necesita un nombre." };

  const fila = {
    nombre,
    lema: datos.lema?.trim() || null,
    categoria: datos.categoria?.trim() || null,
    logo_url: datos.logoUrl?.trim() || null,
    destacada: datos.destacada === true,
    activa: datos.activa !== false,
  };
  try {
    const admin = createAdminClient();
    const { error } = datos.id
      ? await admin.from("marcas").update(fila).eq("id", datos.id)
      : await admin.from("marcas").insert(fila);
    if (error) return { error: "No se pudo guardar la marca." };
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar la marca." };
  }
}

export async function borrarMarca(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyDelEquipo())) return { error: "No autorizado." };
  try {
    // Las campañas cuelgan de la marca y se van con ella (on delete cascade).
    const { error } = await createAdminClient().from("marcas").delete().eq("id", id);
    if (error) return { error: "No se pudo borrar." };
    return { ok: true };
  } catch {
    return { error: "No se pudo borrar." };
  }
}

export type CampaniaAdmin = {
  id: string; titulo: string; marca: string; marcaId: string;
  descripcion: string | null; imagenUrl: string | null;
  pagoMin: number | null; pagoMax: number | null;
  categoria: string | null; etiquetas: string[]; plataformas: string[];
  nivelMinimo: number; popular: boolean; activa: boolean;
  cierraAt: string | null; aplicantes: number;
};

export async function listarCampaniasAdmin(): Promise<CampaniaAdmin[]> {
  if (!(await soyDelEquipo())) return [];
  try {
    const admin = createAdminClient();
    const [{ data }, { data: apps }] = await Promise.all([
      admin.from("campanias").select("*, marcas(id, nombre)").order("created_at", { ascending: false }),
      admin.from("campania_aplicaciones").select("campania_id"),
    ]);
    const cuenta = new Map<string, number>();
    for (const a of apps || []) {
      const k = a.campania_id as string;
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
    }
    return (data || []).map((c) => {
      const m = c.marcas as unknown as { id: string; nombre: string } | null;
      return {
        id: c.id as string,
        titulo: c.titulo as string,
        marca: m?.nombre ?? "—",
        marcaId: m?.id ?? "",
        descripcion: (c.descripcion as string) || null,
        imagenUrl: (c.imagen_url as string) || null,
        pagoMin: (c.pago_min as number) ?? null,
        pagoMax: (c.pago_max as number) ?? null,
        categoria: (c.categoria as string) || null,
        etiquetas: (c.etiquetas as string[]) || [],
        plataformas: (c.plataformas as string[]) || [],
        nivelMinimo: (c.nivel_minimo as number) || 0,
        popular: c.popular === true,
        activa: c.activa !== false,
        cierraAt: (c.cierra_at as string) || null,
        aplicantes: cuenta.get(c.id as string) || 0,
      };
    });
  } catch {
    return [];
  }
}

export async function guardarCampania(datos: {
  id?: string; marcaId: string; titulo: string; descripcion?: string; imagenUrl?: string;
  pagoMin?: number | null; pagoMax?: number | null; categoria?: string;
  etiquetas?: string[]; plataformas?: string[]; nivelMinimo?: number;
  popular?: boolean; activa?: boolean; cierraAt?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  if (!(await soyDelEquipo())) return { error: "No autorizado." };
  if (!datos.marcaId) return { error: "Elige de qué marca es." };
  const titulo = datos.titulo.trim();
  if (!titulo) return { error: "La campaña necesita un título." };

  const fila = {
    marca_id: datos.marcaId,
    titulo,
    descripcion: datos.descripcion?.trim() || null,
    imagen_url: datos.imagenUrl?.trim() || null,
    pago_min: datos.pagoMin ?? null,
    pago_max: datos.pagoMax ?? null,
    categoria: datos.categoria?.trim() || null,
    etiquetas: datos.etiquetas ?? [],
    plataformas: datos.plataformas ?? [],
    nivel_minimo: Math.max(0, datos.nivelMinimo ?? 0),
    popular: datos.popular === true,
    activa: datos.activa !== false,
    cierra_at: datos.cierraAt || null,
  };
  try {
    const admin = createAdminClient();
    const { error } = datos.id
      ? await admin.from("campanias").update(fila).eq("id", datos.id)
      : await admin.from("campanias").insert(fila);
    if (error) return { error: "No se pudo guardar la campaña." };
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar la campaña." };
  }
}

export async function borrarCampania(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyDelEquipo())) return { error: "No autorizado." };
  try {
    const { error } = await createAdminClient().from("campanias").delete().eq("id", id);
    if (error) return { error: "No se pudo borrar." };
    return { ok: true };
  } catch {
    return { error: "No se pudo borrar." };
  }
}

// ————— Quién aplicó —————
export type Aplicacion = {
  id: string; campania: string; campaniaId: string;
  nombre: string; avatar: string | null; userId: string;
  mensaje: string | null; enlace: string | null;
  estado: "enviada" | "aceptada" | "rechazada";
  notaEquipo: string | null; fecha: string;
};

export async function listarAplicaciones(): Promise<Aplicacion[]> {
  if (!(await soyDelEquipo())) return [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("campania_aplicaciones")
      .select("*, campanias(id, titulo)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (!data?.length) return [];

    const ids = [...new Set(data.map((a) => a.user_id as string))];
    const { data: perfiles } = await admin
      .from("profiles").select("id, full_name, avatar_url").in("id", ids);
    const pm = new Map((perfiles || []).map((p) => [p.id as string, p]));

    return data.map((a) => {
      const c = a.campanias as unknown as { id: string; titulo: string } | null;
      const p = pm.get(a.user_id as string);
      return {
        id: a.id as string,
        campania: c?.titulo ?? "—",
        campaniaId: c?.id ?? "",
        userId: a.user_id as string,
        nombre: (p?.full_name as string) || "Creador",
        avatar: (p?.avatar_url as string) || null,
        mensaje: (a.mensaje as string) || null,
        enlace: (a.enlace as string) || null,
        estado: a.estado as Aplicacion["estado"],
        notaEquipo: (a.nota_equipo as string) || null,
        fecha: a.created_at as string,
      };
    });
  } catch {
    return [];
  }
}

export async function responderAplicacion(
  id: string, estado: "aceptada" | "rechazada", nota = ""
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyDelEquipo())) return { error: "No autorizado." };
  try {
    const admin = createAdminClient();
    const { data: a } = await admin
      .from("campania_aplicaciones")
      .select("user_id, campanias(titulo)")
      .eq("id", id).maybeSingle();

    const { error } = await admin.from("campania_aplicaciones")
      .update({ estado, nota_equipo: nota.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: "No se pudo guardar." };

    // Se le avisa a la creadora: una respuesta que nadie ve no sirve de nada.
    if (a?.user_id) {
      const c = a.campanias as unknown as { titulo: string } | null;
      const { notificar } = await import("@/lib/notificaciones-actions");
      await notificar(a.user_id as string, "general",
        estado === "aceptada" ? "¡Te aceptaron en una campaña! 🎉" : "Respuesta a tu aplicación",
        estado === "aceptada"
          ? `Quedaste en «${c?.titulo ?? "la campaña"}». Revisa los detalles.`
          : `Esta vez no quedaste en «${c?.titulo ?? "la campaña"}». Hay más campañas abiertas.`,
        "/app/campanias");
    }
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar." };
  }
}
