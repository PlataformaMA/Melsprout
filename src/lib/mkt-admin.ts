"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import type { Compensacion, EstadoCampania, Pregunta } from "@/lib/marca-campanias";

// El Marketplace visto por el equipo: el resumen de la operación, las campañas
// que las marcas mandan a revisión y la ficha con la que se aprueban.
//
// Es la MISMA tabla que ven la empresa y la creadora. El equipo no tiene copia
// propia de nada: aprueba sobre el renglón original y por eso la campaña
// aparece en el Marketplace sin mover un dato de lugar.

// El candado va aquí abajo, no pantalla por pantalla: esconder un menú no sirve
// si la acción se puede llamar por fuera.
async function soyEquipo(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return esAdminUsuario(user.id, user.email);
}

// ————————————————————————————————————————————— Inicio

export type FilaPago = {
  id: string;
  marca: string;
  logoUrl: string | null;
  campania: string;
  monto: number | null;
  moneda: string;
  fecha: string | null;
  estado: string;
};

export type ResumenMkt = {
  campanias: number;
  marcas: number;
  creadores: number;
  pendientes: number;
  estados: { activas: number; revision: number; completadas: number; pausadas: number; borradores: number };
  categorias: { nombre: string; total: number }[];
  pagos: FilaPago[];
  mes: {
    desde: string;
    hasta: string;
    total: number;
    // Cuánto cambió contra el mes pasado. null = el mes pasado no hubo nada,
    // y entonces no hay porcentaje que enseñar (dividir entre cero).
    variacion: number | null;
    semanas: { etiqueta: string; total: number }[];
  };
  ultimas: {
    id: string;
    titulo: string;
    marca: string;
    imagenUrl: string | null;
    estado: EstadoCampania;
    activa: boolean;
    inicio: string | null;
  }[];
};

// El primer y el último día del mes, en texto YYYY-MM-DD.
// Se arma a mano: new Date("2026-10-01") es medianoche en UTC y en México
// cae un día antes, así que el mes empezaría el 30 de septiembre.
function mes(desplazamiento = 0): { desde: string; hasta: string; dias: number } {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth() + desplazamiento;
  const inicio = new Date(y, m, 1);
  const dias = new Date(y, m + 1, 0).getDate();
  const dos = (n: number) => String(n).padStart(2, "0");
  const ym = `${inicio.getFullYear()}-${dos(inicio.getMonth() + 1)}`;
  return { desde: `${ym}-01`, hasta: `${ym}-${dos(dias)}`, dias };
}

