"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { puedeVerAplicacion } from "@/lib/acceso-campania";
import { notificar } from "@/lib/notificaciones-actions";

// El contrato de derechos de imagen de una colaboración.
//
// Una marca que va a usar la cara de alguien en su publicidad necesita su
// permiso por escrito, y la creadora necesita saber a qué dijo que sí.
//
// La marca (o el equipo) sube el documento; la creadora lo firma. "Firmar"
// aquí es dejar constancia —quién, cuándo y sobre qué archivo—, no dibujar
// una rúbrica: lo que vale es que quede registrado sobre ese documento.

export type Contrato = {
  colaboracionId: string;
  nombre: string | null;
  subidoAt: string | null;
  firmadoAt: string | null;
  firmadoPor: string | null;
  // Si ya está, la URL firmada para verlo o bajarlo.
  url: string | null;
  // Qué puede hacer quien está mirando.
  puedoSubir: boolean;
  puedoFirmar: boolean;
};

const MAX_MB = 20;
const TIPOS = ["pdf", "doc", "docx"];

async function yo() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  return user;
}

// La colaboración y quién es quién respecto de ella.
async function contexto(colaboracionId: string) {
  const user = await yo();
  if (!user) return null;

  const { data } = await createAdminClient()
    .from("campania_colaboraciones")
    .select("id, contrato_ruta, contrato_nombre, contrato_subido_at, contrato_firmado_at, contrato_firmado_por, aplicacion_id, campania_aplicaciones!inner(user_id, campanias!inner(titulo, marcas!inner(nombre)))")
    .eq("id", colaboracionId)
    .maybeSingle();
  if (!data) return null;

  const app = data.campania_aplicaciones as unknown as {
    user_id: string; campanias: { titulo: string; marcas: { nombre: string } };
  };

  // La creadora es la dueña de la postulación. La otra parte —marca o
  // equipo— es quien ya puede ver esa postulación por las reglas de siempre.
  const soyLaCreadora = app.user_id === user.id;
  const soyLaOtraParte = !soyLaCreadora && (await puedeVerAplicacion(data.aplicacion_id as string));
  if (!soyLaCreadora && !soyLaOtraParte) return null;

  return { user, fila: data as Record<string, unknown>, app, soyLaCreadora, soyLaOtraParte };
}

export async function contratoDe(colaboracionId: string): Promise<Contrato | null> {
  const ctx = await contexto(colaboracionId);
  if (!ctx) return null;

  const ruta = (ctx.fila.contrato_ruta as string) || null;
  let url: string | null = null;
  if (ruta) {
    try {
      const { data } = await createAdminClient()
        .storage.from("entregas").createSignedUrl(ruta, 60 * 60);
      url = data?.signedUrl ?? null;
    } catch { /* el enlace se queda en null y la pantalla lo dice */ }
  }

  return {
    colaboracionId,
    nombre: (ctx.fila.contrato_nombre as string) || null,
    subidoAt: (ctx.fila.contrato_subido_at as string) || null,
    firmadoAt: (ctx.fila.contrato_firmado_at as string) || null,
    firmadoPor: (ctx.fila.contrato_firmado_por as string) || null,
    url,
    puedoSubir: ctx.soyLaOtraParte,
    // Solo ella firma, solo una vez y solo si hay algo que firmar: firmar un
    // contrato que todavía no existe no significaría nada.
    puedoFirmar: ctx.soyLaCreadora && !!ruta && !ctx.fila.contrato_firmado_at,
  };
}

// ————————————————— Subirlo —————————————————

export async function urlParaSubirContrato(
  colaboracionId: string, nombre: string, peso: number
): Promise<{ ruta: string; token: string } | { error: string }> {
  const ctx = await contexto(colaboracionId);
  if (!ctx) return { error: "Esta colaboración no es tuya." };
  if (!ctx.soyLaOtraParte) return { error: "El contrato lo sube la marca." };

  const ext = (nombre.split(".").pop() || "").toLowerCase();
  if (!TIPOS.includes(ext)) return { error: `Se aceptan ${TIPOS.join(", ").toUpperCase()}.` };
  if (peso > MAX_MB * 1024 * 1024) return { error: `El archivo pasa de ${MAX_MB} MB.` };

  const ruta = `${colaboracionId}/contrato/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from("entregas").createSignedUploadUrl(ruta);
  if (error || !data) return { error: "No se pudo preparar la subida." };
  return { ruta, token: data.token };
}

export async function registrarContrato(
  colaboracionId: string, ruta: string, nombre: string
): Promise<{ ok: true } | { error: string }> {
  const ctx = await contexto(colaboracionId);
  if (!ctx) return { error: "Esta colaboración no es tuya." };
  if (!ctx.soyLaOtraParte) return { error: "El contrato lo sube la marca." };
  if (!ruta.startsWith(`${colaboracionId}/contrato/`)) return { error: "Archivo inválido." };

  const { error } = await createAdminClient()
    .from("campania_colaboraciones")
    .update({
      contrato_ruta: ruta,
      contrato_nombre: nombre.slice(0, 180),
      contrato_subido_at: new Date().toISOString(),
      // Documento nuevo, firma de cero: lo que ella firmó era el anterior.
      contrato_firmado_at: null,
      contrato_firmado_por: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", colaboracionId);
  if (error) return { error: "No se pudo guardar el contrato." };

  await notificar(ctx.app.user_id, "general",
    "Tienes un contrato por firmar ✍️",
    `${ctx.app.campanias?.marcas?.nombre || "La marca"} subió el contrato de derechos de imagen de «${ctx.app.campanias?.titulo || "tu campaña"}».`,
    "/app/campanias");
  return { ok: true };
}

// ————————————————— Firmarlo —————————————————

export async function firmarContrato(
  colaboracionId: string, nombre: string
): Promise<{ ok: true } | { error: string }> {
  const ctx = await contexto(colaboracionId);
  if (!ctx) return { error: "Esta colaboración no es tuya." };
  if (!ctx.soyLaCreadora) return { error: "Este contrato lo firma la creadora." };
  if (!ctx.fila.contrato_ruta) return { error: "Todavía no hay contrato que firmar." };
  // Firmar dos veces sobreescribiría la fecha real de la primera firma.
  if (ctx.fila.contrato_firmado_at) return { error: "Este contrato ya está firmado." };

  const firma = nombre.trim().replace(/\s+/g, " ");
  if (firma.length < 3) return { error: "Escribe tu nombre completo para firmar." };

  const { error } = await createAdminClient()
    .from("campania_colaboraciones")
    .update({
      contrato_firmado_at: new Date().toISOString(),
      contrato_firmado_por: firma.slice(0, 120),
      updated_at: new Date().toISOString(),
    })
    .eq("id", colaboracionId)
    // Por si dos pestañas firman a la vez: solo gana la primera.
    .is("contrato_firmado_at", null);
  if (error) return { error: "No se pudo firmar." };
  return { ok: true };
}
