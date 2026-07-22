import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getCursos, getVideoClaseDB } from "@/lib/cursos-db";
import { ReproductorClase } from "@/components/ReproductorClase";

export default async function ClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const cursos = await getCursos();
  const modulo = cursos.find((m) => m.clases.some((c) => c.id === id)) ?? cursos[0];
  const clase = modulo.clases.find((c) => c.id === id) ?? modulo.clases[0];

  // Progreso guardado (para restaurar la barra y no arrancar en 0).
  const { data: prog } = await supabase
    .from("clase_progreso")
    .select("completada, segundos_vistos")
    .eq("user_id", user.id)
    .eq("clase_id", clase.id)
    .maybeSingle();

  const videoUrl = await getVideoClaseDB(clase.id);

  return (
    <ReproductorClase
      clase={clase}
      modulo={modulo}
      avatarUrl={perfil.avatar_url}
      nombre={perfil.full_name ?? "creador"}
      gemas={perfil.gemas}
      racha={perfil.racha}
      yaCompletada={prog?.completada === true}
      vistoInicial={(prog?.segundos_vistos as number) ?? 0}
      videoUrl={videoUrl}
    />
  );
}