export async function resumenMarketplace(): Promise<ResumenMkt | null> {
  if (!(await soyEquipo())) return null;
  const db = createAdminClient();

  try {
    const esteMes = mes(0);
    const mesPasado = mes(-1);

    const [campanias, marcas, creadores, pagosMes, pagosAntes] = await Promise.all([
      db.from("campanias").select("id, titulo, marca_id, imagen_url, imagenes, estado, activa, publicada_at, created_at")
        .order("created_at", { ascending: false }),
      db.from("marcas").select("id, nombre, categoria, logo_url"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("tipo", "creador"),
      db.from("colaboracion_pagos").select("monto, fecha_estimada")
        .eq("estado", "pagado").gte("fecha_estimada", esteMes.desde).lte("fecha_estimada", esteMes.hasta),
      db.from("colaboracion_pagos").select("monto")
        .eq("estado", "pagado").gte("fecha_estimada", mesPasado.desde).lte("fecha_estimada", mesPasado.hasta),
    ]);

    const listaCampanias = campanias.data || [];
    const listaMarcas = marcas.data || [];
    const nombreMarca = new Map(listaMarcas.map((m) => [m.id as string, m]));

    // Estado de campañas. "Pausada" es una campaña ya aprobada que la marca o
    // el equipo apagaron: sigue existiendo pero no se ve en el Marketplace.
    const estados = { activas: 0, revision: 0, completadas: 0, pausadas: 0, borradores: 0 };
    for (const c of listaCampanias) {
      const e = (c.estado as string) || "borrador";
      if (e === "pendiente") estados.revision++;
      else if (e === "cerrada") estados.completadas++;
      else if (e === "aprobada") {
        if (c.activa === false) estados.pausadas++;
        else estados.activas++;
      } else estados.borradores++;   // borrador y rechazada: aún no salen
    }

    // Marcas por categoría, de la más poblada a la menos.
    const porCategoria = new Map<string, number>();
    for (const m of listaMarcas) {
      const k = ((m.categoria as string) || "Sin categoría").trim();
      porCategoria.set(k, (porCategoria.get(k) || 0) + 1);
    }
    const categorias = [...porCategoria.entries()]
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Pagos del mes y cómo va contra el anterior.
    const total = (pagosMes.data || []).reduce((s, p) => s + ((p.monto as number) || 0), 0);
    const antes = (pagosAntes.data || []).reduce((s, p) => s + ((p.monto as number) || 0), 0);
    const variacion = antes > 0 ? Math.round(((total - antes) / antes) * 100) : null;

    // El mes partido en semanas de 7 días, como el diseño.
    const cortes = [1, 8, 15, 22, 29];
    const semanas = cortes.map((inicio, i) => {
      const fin = i + 1 < cortes.length ? cortes[i + 1] - 1 : esteMes.dias;
      const suma = (pagosMes.data || []).reduce((s, p) => {
        const dia = Number(((p.fecha_estimada as string) || "").slice(8, 10));
        return dia >= inicio && dia <= fin ? s + ((p.monto as number) || 0) : s;
      }, 0);
      return { etiqueta: `${inicio}–${fin}`, total: suma };
    });

    return {
      campanias: listaCampanias.length,
      marcas: listaMarcas.length,
      creadores: creadores.count || 0,
      pendientes: estados.revision,
      estados,
      categorias,
      pagos: await ultimosPagos(db),
      mes: { desde: esteMes.desde, hasta: esteMes.hasta, total, variacion, semanas },
      ultimas: listaCampanias.slice(0, 5).map((c) => ({
        id: c.id as string,
        titulo: c.titulo as string,
        marca: (nombreMarca.get(c.marca_id as string)?.nombre as string) || "Sin marca",
        imagenUrl: (c.imagen_url as string) || ((c.imagenes as string[]) || [])[0] || null,
        estado: ((c.estado as string) || "borrador") as EstadoCampania,
        activa: c.activa !== false,
        inicio: (c.publicada_at as string) || (c.created_at as string) || null,
      })),
    };
  } catch (e) {
    console.error("[mkt-admin] resumen:", e);
    return null;
  }
}

// Los últimos pagos con su marca y su campaña. Se arma en pasos en vez de con
// un join anidado: son cuatro tablas encadenadas y un !inner de cuatro niveles
// se cae en silencio si cualquiera de las llaves no empata.
async function ultimosPagos(db: ReturnType<typeof createAdminClient>): Promise<FilaPago[]> {
  const { data: pagos } = await db
    .from("colaboracion_pagos")
    .select("id, colaboracion_id, monto, moneda, estado, fecha_estimada")
    .order("fecha_estimada", { ascending: false, nullsFirst: false })
    .limit(5);
  if (!pagos?.length) return [];

  const { data: colabs } = await db
    .from("campania_colaboraciones")
    .select("id, aplicacion_id")
    .in("id", pagos.map((p) => p.colaboracion_id as string));
  const aplicacionDe = new Map((colabs || []).map((c) => [c.id as string, c.aplicacion_id as string]));

  const { data: apps } = await db
    .from("campania_aplicaciones")
    .select("id, campania_id")
    .in("id", [...aplicacionDe.values()]);
  const campaniaDe = new Map((apps || []).map((a) => [a.id as string, a.campania_id as string]));

  const { data: camps } = await db
    .from("campanias")
    .select("id, titulo, marca_id")
    .in("id", [...campaniaDe.values()]);
  const campania = new Map((camps || []).map((c) => [c.id as string, c]));

  const { data: marcas } = await db
    .from("marcas")
    .select("id, nombre, logo_url")
    .in("id", (camps || []).map((c) => c.marca_id as string));
  const marca = new Map((marcas || []).map((m) => [m.id as string, m]));

  return pagos.map((p) => {
    const c = campania.get(campaniaDe.get(aplicacionDe.get(p.colaboracion_id as string) || "") || "");
    const m = c ? marca.get(c.marca_id as string) : undefined;
    return {
      id: p.id as string,
      marca: (m?.nombre as string) || "Sin marca",
      logoUrl: (m?.logo_url as string) || null,
      campania: (c?.titulo as string) || "Campaña",
      monto: (p.monto as number) ?? null,
      moneda: (p.moneda as string) || "MXN",
      fecha: (p.fecha_estimada as string) || null,
      estado: (p.estado as string) || "pendiente",
    };
  });
}

// ————————————————————————————————————————————— Solicitudes

export type Solicitud = {
  id: string;
  titulo: string;
  marca: string;
  logoUrl: string | null;
  descripcion: string | null;
  // Lo que ofrece, resumido en una línea para la tarjeta de la lista.
  compensacion: string;
  fecha: string | null;
};

// Resume lo que ofrece la campaña: "$2000", "Intercambio", "$1000 + afiliados".
function resumirCompensacion(tipos: string[], c: Compensacion): string {
  const partes: string[] = [];
  if (c.monto?.cantidad) partes.push(`$${c.monto.cantidad.toLocaleString("en-US")}`);
  else if (tipos.includes("monto")) partes.push("Monto por definir");
  if (c.intercambio || tipos.includes("intercambio")) partes.push("Intercambio");
  if (c.afiliados || tipos.includes("afiliados")) partes.push("afiliados");
  return partes.length ? partes.join(" + ") : "Por definir";
}

export async function solicitudesPendientes(
  orden: "recientes" | "antiguas" = "recientes",
): Promise<Solicitud[]> {
  if (!(await soyEquipo())) return [];
  const db = createAdminClient();
  try {
    const { data } = await db
      .from("campanias")
      .select("id, titulo, descripcion, marca_id, tipos, compensacion, created_at, publicada_at")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: orden === "antiguas" });
    if (!data?.length) return [];

    const { data: marcas } = await db
      .from("marcas").select("id, nombre, logo_url")
      .in("id", data.map((c) => c.marca_id as string));
    const marca = new Map((marcas || []).map((m) => [m.id as string, m]));

    return data.map((c) => {
      const m = marca.get(c.marca_id as string);
      return {
        id: c.id as string,
        titulo: c.titulo as string,
        marca: (m?.nombre as string) || "Sin marca",
        logoUrl: (m?.logo_url as string) || null,
        descripcion: (c.descripcion as string) || null,
        compensacion: resumirCompensacion(
          (c.tipos as string[]) || [],
          (c.compensacion as Compensacion) || {},
        ),
        fecha: (c.publicada_at as string) || (c.created_at as string) || null,
      };
    });
  } catch (e) {
    console.error("[mkt-admin] solicitudes:", e);
    return [];
  }
}

