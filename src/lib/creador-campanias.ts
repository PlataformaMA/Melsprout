"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// El lado del CREADOR de una campaña: desde que lo seleccionan hasta que le
// pagan. Lee las mismas filas que edita la empresa en su panel, solo que
// filtradas a lo suyo — nunca devuelve la colaboración de otra persona.

// ————————————————— Sus datos de cobro y envío —————————————————

export type DatosCreador = {
  razonSocial: string;
  clabe: string;
  correo: string;
  nombreCompleto: string;
  direccion: string;
};

const VACIOS: DatosCreador = {
  razonSocial: "", clabe: "", correo: "", nombreCompleto: "", direccion: "",
};

// Todo lo de este archivo es parte de Boost Pro, así que el candado va aquí
// abajo y no pantalla por pantalla: esconder un botón no sirve si la acción se
// puede llamar por fuera. Si no tiene plan, es como si no hubiera sesión.
// El equipo entra siempre (estadoPro ya lo contempla).
async function quienSoy() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { esAdminUsuario } = await import("@/lib/admin");
  const { estadoPro } = await import("@/lib/pro");
  const pro = await estadoPro(user.id, await esAdminUsuario(user.id, user.email));
  // Mientras el plan no exista en la base, el candado está apagado (ver pro.ts).
  return !pro.activo || pro.pro ? user : null;
}

export async function misDatos(): Promise<DatosCreador | null> {
  const user = await quienSoy();
  if (!user) return null;
  try {
    const { data } = await createAdminClient()
      .from("creador_datos").select("*").eq("user_id", user.id).maybeSingle();
    if (!data) return null;
    return {
      razonSocial: (data.razon_social as string) || "",
      clabe: (data.clabe as string) || "",
      correo: (data.correo as string) || "",
      nombreCompleto: (data.nombre_completo as string) || "",
      direccion: (data.direccion as string) || "",
    };
  } catch {
    return null;
  }
}

export async function guardarMisDatos(
  d: Partial<DatosCreador>
): Promise<{ ok: true } | { error: string }> {
  const user = await quienSoy();
  if (!user) return { error: "Inicia sesión." };

  const v = { ...VACIOS, ...d };
  const nombre = v.nombreCompleto.trim();
  if (!nombre) return { error: "Falta tu nombre completo." };

  const correo = v.correo.trim();
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { error: "Ese correo no se ve bien." };
  }

  // La CLABE son 18 dígitos. Se valida aquí porque un dígito de menos es un
  // pago que rebota y una semana perdida.
  const clabe = v.clabe.replace(/\s+/g, "");
  if (clabe && !/^\d{18}$/.test(clabe)) {
    return { error: "La CLABE son 18 dígitos, sin espacios." };
  }

  try {
    const { error } = await createAdminClient().from("creador_datos").upsert({
      user_id: user.id,
      razon_social: v.razonSocial.trim() || null,
      clabe: clabe || null,
      correo: correo || null,
      nombre_completo: nombre,
      direccion: v.direccion.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) return { error: "No se pudieron guardar tus datos." };
    return { ok: true };
  } catch {
    return { error: "No se pudieron guardar tus datos." };
  }
}

// ————————————————— «¡Felicidades!» —————————————————
// Te seleccionaron y todavía no dejaste tus datos: el Inicio muestra el aviso.
export type Seleccion = { colaboracionId: string; campania: string; marca: string };

