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
  estados: { activas: number; revision: number; completadas: number; pausadas: number };
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
    const estados = { activas: 0, revision: 0, completadas: 0, pausadas: 0 };
    for (const c of listaCampanias) {
      const e = (c.estado as string) || "borrador";
      if (e === "pendiente") estados.revision++;
      else if (e === "cerrada") estados.completadas++;
      else if (e === "aprobada") {
        if (c.activa === false) estados.pausadas++;
        else estados.activas++;
      }
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