export type SolicitudDetalle = {
  id: string;
  titulo: string;
  marca: string;
  logoUrl: string | null;
  descripcion: string | null;
  imagenes: string[];
  tipos: string[];
  compensacion: Compensacion;
  compensacionDetalle: string | null;
  nicho: string | null;
  genero: string | null;
  edadMin: number | null;
  edadMax: number | null;
  seguidoresMin: number;
  seguidoresMax: number | null;
  ubicaciones: string[];
  preguntas: Pregunta[];
  estado: EstadoCampania;
  notaEquipo: string | null;
  inicio: string | null;
  fin: string | null;
};

export async function getSolicitud(id: string): Promise<SolicitudDetalle | null> {
  if (!(await soyEquipo())) return null;
  const db = createAdminClient();
  try {
    const { data: c } = await db.from("campanias").select("*").eq("id", id).maybeSingle();
    if (!c) return null;
    const { data: m } = await db
      .from("marcas").select("nombre, logo_url").eq("id", c.marca_id as string).maybeSingle();

    return {
      id: c.id as string,
      titulo: c.titulo as string,
      marca: (m?.nombre as string) || "Sin marca",
      logoUrl: (m?.logo_url as string) || null,
      descripcion: (c.descripcion as string) || null,
      imagenes: (c.imagenes as string[]) || [],
      tipos: (c.tipos as string[]) || [],
      compensacion: (c.compensacion as Compensacion) || {},
      compensacionDetalle: (c.compensacion_detalle as string) || null,
      nicho: (c.nicho as string) || null,
      genero: (c.genero as string) || null,
      edadMin: (c.edad_min as number) ?? null,
      edadMax: (c.edad_max as number) ?? null,
      seguidoresMin: (c.seguidores_min as number) || 0,
      seguidoresMax: (c.seguidores_max as number) ?? null,
      ubicaciones: (c.ubicaciones as string[]) || [],
      preguntas: (c.preguntas as Pregunta[]) || [],
      estado: ((c.estado as string) || "borrador") as EstadoCampania,
      notaEquipo: (c.nota_equipo as string) || null,
      inicio: (c.publicada_at as string) || (c.created_at as string) || null,
      fin: (c.cierra_at as string) || null,
    };
  } catch (e) {
    console.error("[mkt-admin] solicitud:", e);
    return null;
  }
}

