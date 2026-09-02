"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { notificar } from "@/lib/notificaciones-actions";

export type ComentarioClase = {
  id: string;
  autorId: string;
  autorNombre: string;
  autorAvatar: string | null;
  texto: string;
  fecha: string;
  respondeA: string | null;
};

// ————— Calificación de la clase —————

// Lo que la alumna puso, y el promedio de todas.
export async function getCalificacion(claseId: string): Promise<{ mia: number | null; promedio: number | null; total: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data } = await admin.from("clase_calificaciones").select("user_id, estrellas").eq("clase_id", claseId);
  const todas = data || [];
  const suma = todas.reduce((s, c) => s + ((c.estrellas as number) || 0), 0);
  return {
    mia: user ? (todas.find((c) => c.user_id === user.id)?.estrellas as number) ?? null : null,
    promedio: todas.length ? Math.round((suma / todas.length) * 10) / 10 : null,
    total: todas.length,
  };
}

export async function calificarClase(claseId: string, estrellas: number): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };
  const n = Math.round(estrellas);
  if (n < 1 || n > 5) return { error: "Elige de 1 a 5 estrellas." };

  const admin = createAdminClient();
  const { error } = await admin.from("clase_calificaciones")
    .upsert({ clase_id: claseId, user_id: user.id, estrellas: n }, { onConflict: "clase_id,user_id" });
  if (error) return { error: "No se pudo guardar tu calificación." };
  return { ok: true };
}

// ————— Comentarios de la clase —————

export async function getComentariosClase(claseId: string): Promise<ComentarioClase[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("clase_comentarios")
    .select("id, autor_id, texto, created_at, responde_a")
    .eq("clase_id", claseId).eq("oculto", false)
    .order("created_at", { ascending: true }).limit(200);
  if (!data?.length) return [];

  const ids = [...new Set(data.map((c) => c.autor_id as string))];
  const { data: perfiles } = await admin.from("profiles").select("id, full_name, avatar_url").in("id", ids);
  const p = new Map((perfiles || []).map((x) => [x.id as string, x]));

  return data.map((c) => {
    const per = p.get(c.autor_id as string);
    return {
      id: c.id as string,
      autorId: c.autor_id as string,
      autorNombre: (per?.full_name as string) || "Creador",
      autorAvatar: (per?.avatar_url as string) || null,
      texto: c.texto as string,
      fecha: c.created_at as string,
      respondeA: (c.responde_a as string) || null,
    };
  });
}

export async function comentarClase(
  claseId: string, texto: string, respondeA?: string
): Promise<{ ok: true } | { error: string }> {
  const t = texto.trim();
  if (t.length < 2) return { error: "Escribe tu comentario." };
  if (t.length > 800) return { error: "Resúmelo un poco más." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const admin = createAdminClient();
  const { error } = await admin.from("clase_comentarios")
    .insert({ clase_id: claseId, autor_id: user.id, texto: t, responde_a: respondeA || null });
  if (error) return { error: "No se pudo publicar tu comentario." };

  // Si responde a alguien, se le avisa.
  if (respondeA) {
    const { data: padre } = await admin.from("clase_comentarios").select("autor_id").eq("id", respondeA).maybeSingle();
    const dueno = padre?.autor_id as string | undefined;
    if (dueno && dueno !== user.id) {
      const { data: yo } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      await notificar(dueno, "comentario",
        `${(yo?.full_name as string) || "Alguien"} respondió tu comentario`,
        t.length > 90 ? t.slice(0, 90) + "…" : t, `/app/clase/${claseId}`);
    }
  }
  return { ok: true };
}

// El equipo puede esconder un comentario que no va.
export async function ocultarComentarioClase(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return { error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("clase_comentarios").update({ oculto: true }).eq("id", id);
  if (error) return { error: "No se pudo ocultar." };
  return { ok: true };
}