export async function seleccionSinDatos(): Promise<Seleccion | null> {
  const user = await quienSoy();
  if (!user) return null;
  try {
    const admin = createAdminClient();
    const datos = await misDatos();
    // Con nombre y CLABE ya se le puede pagar: no se le insiste más.
    if (datos?.nombreCompleto && datos?.clabe) return null;

    const { data } = await admin
      .from("campania_colaboraciones")
      .select("id, campania_aplicaciones!inner(user_id, campanias!inner(titulo, marcas!inner(nombre)))")
      .eq("campania_aplicaciones.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const fila = data?.[0];
    if (!fila) return null;
    const a = fila.campania_aplicaciones as unknown as {
      campanias: { titulo: string; marcas: { nombre: string } };
    };
    return {
      colaboracionId: fila.id as string,
      campania: a?.campanias?.titulo ?? "la campaña",
      marca: a?.campanias?.marcas?.nombre ?? "la marca",
    };
  } catch {
    return null;
  }
}

// ————————————————— Mis colaboraciones —————————————————

export type ColaboracionCreador = {
  id: string;
  campaniaId: string;
  marca: string;
  producto: string | null;
  entregable: string | null;
  imagenUrl: string | null;
  // activa | en_revision | completada | cancelada
  estado: string;
  fechaInicio: string | null;
  fechaEntrega: string | null;
  postuladaAt: string | null;
  compensacion: number | null;
  moneda: string;
  // Resumen de sus pagos, para la etiqueta de la tarjeta.
  pagoEstado: "pendiente" | "en_proceso" | "pagado";
};

export async function misColaboraciones(): Promise<ColaboracionCreador[]> {
  const user = await quienSoy();
  if (!user) return [];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("campania_colaboraciones")
      .select("*, campania_aplicaciones!inner(id, user_id, created_at, campanias!inner(id, titulo, imagen_url, marcas!inner(nombre)))")
      .eq("campania_aplicaciones.user_id", user.id)
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    const pagos = await pagosDe(data.map((c) => c.id as string));

    return data.map((c): ColaboracionCreador => {
      const a = c.campania_aplicaciones as unknown as {
        created_at: string;
        campanias: { id: string; titulo: string; imagen_url: string | null; marcas: { nombre: string } };
      };
      const mios = pagos.get(c.id as string) || [];
      const todosPagados = mios.length > 0 && mios.every((p) => pagado(p.estado));
      const algunoEnCurso = mios.some((p) => p.estado === "en_proceso" || pagado(p.estado));
      return {
        id: c.id as string,
        campaniaId: a?.campanias?.id ?? "",
        marca: a?.campanias?.marcas?.nombre ?? "Marca",
        producto: (c.producto as string) || a?.campanias?.titulo || null,
        entregable: (c.entregable as string) || null,
        imagenUrl: a?.campanias?.imagen_url ?? null,
        estado: (c.estado as string) || "activa",
        fechaInicio: (c.fecha_inicio as string) || null,
        fechaEntrega: (c.fecha_entrega as string) || null,
        postuladaAt: a?.created_at ?? null,
        compensacion: (c.compensacion as number) ?? null,
        moneda: (c.moneda as string) || "MXN",
        pagoEstado: todosPagados ? "pagado" : algunoEnCurso ? "en_proceso" : "pendiente",
      };
    });
  } catch {
    return [];
  }
}

function pagado(estado: string): boolean {
  return estado === "pagado" || estado === "entregado";
}

async function pagosDe(ids: string[]) {
  const mapa = new Map<string, { numero: number; tipo: string; monto: number | null; valor: string | null; moneda: string; fecha: string | null; estado: string }[]>();
  if (!ids.length) return mapa;
  const { data } = await createAdminClient()
    .from("colaboracion_pagos").select("*").in("colaboracion_id", ids).order("numero");
  for (const p of data || []) {
    const k = p.colaboracion_id as string;
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k)!.push({
      numero: (p.numero as number) || 1,
      tipo: (p.tipo as string) || "economico",
      monto: (p.monto as number) ?? null,
      valor: (p.valor as string) || null,
      moneda: (p.moneda as string) || "MXN",
      fecha: (p.fecha_estimada as string) || null,
      estado: (p.estado as string) || "pendiente",
    });
  }
  return mapa;
}

// ————————————————— El detalle de una colaboración —————————————————

export type Entrega = {
  id: string; tipo: string; ruta: string; nombre: string | null;
  estado: string; fecha: string;
};

export type ComentarioColab = {
  id: string; autor: string; autorTipo: string; sobre: string;
  texto: string | null; adjuntos: { ruta: string; nombre: string }[]; fecha: string;
};

export type DetalleColaboracion = {
  id: string;
  campaniaId: string;
  marca: string;
  marcaLogo: string | null;
  titulo: string;
  producto: string | null;
  entregable: string | null;
  portada: string | null;
  estado: string;
  fechaInicio: string | null;
  fechaEntrega: string | null;
  compensacion: number | null;
  moneda: string;

  // Envío
  direccion: string | null;
  paqueteria: string | null;
  guia: string | null;
  guiaUrl: string | null;
  envioEstado: string;
  pasos: { preparacion: string | null; transito: string | null; reparto: string | null; entregado: string | null };

  // Entregables
  guion: string;
  entregaFinal: string;
  entregas: Entrega[];
  comentarios: ComentarioColab[];
};