// El equipo fija el monto por creador antes de aprobar: en el diseño es el
// único campo con asterisco de toda la ficha.
export async function fijarMonto(
  id: string, cantidad: number, moneda: string,
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyEquipo())) return { error: "No autorizado." };
  if (!Number.isFinite(cantidad) || cantidad <= 0) return { error: "Pon un monto mayor a cero." };

  const db = createAdminClient();
  const { data: c } = await db.from("campanias").select("compensacion, tipos").eq("id", id).maybeSingle();
  if (!c) return { error: "No encontramos la campaña." };

  const compensacion = { ...((c.compensacion as Compensacion) || {}) };
  compensacion.monto = { cantidad: Math.round(cantidad), moneda };
  const tipos = [...new Set([...((c.tipos as string[]) || []), "monto"])];

  const { error } = await db.from("campanias").update({ compensacion, tipos }).eq("id", id);
  return error ? { error: "No se pudo guardar el monto." } : { ok: true };
}

// ————————————————————————————————————————————— Campañas

export type CampaniaEquipo = {
  id: string;
  titulo: string;
  marca: string;
  marcaId: string;
  logoUrl: string | null;
  portada: string | null;
  estado: EstadoCampania;
  activa: boolean;
  compensacion: string;
  publicada: string | null;
  cierra: string | null;
  postuladas: number;
  seleccionadas: number;
};

export async function campaniasDelEquipo(): Promise<CampaniaEquipo[]> {
  if (!(await soyEquipo())) return [];
  const db = createAdminClient();
  try {
    const { data } = await db
      .from("campanias")
      .select("id, titulo, marca_id, imagen_url, imagenes, tipos, compensacion, estado, activa, publicada_at, cierra_at, created_at")
      .order("created_at", { ascending: false });
    if (!data?.length) return [];

    const { data: marcas } = await db
      .from("marcas").select("id, nombre, logo_url")
      .in("id", data.map((c) => c.marca_id as string));
    const marca = new Map((marcas || []).map((m) => [m.id as string, m]));

    // Cuántas se postularon y cuántas quedaron, de un solo viaje.
    const { data: apps } = await db
      .from("campania_aplicaciones").select("campania_id, etapa")
      .in("campania_id", data.map((c) => c.id as string));
    const post = new Map<string, number>();
    const sel = new Map<string, number>();
    for (const a of apps || []) {
      const k = a.campania_id as string;
      post.set(k, (post.get(k) || 0) + 1);
      if (a.etapa === "seleccionada") sel.set(k, (sel.get(k) || 0) + 1);
    }

    return data.map((c) => {
      const m = marca.get(c.marca_id as string);
      return {
        id: c.id as string,
        titulo: c.titulo as string,
        marca: (m?.nombre as string) || "Sin marca",
        marcaId: c.marca_id as string,
        logoUrl: (m?.logo_url as string) || null,
        portada: (c.imagen_url as string) || ((c.imagenes as string[]) || [])[0] || null,
        estado: ((c.estado as string) || "borrador") as EstadoCampania,
        activa: c.activa !== false,
        compensacion: resumirCompensacion(
          (c.tipos as string[]) || [],
          (c.compensacion as Compensacion) || {},
        ),
        publicada: (c.publicada_at as string) || (c.created_at as string) || null,
        cierra: (c.cierra_at as string) || null,
        postuladas: post.get(c.id as string) || 0,
        seleccionadas: sel.get(c.id as string) || 0,
      };
    });
  } catch (e) {
    console.error("[mkt-admin] campañas:", e);
    return [];
  }
}

// ————————————————————————————————————————————— Marcas

