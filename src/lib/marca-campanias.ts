"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { notificar } from "@/lib/notificaciones-actions";
import { miMarca } from "@/lib/marca-cuenta";

// Las campañas desde el lado de la empresa: crearlas, guardarlas como borrador
// y mandarlas a aprobación. Es la MISMA tabla que ve la creadora: cuando el
// equipo aprueba, la campaña aparece en su Marketplace sin copiar nada.

export type EstadoCampania = "borrador" | "pendiente" | "aprobada" | "rechazada" | "cerrada";

export type Pregunta = {
  id: string;
  texto: string;
  tipo: "corto" | "largo" | "enlace";
  obligatoria: boolean;
  compartir: boolean;
};

export type Compensacion = {
  intercambio?: { productos: string };
  monto?: { cantidad: number; moneda: string };
  afiliados?: { porcentaje: number; duracion: string };
};

export type CampaniaMarca = {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagenes: string[];
  tipos: string[];
  limitePostulaciones: number | null;
  nicho: string | null;
  genero: string | null;
  edadMin: number | null;
  edadMax: number | null;
  seguidoresMin: number;
  ubicaciones: string[];
  preguntas: Pregunta[];
  compensacionDetalle: string | null;
  compensacion: Compensacion;
  enMarketplace: boolean;
  compartirConLista: boolean;
  estado: EstadoCampania;
  notaEquipo: string | null;
  cierraAt: string | null;
  publicadaAt: string | null;
  // Cuánta gente se postuló y cuánta quedó seleccionada.
  postuladas: number;
  seleccionadas: number;
};

// Los rangos de seguidores del formulario. 0 = sin cantidad específica.
export async function rangosDeSeguidores(): Promise<{ valor: number; texto: string }[]> {
  return [
    { valor: 0, texto: "Sin cantidad específica" },
    { valor: 100, texto: "+100" },
    { valor: 1000, texto: "+1k" },
    { valor: 10000, texto: "+10k" },
    { valor: 50000, texto: "+50k" },
    { valor: 100000, texto: "+100k" },
    { valor: 500000, texto: "+500k" },
  ];
}

function armar(c: Record<string, unknown>, postuladas = 0, seleccionadas = 0): CampaniaMarca {
  return {
    id: c.id as string,
    titulo: c.titulo as string,
    descripcion: (c.descripcion as string) || null,
    imagenes: (c.imagenes as string[]) || [],
    tipos: (c.tipos as string[]) || [],
    limitePostulaciones: (c.limite_postulaciones as number) ?? null,
    nicho: (c.nicho as string) || null,
    genero: (c.genero as string) || null,
    edadMin: (c.edad_min as number) ?? null,
    edadMax: (c.edad_max as number) ?? null,
    seguidoresMin: (c.seguidores_min as number) || 0,
    ubicaciones: (c.ubicaciones as string[]) || [],
    preguntas: (c.preguntas as Pregunta[]) || [],
    compensacionDetalle: (c.compensacion_detalle as string) || null,
    compensacion: (c.compensacion as Compensacion) || {},
    enMarketplace: c.en_marketplace !== false,
    compartirConLista: c.compartir_con_lista === true,
    estado: ((c.estado as string) || "borrador") as EstadoCampania,
    notaEquipo: (c.nota_equipo as string) || null,
    cierraAt: (c.cierra_at as string) || null,
    publicadaAt: (c.publicada_at as string) || null,
    postuladas, seleccionadas,
  };
}

export async function misCampaniasDeMarca(): Promise<CampaniaMarca[]> {
  const marca = await miMarca();
  if (!marca) return [];
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("campanias").select("*")
      .eq("marca_id", marca.id).order("created_at", { ascending: false });
    if (!data?.length) return [];

    const ids = data.map((c) => c.id as string);
    const { data: apps } = await admin
      .from("campania_aplicaciones").select("campania_id, etapa").in("campania_id", ids);
    const post = new Map<string, number>();
    const sel = new Map<string, number>();
    for (const a of apps || []) {
      const k = a.campania_id as string;
      post.set(k, (post.get(k) || 0) + 1);
      if (a.etapa !== "postulada") sel.set(k, (sel.get(k) || 0) + 1);
    }
    return data.map((c) => armar(c, post.get(c.id as string) || 0, sel.get(c.id as string) || 0));
  } catch {
    return [];
  }
}

export async function getCampaniaDeMarca(id: string): Promise<CampaniaMarca | null> {
  const marca = await miMarca();
  if (!marca) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("campanias").select("*")
      .eq("id", id).eq("marca_id", marca.id).maybeSingle();
    return data ? armar(data) : null;
  } catch {
    return null;
  }
}

// Crear la campaña con su nombre, que es lo único que pide el primer pop-up.
export async function crearBorrador(titulo: string): Promise<{ id: string } | { error: string }> {
  const marca = await miMarca();
  if (!marca) return { error: "Esta cuenta no es de una empresa." };
  const t = titulo.trim();
  if (t.length < 3) return { error: "Ponle un nombre a tu campaña." };

  try {
    const { data, error } = await createAdminClient().from("campanias")
      .insert({ marca_id: marca.id, titulo: t, estado: "borrador", activa: false })
      .select("id").single();
    if (error || !data) return { error: "No se pudo crear la campaña." };
    return { id: data.id as string };
  } catch {
    return { error: "El portal de marcas todavía no está activado." };
  }
}