export async function getColaboracion(id: string): Promise<DetalleColaboracion | null> {
  const user = await quienSoy();
  if (!user) return null;
  try {
    const admin = createAdminClient();
    const { data: c } = await admin
      .from("campania_colaboraciones")
      .select("*, campania_aplicaciones!inner(user_id, campanias!inner(id, titulo, imagen_url, marcas!inner(nombre, logo_url)))")
      .eq("id", id)
      .maybeSingle();
    if (!c) return null;

    const a = c.campania_aplicaciones as unknown as {
      user_id: string;
      campanias: {
        id: string; titulo: string; imagen_url: string | null;
        marcas: { nombre: string; logo_url: string | null };
      };
    };
    // La colaboración es de otra persona: no se devuelve nada.
    if (a?.user_id !== user.id) return null;

    const [{ data: entregas }, { data: coms }] = await Promise.all([
      admin.from("colaboracion_entregas").select("*")
        .eq("colaboracion_id", id).order("created_at", { ascending: false }),
      admin.from("colaboracion_comentarios").select("*")
        .eq("colaboracion_id", id).order("created_at"),
    ]);

    return {
      id: c.id as string,
      campaniaId: a.campanias.id,
      marca: a.campanias.marcas.nombre,
      marcaLogo: a.campanias.marcas.logo_url,
      titulo: a.campanias.titulo,
      producto: (c.producto as string) || null,
      entregable: (c.entregable as string) || null,
      portada: a.campanias.imagen_url,
      estado: (c.estado as string) || "activa",
      fechaInicio: (c.fecha_inicio as string) || null,
      fechaEntrega: (c.fecha_entrega as string) || null,
      compensacion: (c.compensacion as number) ?? null,
      moneda: (c.moneda as string) || "MXN",

      direccion: (c.direccion as string) || null,
      paqueteria: (c.paqueteria as string) || null,
      guia: (c.guia as string) || null,
      guiaUrl: (c.guia_url as string) || null,
      envioEstado: (c.envio_estado as string) || "en_preparacion",
      pasos: {
        preparacion: (c.envio_preparacion as string) || null,
        transito: (c.envio_transito as string) || null,
        reparto: (c.envio_reparto as string) || null,
        entregado: (c.envio_entregado as string) || (c.entrega_fecha as string) || null,
      },

      guion: (c.guion as string) || "no_empezado",
      entregaFinal: (c.entrega_final as string) || "no_empezado",
      entregas: (entregas || []).map((e) => ({
        id: e.id as string,
        tipo: (e.tipo as string) || "video",
        ruta: e.ruta as string,
        nombre: (e.nombre as string) || null,
        estado: (e.estado as string) || "en_revision",
        fecha: e.created_at as string,
      })),
      comentarios: (coms || []).map((m) => ({
        id: m.id as string,
        autorTipo: (m.autor_tipo as string) || "marca",
        autor: (m.autor_tipo as string) === "equipo"
          ? "Boost Academy"
          : (m.autor_tipo as string) === "creador" ? "Tú" : a.campanias.marcas.nombre,
        sobre: (m.sobre as string) || "video",
        texto: (m.texto as string) || null,
        adjuntos: Array.isArray(m.adjuntos) ? (m.adjuntos as { ruta: string; nombre: string }[]) : [],
        fecha: m.created_at as string,
      })),
    };
  } catch {
    return null;
  }
}

// ————————————————— Subir una entrega —————————————————
// El archivo NO pasa por el servidor: un video de 500 MB no cabe en una server
// action. Se firma una URL de subida y el navegador sube directo al bucket.

const LIMITES: Record<string, { mb: number; tipos: string[] }> = {
  guion: { mb: 10, tipos: ["pdf", "doc", "docx"] },
  video: { mb: 500, tipos: ["mp4", "mov"] },
  extra: { mb: 100, tipos: ["pdf", "doc", "docx", "png", "jpg", "jpeg", "mp4", "mov", "zip"] },
};

export async function limitesDeEntrega(): Promise<typeof LIMITES> {
  return LIMITES;
}

