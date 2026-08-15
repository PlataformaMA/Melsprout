import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getCursos, getVideoClaseDB } from "@/lib/cursos-db";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { getRecursos } from "@/lib/recursos-actions";
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
  const completadasSet = await getClasesCompletadas();
  const completadasIds = modulo.clases.map((c) => c.id).filter((id) => completadasSet.has(id));

  // Recursos de ESTA clase (la clase ya está desbloqueada si la está viendo).
  const recursos = (await getRecursos([clase.id])).filter((r) => r.claseId === clase.id);

  // ¿Ya mandó el reto de esta clase? Sin eso no puede avanzar.
  const { data: sub } = await supabase
    .from("reto_submissions")
    .select("estado, revision")
    .eq("user_id", user.id)
    .eq("reto_id", clase.id)
    .maybeSingle();
  const retoEnviado = !!sub && (sub.estado === "publicado" || sub.revision === "aprobado");

  // Siguiente clase GLOBAL (a través de todos los módulos); null si es la última.
  const orden = cursos.flatMap((m) => m.clases.map((c) => c.id));
  const pos = orden.indexOf(clase.id);
  const siguienteHref = pos >= 0 && pos < orden.length - 1 ? `/app/clase/${orden[pos + 1]}` : null;

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
      completadasIds={completadasIds}
      videoUrl={videoUrl}
      siguienteHref={siguienteHref}
      retoEnviado={retoEnviado}
      recursos={recursos}
    />
  );
}
