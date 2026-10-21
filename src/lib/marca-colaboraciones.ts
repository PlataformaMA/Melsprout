"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { miMarca } from "@/lib/marca-cuenta";
import { notificar } from "@/lib/notificaciones-actions";

// Lo que pasa DESPUÉS de seleccionar a una creadora: su contenido, su pago y
// su envío. Las tres pestañas del detalle de campaña leen de aquí.

export type Colaboracion = {
  id: string;
  aplicacionId: string;
  creadorId: string;
  nombre: string;
  usuario: string | null;
  avatar: string | null;

  // Seguimiento
  guion: Etapa;
  grabacion: Etapa;
  entregaFinal: Etapa;
  materialUrl: string | null;
  fechaEntrega: string | null;
  cumplimiento: string | null;
  calificacion: number | null;
  notas: string | null;

  // Pagos
  pago1: number | null;
  pago1Fecha: string | null;
  pago2: number | null;
  pago2Fecha: string | null;
  pagoEstado: string;
  pagoCompletado: boolean;

  // Envío
  direccion: string | null;
  paqueteria: string | null;
  guia: string | null;
  envioFecha: string | null;
  envioEstado: string;
  entregaFecha: string | null;
};

export type Etapa = "no_empezado" | "en_proceso" | "aprobado" | "por_corregir";

// Las listas de opciones, en un solo lugar para que pantalla y servidor no se
// desincronicen.
export async function opcionesColaboracion(): Promise<{
  etapas: { valor: Etapa; texto: string }[];
  cumplimientos: { valor: string; texto: string }[];
  pagos: { valor: string; texto: string }[];
  envios: { valor: string; texto: string }[];
}> {
  return {
    etapas: [
      { valor: "no_empezado", texto: "No empezado" },
      { valor: "en_proceso", texto: "En proceso" },
      { valor: "aprobado", texto: "Aprobado" },
      { valor: "por_corregir", texto: "Por corregir" },
    ],
    cumplimientos: [
      { valor: "a_tiempo", texto: "A tiempo" },
      { valor: "entrega_tardia", texto: "Entrega tardía" },
      { valor: "entrega_incumplida", texto: "Entrega incumplida" },
    ],
    pagos: [
      { valor: "pendiente", texto: "Pendiente" },
      { valor: "por_pagar", texto: "Pago pendiente" },
      { valor: "pagado", texto: "Completado" },
    ],
    envios: [
      { valor: "en_preparacion", texto: "En preparación" },
      { valor: "en_transito", texto: "En tránsito" },
      { valor: "entregado", texto: "Entregado" },
      { valor: "retrasado", texto: "Retrasado" },
    ],
  };
}

// Las colaboraciones de una campaña: una por creadora seleccionada.
//
// La fila se crea sola la primera vez que se abre la pestaña, para no depender
// de que la selección haya pasado por un sitio concreto.
export async function colaboracionesDe(campaniaId: string): Promise<Colaboracion[]> {
  const marca = await miMarca();
  if (!marca) return [];

  try {
    const admin = createAdminClient();
    const { data: c } = await admin.from("campanias")
      .select("marca_id").eq("id", campaniaId).maybeSingle();
    if (!c || c.marca_id !== marca.id) return [];

    const { data: apps } = await admin.from("campania_aplicaciones")
      .select("id, user_id, profiles!inner(id, full_name, username, avatar_url)")
      .eq("campania_id", campaniaId).eq("etapa", "seleccionada");
    if (!apps?.length) return [];

    const ids = apps.map((a) => a.id as string);
    const { data: filas } = await admin.from("campania_colaboraciones")
      .select("*").in("aplicacion_id", ids);
    const por = new Map((filas || []).map((f) => [f.aplicacion_id as string, f]));

    // A quien le falte su fila, se le crea ahora.
    const faltan = ids.filter((id) => !por.has(id));
    if (faltan.length) {
      const { data: nuevas } = await admin.from("campania_colaboraciones")
        .insert(faltan.map((aplicacion_id) => ({ aplicacion_id })))
        .select("*");
      for (const f of nuevas || []) por.set(f.aplicacion_id as string, f);
    }

    return apps.map((a) => {
      const p = a.profiles as unknown as {
        id: string; full_name: string; username: string | null; avatar_url: string | null;
      };
      const f = (por.get(a.id as string) ?? {}) as Record<string, unknown>;
      return {
        id: (f.id as string) ?? "",
        aplicacionId: a.id as string,
        creadorId: p.id,
        nombre: p.full_name || "Creador",
        usuario: p.username,
        avatar: p.avatar_url,
        guion: ((f.guion as string) || "no_empezado") as Etapa,
        grabacion: ((f.grabacion as string) || "no_empezado") as Etapa,
        entregaFinal: ((f.entrega_final as string) || "no_empezado") as Etapa,
        materialUrl: (f.material_url as string) ?? null,
        fechaEntrega: (f.fecha_entrega as string) ?? null,
        cumplimiento: (f.cumplimiento as string) ?? null,
        calificacion: (f.calificacion as number) ?? null,
        notas: (f.notas as string) ?? null,
        pago1: (f.pago1 as number) ?? null,
        pago1Fecha: (f.pago1_fecha as string) ?? null,
        pago2: (f.pago2 as number) ?? null,
        pago2Fecha: (f.pago2_fecha as string) ?? null,
        pagoEstado: (f.pago_estado as string) || "pendiente",
        pagoCompletado: f.pago_completado === true,
        direccion: (f.direccion as string) ?? null,
        paqueteria: (f.paqueteria as string) ?? null,
        guia: (f.guia as string) ?? null,
        envioFecha: (f.envio_fecha as string) ?? null,
        envioEstado: (f.envio_estado as string) || "en_preparacion",
        entregaFecha: (f.entrega_fecha as string) ?? null,
      };
    });
  } catch {
    return [];   // la migración todavía no corre
  }
}