export async function urlParaSubir(
  colaboracionId: string, tipo: string, nombre: string, peso: number
): Promise<{ ruta: string; token: string } | { error: string }> {
  const user = await quienSoy();
  if (!user) return { error: "Inicia sesión." };
  if (!(await esMia(colaboracionId, user.id))) return { error: "Esta campaña no es tuya." };

  const limite = LIMITES[tipo];
  if (!limite) return { error: "Tipo de entrega desconocido." };

  const ext = (nombre.split(".").pop() || "").toLowerCase();
  if (!limite.tipos.includes(ext)) {
    return { error: `Ese archivo no va aquí. Se aceptan: ${limite.tipos.join(", ").toUpperCase()}.` };
  }
  if (peso > limite.mb * 1024 * 1024) {
    return { error: `El archivo pasa de ${limite.mb} MB.` };
  }

  // El nombre lo escribe el servidor: uno del usuario podría salirse de la
  // carpeta o pisar la entrega de otra persona.
  const ruta = `${colaboracionId}/${tipo}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from("entregas").createSignedUploadUrl(ruta);
  if (error || !data) return { error: "No se pudo preparar la subida." };
  return { ruta, token: data.token };
}

export async function registrarEntrega(
  colaboracionId: string, tipo: string, ruta: string, nombre: string, peso: number
): Promise<{ ok: true } | { error: string }> {
  const user = await quienSoy();
  if (!user) return { error: "Inicia sesión." };
  if (!(await esMia(colaboracionId, user.id))) return { error: "Esta campaña no es tuya." };
  // La ruta la firmó el servidor con este prefijo; si no coincide, no se anota.
  if (!ruta.startsWith(`${colaboracionId}/${tipo}/`)) return { error: "Archivo inválido." };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("colaboracion_entregas").insert({
      colaboracion_id: colaboracionId, tipo, ruta,
      nombre: nombre.slice(0, 180), peso, estado: "en_revision",
    });
    if (error) return { error: "No se pudo registrar la entrega." };

    // El seguimiento que ve la empresa se mueve solo: subir algo ES el avance.
    await admin.from("campania_colaboraciones")
      .update(tipo === "guion"
        ? { guion: "en_proceso", updated_at: new Date().toISOString() }
        : { entrega_final: "en_proceso", estado: "en_revision", updated_at: new Date().toISOString() })
      .eq("id", colaboracionId);

    await avisarALaMarca(colaboracionId, tipo);
    return { ok: true };
  } catch {
    return { error: "No se pudo registrar la entrega." };
  }
}

// Enlace firmado para abrir o descargar un archivo. Solo para quien participa.
export async function urlDeArchivo(
  colaboracionId: string, ruta: string
): Promise<string | null> {
  const user = await quienSoy();
  if (!user) return null;
  if (!(await esMia(colaboracionId, user.id))) return null;
  if (!ruta.startsWith(`${colaboracionId}/`)) return null;
  try {
    const { data } = await createAdminClient()
      .storage.from("entregas").createSignedUrl(ruta, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function responderComentario(
  colaboracionId: string, sobre: string, texto: string
): Promise<{ ok: true } | { error: string }> {
  const user = await quienSoy();
  if (!user) return { error: "Inicia sesión." };
  if (!(await esMia(colaboracionId, user.id))) return { error: "Esta campaña no es tuya." };
  const t = texto.trim().slice(0, 2000);
  if (!t) return { error: "Escribe algo." };
  try {
    const { error } = await createAdminClient().from("colaboracion_comentarios").insert({
      colaboracion_id: colaboracionId, autor_tipo: "creador", autor_id: user.id,
      sobre, texto: t,
    });
    if (error) return { error: "No se pudo enviar." };
    return { ok: true };
  } catch {
    return { error: "No se pudo enviar." };
  }
}

async function esMia(colaboracionId: string, userId: string): Promise<boolean> {
  try {
    const { data } = await createAdminClient()
      .from("campania_colaboraciones")
      .select("id, campania_aplicaciones!inner(user_id)")
      .eq("id", colaboracionId)
      .maybeSingle();
    const a = data?.campania_aplicaciones as unknown as { user_id: string } | undefined;
    return a?.user_id === userId;
  } catch {
    return false;
  }
}

async function avisarALaMarca(colaboracionId: string, tipo: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("campania_colaboraciones")
      .select("campania_aplicaciones!inner(campanias!inner(id, titulo, marcas!inner(dueno_id)))")
      .eq("id", colaboracionId).maybeSingle();
    const a = data?.campania_aplicaciones as unknown as {
      campanias: { id: string; titulo: string; marcas: { dueno_id: string | null } };
    } | undefined;
    const dueno = a?.campanias?.marcas?.dueno_id;
    if (!dueno) return;
    const { notificar } = await import("@/lib/notificaciones-actions");
    await notificar(dueno, "general",
      tipo === "guion" ? "Nuevo guion por revisar" : "Nuevo contenido por revisar",
      `Alguien subió su ${tipo === "guion" ? "guion" : "video"} en «${a!.campanias.titulo}».`,
      `/app/marca/campanias/${a!.campanias.id}`);
  } catch {
    // Que falle el aviso no debe tumbar la entrega, que es lo importante.
  }
}

// ————————————————— Pagos —————————————————

export type FilaPago = {
  colaboracionId: string;
  campania: string;
  producto: string | null;
  numero: number;
  tipo: string;
  monto: number | null;
  valor: string | null;
  moneda: string;
  fecha: string | null;
  estado: string;
  // Resumen de la colaboración completa, que se pinta una vez por grupo.
  totalPagos: number;
  pagados: number;
};

export type ResumenPagos = {
  filas: FilaPago[];
  // Lo cobrado en el mes en curso y cómo va contra el mes pasado.
  esteMes: number;
  moneda: string;
  variacion: number | null;
  // 12 puntos para la línea del encabezado.
  serie: number[];
  enCurso: number;
};

export async function misPagos(
  filtro: "proceso" | "finalizados" | "todos" = "proceso"
): Promise<ResumenPagos> {
  const vacio: ResumenPagos = { filas: [], esteMes: 0, moneda: "MXN", variacion: null, serie: [], enCurso: 0 };
  const user = await quienSoy();
  if (!user) return vacio;

  try {
    const admin = createAdminClient();
    const { data: colabs } = await admin
      .from("campania_colaboraciones")
      .select("id, producto, campania_aplicaciones!inner(user_id, campanias!inner(titulo, marcas!inner(nombre)))")
      .eq("campania_aplicaciones.user_id", user.id);
    if (!colabs?.length) return vacio;

    const ids = colabs.map((c) => c.id as string);
    const { data: pagos } = await admin
      .from("colaboracion_pagos").select("*").in("colaboracion_id", ids)
      .order("colaboracion_id").order("numero");
    if (!pagos?.length) return vacio;

    // En la tabla manda el nombre de la marca, no el título de la campaña: es
    // como se lee en el diseño ("Bloom Beauty" arriba, "Bloom Glow Kit" abajo).
    const nombre = new Map(colabs.map((c) => {
      const a = c.campania_aplicaciones as unknown as {
        campanias: { titulo: string; marcas: { nombre: string } };
      };
      return [c.id as string, {
        campania: a?.campanias?.marcas?.nombre ?? a?.campanias?.titulo ?? "Campaña",
        producto: (c.producto as string) || a?.campanias?.titulo || null,
      }];
    }));

    const porColab = new Map<string, typeof pagos>();
    for (const p of pagos) {
      const k = p.colaboracion_id as string;
      if (!porColab.has(k)) porColab.set(k, []);
      porColab.get(k)!.push(p);
    }

    const filas: FilaPago[] = [];
    let enCurso = 0;
    for (const [colabId, lista] of porColab) {
      const pagados = lista.filter((p) => pagado((p.estado as string) || "")).length;
      const completa = pagados === lista.length;
      if (!completa) enCurso++;

      if (filtro === "proceso" && completa) continue;
      if (filtro === "finalizados" && !completa) continue;

      const info = nombre.get(colabId);
      for (const p of lista) {
        filas.push({
          colaboracionId: colabId,
          campania: info?.campania ?? "Campaña",
          producto: info?.producto ?? null,
          numero: (p.numero as number) || 1,
          tipo: (p.tipo as string) || "economico",
          monto: (p.monto as number) ?? null,
          valor: (p.valor as string) || null,
          moneda: (p.moneda as string) || "MXN",
          fecha: (p.fecha_estimada as string) || null,
          estado: (p.estado as string) || "pendiente",
          totalPagos: lista.length,
          pagados,
        });
      }
    }

    // Ganancias: solo lo efectivamente pagado, por mes de su fecha estimada.
    const porMes = new Map<string, number>();
    for (const p of pagos) {
      if (!pagado((p.estado as string) || "")) continue;
      const f = (p.fecha_estimada as string) || "";
      if (!f) continue;
      const k = f.slice(0, 7);
      porMes.set(k, (porMes.get(k) || 0) + ((p.monto as number) || 0));
    }

    const hoy = new Date();
    const clave = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const esteMes = porMes.get(clave(hoy)) || 0;
    const anterior = porMes.get(clave(new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 1, 1)))) || 0;

    const serie: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1));
      serie.push(porMes.get(clave(d)) || 0);
    }

    return {
      filas,
      esteMes,
      moneda: (pagos[0]?.moneda as string) || "MXN",
      variacion: anterior > 0 ? Math.round(((esteMes - anterior) / anterior) * 100) : null,
      serie,
      enCurso,
    };
  } catch {
    return vacio;
  }
}