// Guardar lo que lleve del formulario. Se llama en cada paso y al guardar
// borrador: nunca se pierde lo escrito.
export async function guardarCampania(
  id: string, campos: Partial<CampaniaMarca>
): Promise<{ ok: true } | { error: string }> {
  const marca = await miMarca();
  if (!marca) return { error: "Esta cuenta no es de una empresa." };

  try {
    const admin = createAdminClient();
    const { data: actual } = await admin.from("campanias")
      .select("estado, marca_id").eq("id", id).maybeSingle();
    if (!actual || actual.marca_id !== marca.id) return { error: "Esa campaña no es tuya." };

    // Ya publicada: los datos generales se pueden corregir, la compensación no.
    // Es lo que dice el aviso antes de publicar, y aquí se hace cumplir.
    const yaPublicada = actual.estado !== "borrador";

    const fila: Record<string, unknown> = {};
    const poner = (k: string, v: unknown) => { if (v !== undefined) fila[k] = v; };
    poner("titulo", campos.titulo?.trim());
    poner("descripcion", campos.descripcion);
    poner("imagenes", campos.imagenes);
    poner("tipos", campos.tipos);
    poner("limite_postulaciones", campos.limitePostulaciones);
    poner("nicho", campos.nicho);
    poner("genero", campos.genero);
    poner("edad_min", campos.edadMin);
    poner("edad_max", campos.edadMax);
    poner("seguidores_min", campos.seguidoresMin);
    poner("ubicaciones", campos.ubicaciones);
    poner("preguntas", campos.preguntas);
    poner("cierra_at", campos.cierraAt);
    poner("en_marketplace", campos.enMarketplace);
    poner("compartir_con_lista", campos.compartirConLista);
    if (!yaPublicada) {
      poner("compensacion_detalle", campos.compensacionDetalle);
      poner("compensacion", campos.compensacion);
    }
    if (Object.keys(fila).length === 0) return { ok: true };

    const { error } = await admin.from("campanias").update(fila).eq("id", id);
    if (error) return { error: "No se pudo guardar." };
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar." };
  }
}

// Mandarla a aprobación. No sale al Marketplace hasta que el equipo la revise.
export async function publicarCampania(id: string): Promise<{ ok: true } | { error: string }> {
  const marca = await miMarca();
  if (!marca) return { error: "Esta cuenta no es de una empresa." };
  if (!marca.aprobada) {
    return { error: "Tu empresa todavía está en revisión. En cuanto te aprobemos podrás publicar." };
  }

  try {
    const admin = createAdminClient();
    const { data: c } = await admin.from("campanias")
      .select("titulo, descripcion, marca_id, compensacion").eq("id", id).maybeSingle();
    if (!c || c.marca_id !== marca.id) return { error: "Esa campaña no es tuya." };
    if (!c.descripcion) return { error: "Falta la descripción de la campaña." };
    if (!c.compensacion || Object.keys(c.compensacion as object).length === 0) {
      return { error: "Elige al menos una forma de compensación." };
    }

    const { error } = await admin.from("campanias")
      .update({ estado: "pendiente", publicada_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: "No se pudo publicar." };

    const { data: equipo } = await admin.from("profiles").select("id").eq("is_admin", true);
    await Promise.all(
      (equipo || []).map((p) => notificar(p.id as string, "general",
        "Una campaña espera tu aprobación",
        `${marca.nombre} publicó «${c.titulo as string}».`,
        "/app/admin"))
    );
    return { ok: true };
  } catch {
    return { error: "No se pudo publicar." };
  }
}

// ————— El equipo aprueba o regresa la campaña —————
export async function revisarCampania(
  id: string, aprobar: boolean, nota = ""
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return { error: "No autorizado." };
  if (!aprobar && !nota.trim()) {
    return { error: "Escribe qué tiene que cambiar: sin eso la marca no sabe qué corregir." };
  }

  try {
    const admin = createAdminClient();
    const { data: c } = await admin.from("campanias")
      .select("titulo, marca_id, marcas!inner(nombre, dueno_id)").eq("id", id).maybeSingle();
    if (!c) return { error: "Esa campaña ya no existe." };

    const { error } = await admin.from("campanias").update({
      estado: aprobar ? "aprobada" : "rechazada",
      nota_equipo: nota.trim() || null,
      // Aprobada = visible para las creadoras.
      activa: aprobar,
    }).eq("id", id);
    if (error) return { error: "No se pudo guardar." };

    const marca = c.marcas as unknown as { nombre: string; dueno_id: string | null };
    if (marca?.dueno_id) {
      await notificar(marca.dueno_id, "general",
        aprobar ? "¡Tu campaña fue aprobada! 🎉" : "Tu campaña necesita cambios",
        aprobar
          ? `«${c.titulo as string}» ya está publicada en el Marketplace.`
          : nota.trim(),
        "/app/marca/campanias");
    }
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar." };
  }
}

export async function campaniasPendientes(): Promise<
  { id: string; titulo: string; marca: string; descripcion: string | null; fecha: string }[]
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return [];
  try {
    const { data } = await createAdminClient().from("campanias")
      .select("id, titulo, descripcion, publicada_at, marcas!inner(nombre)")
      .eq("estado", "pendiente").order("publicada_at", { ascending: true });
    return (data || []).map((c) => ({
      id: c.id as string,
      titulo: c.titulo as string,
      descripcion: (c.descripcion as string) || null,
      marca: (c.marcas as unknown as { nombre: string })?.nombre ?? "Marca",
      fecha: (c.publicada_at as string) || "",
    }));
  } catch {
    return [];
  }
}
