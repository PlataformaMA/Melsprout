"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificar } from "@/lib/notificaciones-actions";

// Manda una sugerencia de curso desde la sección de Cursos Especiales.
export async function sugerirCurso(texto: string): Promise<{ ok: true } | { error: string }> {
  const t = texto.trim();
  if (t.length < 10) return { error: "Cuéntanos un poco más de tu curso ideal." };
  if (t.length > 600) return { error: "Resúmelo en menos de 600 caracteres." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const admin = createAdminClient();

  // Una por día por persona: evita que se llene de repetidos.
  const desde = new Date(Date.now() - 864e5).toISOString();
  const { count } = await admin
    .from("sugerencias_cursos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gt("created_at", desde);
  if ((count ?? 0) >= 3) return { error: "Ya mandaste varias hoy. Sigue mañana 💜" };

  const { error } = await admin.from("sugerencias_cursos").insert({ user_id: user.id, texto: t });
  if (error) return { error: "No se pudo enviar tu sugerencia." };

  await notificar(user.id, "general", "¡Recibimos tu sugerencia! 💜",
    "Gracias por decirnos qué quieres aprender. La revisamos con el equipo.", "/app/especiales");
  return { ok: true };
}
