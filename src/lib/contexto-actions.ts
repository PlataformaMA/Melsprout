"use server";

import { createClient } from "@/lib/supabase/server";

// Guarda país, zona horaria y canal de origen del usuario (detectados en el
// navegador). Solo rellena lo que esté VACÍO — nunca sobrescribe.
export async function guardarContexto(datos: {
  zonaHoraria?: string;
  pais?: string;
  canalOrigen?: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("pais, canal_origen")
    .eq("id", user.id)
    .maybeSingle();

  const update: Record<string, string> = {};
  if (datos.pais && !perfil?.pais) update.pais = datos.pais.slice(0, 60);
  if (datos.canalOrigen && !perfil?.canal_origen) update.canal_origen = datos.canalOrigen.slice(0, 120);
  if (Object.keys(update).length > 0) {
    await supabase.from("profiles").update(update).eq("id", user.id);
  }

  // La zona horaria se guarda en el metadata (no hay columna dedicada); sirve
  // para que la racha cuente en el horario real del usuario.
  if (datos.zonaHoraria && user.user_metadata?.zona_horaria !== datos.zonaHoraria) {
    await supabase.auth.updateUser({ data: { zona_horaria: datos.zonaHoraria } });
  }
}