export type MarcaEquipo = {
  id: string;
  nombre: string;
  lema: string | null;
  categoria: string | null;
  logoUrl: string | null;
  activa: boolean;
  aprobada: boolean;
  destacada: boolean;
  tieneDueno: boolean;
  pais: string | null;
  calificacion: number | null;
  campanias: number;
  creadores: number;
};

export async function marcasDelEquipo(): Promise<MarcaEquipo[]> {
  if (!(await soyEquipo())) return [];
  const db = createAdminClient();
  try {
    // select("*") a propósito: las columnas de la ficha (país, dirección,
    // contacto…) las agrega la migración 78. Si todavía no se corrió, esto
    // sigue funcionando y esos campos salen vacíos en vez de tronar.
    const { data } = await db.from("marcas").select("*").order("nombre");
    if (!data?.length) return [];

    const { data: camps } = await db.from("campanias").select("id, marca_id");
    const porMarca = new Map<string, string[]>();
    for (const c of camps || []) {
      const k = c.marca_id as string;
      porMarca.set(k, [...(porMarca.get(k) || []), c.id as string]);
    }

    // Cuántas creadoras distintas han trabajado con cada marca.
    const { data: apps } = await db
      .from("campania_aplicaciones").select("campania_id, user_id").eq("etapa", "seleccionada");
    const marcaDeCampania = new Map((camps || []).map((c) => [c.id as string, c.marca_id as string]));
    const gente = new Map<string, Set<string>>();
    for (const a of apps || []) {
      const m = marcaDeCampania.get(a.campania_id as string);
      if (!m) continue;
      if (!gente.has(m)) gente.set(m, new Set());
      gente.get(m)?.add(a.user_id as string);
    }

    return data.map((m) => ({
      id: m.id as string,
      nombre: m.nombre as string,
      lema: (m.lema as string) || null,
      categoria: (m.categoria as string) || null,
      logoUrl: (m.logo_url as string) || null,
      activa: m.activa !== false,
      aprobada: m.aprobada === true,
      destacada: m.destacada === true,
      tieneDueno: !!m.dueno_id,
      pais: (m.pais as string) || null,
      calificacion: (m.calificacion as number) ?? null,
      campanias: (porMarca.get(m.id as string) || []).length,
      creadores: gente.get(m.id as string)?.size || 0,
    }));
  } catch (e) {
    console.error("[mkt-admin] marcas:", e);
    return [];
  }
}

export type ArchivoMarca = {
  id: string; tipo: string; ruta: string; nombre: string; peso: number | null; fecha: string;
};

export type MarcaFicha = MarcaEquipo & {
  sitio: string | null;
  descripcion: string | null;
  direccion: string | null;
  contactoNombre: string | null;
  contactoCorreo: string | null;
  contactoTelefono: string | null;
  contactoCargo: string | null;
  redes: Record<string, string>;
  correoDueno: string | null;
  archivos: ArchivoMarca[];
};

export async function getMarcaFicha(id: string): Promise<MarcaFicha | null> {
  if (!(await soyEquipo())) return null;
  const db = createAdminClient();
  try {
    const { data: m } = await db.from("marcas").select("*").eq("id", id).maybeSingle();
    if (!m) return null;

    const lista = await marcasDelEquipo();
    const base = lista.find((x) => x.id === id);
    if (!base) return null;

    // El correo de quien administra la marca, por si hay que escribirle.
    let correoDueno: string | null = null;
    if (m.dueno_id) {
      const { data: u } = await db.auth.admin.getUserById(m.dueno_id as string);
      correoDueno = u?.user?.email ?? null;
    }

    return {
      ...base,
      sitio: (m.sitio as string) || null,
      descripcion: (m.descripcion as string) || null,
      direccion: (m.direccion as string) || null,
      contactoNombre: (m.contacto_nombre as string) || null,
      contactoCorreo: (m.contacto_correo as string) || null,
      contactoTelefono: (m.contacto_telefono as string) || null,
      contactoCargo: (m.contacto_cargo as string) || null,
      redes: (m.redes as Record<string, string>) || {},
      correoDueno,
      archivos: await archivosDeMarca(id),
    };
  } catch (e) {
    console.error("[mkt-admin] ficha de marca:", e);
    return null;
  }
}