// Guardar un cambio de la fila. La marca edita celda por celda.
export async function guardarColaboracion(
  aplicacionId: string, campos: Partial<Colaboracion>
): Promise<{ ok: true } | { error: string }> {
  const marca = await miMarca();
  if (!marca) return { error: "Esta cuenta no es de una empresa." };

  try {
    const admin = createAdminClient();
    // Que la postulación sea de una campaña suya.
    const { data: a } = await admin.from("campania_aplicaciones")
      .select("user_id, campanias!inner(titulo, marca_id)").eq("id", aplicacionId).maybeSingle();
    const camp = a?.campanias as unknown as { titulo: string; marca_id: string } | undefined;
    if (!a || camp?.marca_id !== marca.id) return { error: "Esa colaboración no es tuya." };

    const fila: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const poner = (k: string, v: unknown) => { if (v !== undefined) fila[k] = v; };
    poner("guion", campos.guion);
    poner("grabacion", campos.grabacion);
    poner("entrega_final", campos.entregaFinal);
    poner("material_url", campos.materialUrl);
    poner("fecha_entrega", campos.fechaEntrega);
    poner("cumplimiento", campos.cumplimiento);
    poner("calificacion", campos.calificacion);
    poner("notas", campos.notas);
    poner("pago1", campos.pago1);
    poner("pago1_fecha", campos.pago1Fecha);
    poner("pago2", campos.pago2);
    poner("pago2_fecha", campos.pago2Fecha);
    poner("pago_estado", campos.pagoEstado);
    poner("pago_completado", campos.pagoCompletado);
    poner("direccion", campos.direccion);
    poner("paqueteria", campos.paqueteria);
    poner("guia", campos.guia);
    poner("envio_fecha", campos.envioFecha);
    poner("envio_estado", campos.envioEstado);
    poner("entrega_fecha", campos.entregaFecha);

    const { error } = await admin.from("campania_colaboraciones")
      .upsert({ aplicacion_id: aplicacionId, ...fila }, { onConflict: "aplicacion_id" });
    if (error) return { error: "No se pudo guardar." };

    // Avisos que de verdad le importan a la creadora.
    if (campos.envioEstado === "en_transito" && campos.guia) {
      await notificar(a.user_id as string, "general",
        "Tu producto va en camino 📦",
        `${marca.nombre} envió tu kit de «${camp?.titulo ?? "la campaña"}». Guía: ${campos.guia}`,
        "/app/campanias");
    }
    if (campos.pagoCompletado === true) {
      await notificar(a.user_id as string, "general",
        "Tu pago quedó completado 💸",
        `${marca.nombre} marcó tu pago de «${camp?.titulo ?? "la campaña"}» como completado.`,
        "/app/campanias");
    }
    return { ok: true };
  } catch {
    return { error: "El seguimiento de colaboraciones todavía no está activado." };
  }
}