export async function archivosDeMarca(marcaId: string): Promise<ArchivoMarca[]> {
  if (!(await soyEquipo())) return [];
  try {
    // Si la migración 78 todavía no corre, la tabla no existe: lista vacía.
    const { data } = await createAdminClient()
      .from("marca_archivos")
      .select("id, tipo, ruta, nombre, peso, created_at")
      .eq("marca_id", marcaId)
      .order("created_at", { ascending: false });
    return (data || []).map((a) => ({
      id: a.id as string,
      tipo: (a.tipo as string) || "otro",
      ruta: a.ruta as string,
      nombre: (a.nombre as string) || "archivo",
      peso: (a.peso as number) ?? null,
      fecha: a.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function guardarFichaMarca(
  id: string,
  campos: Partial<{
    nombre: string; lema: string; categoria: string; pais: string; sitio: string;
    descripcion: string; direccion: string;
    contactoNombre: string; contactoCorreo: string; contactoTelefono: string; contactoCargo: string;
    redes: Record<string, string>;
    activa: boolean; destacada: boolean;
  }>,
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyEquipo())) return { error: "No autorizado." };
  if (campos.nombre !== undefined && !campos.nombre.trim()) {
    return { error: "La marca necesita un nombre." };
  }

  const fila: Record<string, unknown> = {};
  const poner = (k: string, v: unknown) => { if (v !== undefined) fila[k] = v; };
  poner("nombre", campos.nombre?.trim());
  poner("lema", campos.lema);
  poner("categoria", campos.categoria);
  poner("pais", campos.pais);
  poner("sitio", campos.sitio);
  poner("descripcion", campos.descripcion);
  poner("direccion", campos.direccion);
  poner("contacto_nombre", campos.contactoNombre);
  poner("contacto_correo", campos.contactoCorreo);
  poner("contacto_telefono", campos.contactoTelefono);
  poner("contacto_cargo", campos.contactoCargo);
  poner("redes", campos.redes);
  poner("activa", campos.activa);
  poner("destacada", campos.destacada);
  if (!Object.keys(fila).length) return { ok: true };

  const { error } = await createAdminClient().from("marcas").update(fila).eq("id", id);
  if (error) {
    // Pasa si la migración 78 no se ha corrido y se tocó un campo nuevo.
    console.error("[mkt-admin] guardar marca:", error.message);
    return { error: "No se pudo guardar. Puede que falte correr la migración 78." };
  }
  return { ok: true };
}

const ARCHIVO_MB = 20;
const ARCHIVO_TIPOS = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx"];

export async function urlParaSubirArchivoMarca(
  marcaId: string, nombre: string, peso: number,
): Promise<{ ruta: string; token: string } | { error: string }> {
  if (!(await soyEquipo())) return { error: "No autorizado." };

  const ext = (nombre.split(".").pop() || "").toLowerCase();
  if (!ARCHIVO_TIPOS.includes(ext)) {
    return { error: `Ese archivo no va aquí. Se aceptan: ${ARCHIVO_TIPOS.join(", ").toUpperCase()}.` };
  }
  if (peso > ARCHIVO_MB * 1024 * 1024) return { error: `El archivo pasa de ${ARCHIVO_MB} MB.` };

  const ruta = `${marcaId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from("marcas").createSignedUploadUrl(ruta);
  if (error || !data) return { error: "No se pudo preparar la subida." };
  return { ruta, token: data.token };
}

export async function registrarArchivoMarca(
  marcaId: string, tipo: string, ruta: string, nombre: string, peso: number,
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyEquipo())) return { error: "No autorizado." };
  // La ruta la firmó el servidor con este prefijo; si no coincide, no se anota.
  if (!ruta.startsWith(`${marcaId}/`)) return { error: "Archivo inválido." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await createAdminClient().from("marca_archivos").insert({
    marca_id: marcaId, tipo, ruta, nombre, peso, subido_por: user?.id ?? null,
  });
  return error ? { error: "No se pudo guardar el archivo." } : { ok: true };
}

export async function urlDeArchivoMarca(marcaId: string, ruta: string): Promise<string | null> {
  if (!(await soyEquipo())) return null;
  if (!ruta.startsWith(`${marcaId}/`)) return null;
  try {
    const { data } = await createAdminClient()
      .storage.from("marcas").createSignedUrl(ruta, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function borrarArchivoMarca(id: string): Promise<{ ok: true } | { error: string }> {
  if (!(await soyEquipo())) return { error: "No autorizado." };
  const db = createAdminClient();
  const { data: a } = await db.from("marca_archivos").select("ruta").eq("id", id).maybeSingle();
  if (!a) return { error: "Ese archivo ya no está." };

  // Primero el archivo, luego el renglón: al revés quedaría basura en el
  // bucket sin nada que la apunte.
  await db.storage.from("marcas").remove([a.ruta as string]);
  const { error } = await db.from("marca_archivos").delete().eq("id", id);
  return error ? { error: "No se pudo borrar." } : { ok: true };
}

// ————————————————————————————————————————————— Creadores

export type CreadorEquipo = {
  id: string;
  nombre: string;
  usuario: string | null;
  avatar: string | null;
  titular: string | null;
  nicho: string | null;
  ciudad: string | null;
  pais: string | null;
  destacado: boolean;
  pro: boolean;
  redes: { red: string; seguidores: number }[];
  seguidores: number;
  engagement: number | null;
  campanias: number;
};

// Qué tan buenas son las métricas de una red. Primero lo que trajo InsightIQ
// (`metricas`), y si no hay, lo que la creadora escribió en sus redes.
function metricasDe(p: Record<string, unknown>): {
  redes: { red: string; seguidores: number }[]; seguidores: number; engagement: number | null;
} {
  const met = (p.metricas as Record<string, { followers?: number; engagement?: number }>) || {};
  const redes = (p.redes as Record<string, { seguidores?: number }>) || {};

  const nombres = [...new Set([...Object.keys(met), ...Object.keys(redes)])];
  const lista = nombres.map((red) => ({
    red,
    seguidores: Number(met[red]?.followers ?? redes[red]?.seguidores ?? 0),
  })).filter((r) => r.seguidores > 0);

  // El engagement se promedia entre las redes que lo reportan.
  const engs = Object.values(met).map((m) => m?.engagement).filter((e): e is number => !!e);
  const engagement = engs.length
    ? Math.round((engs.reduce((s, e) => s + e, 0) / engs.length) * 10) / 10
    : null;

  return {
    redes: lista.sort((a, b) => b.seguidores - a.seguidores),
    seguidores: lista.reduce((n, r) => n + r.seguidores, 0),
    engagement,
  };
}

export async function creadoresDelEquipo(): Promise<CreadorEquipo[]> {
  if (!(await soyEquipo())) return [];
  const db = createAdminClient();
  try {
    const { data } = await db
      .from("profiles").select("*").eq("tipo", "creador").eq("onboarding_completo", true);
    if (!data?.length) return [];

    // Cuántas campañas lleva cada quien.
    const { data: apps } = await db
      .from("campania_aplicaciones").select("user_id").eq("etapa", "seleccionada");
    const cuenta = new Map<string, number>();
    for (const a of apps || []) {
      const k = a.user_id as string;
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
    }

    const lista = data.map((p) => {
      const m = metricasDe(p);
      return {
        id: p.id as string,
        nombre: (p.full_name as string) || "Creador",
        usuario: (p.username as string) || null,
        avatar: (p.avatar_url as string) || null,
        titular: (p.headline as string) || null,
        nicho: (p.nicho as string) || null,
        ciudad: (p.ciudad as string) || null,
        pais: (p.pais as string) || null,
        destacado: p.destacado === true,
        pro: p.pro === true,
        ...m,
        campanias: cuenta.get(p.id as string) || 0,
      };
    });

    // Los destacados arriba; luego por tamaño de audiencia.
    lista.sort((a, b) => {
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      return b.seguidores - a.seguidores;
    });
    return lista;
  } catch (e) {
    console.error("[mkt-admin] creadores:", e);
    return [];
  }
}

export async function marcarDestacado(
  userId: string, destacado: boolean,
): Promise<{ ok: true } | { error: string }> {
  if (!(await soyEquipo())) return { error: "No autorizado." };
  const { error } = await createAdminClient()
    .from("profiles").update({ destacado }).eq("id", userId);
  if (error) {
    console.error("[mkt-admin] destacar:", error.message);
    return { error: "No se pudo guardar. Puede que falte correr la migración 78." };
  }
  return { ok: true };
}
