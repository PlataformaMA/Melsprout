import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getCursos, getVideoClaseDB } from "@/lib/cursos-db";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { getRecursos } from "@/lib/recursos-actions";
import { puedeVerClase } from "@/lib/acceso-actions";
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

  const cursos = await getCursos(true);
  // Una clase sin video (o "Próximamente") todavía no existe para el alumno:
  // no está en la lista y no se abre.
  const modulo = cursos.find((m) => m.clases.some((c) => c.id === id));
  const clase = modulo?.clases.find((c) => c.id === id);
  if (!modulo || !clase || clase.proximamente) redirect("/app/ruta");
  // Un curso especial se abre solo si se compró (o si es del equipo).
  if (!(await puedeVerClase(clase.id))) redirect("/app/especiales");

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

  // A dónde regresa: la Ruta, o la página del curso si es un curso especial.
  const volverHref = modulo.especialId ? `/app/especiales/${modulo.especialId}` : "/app/ruta";

  // Siguiente clase GLOBAL (a través de todos los módulos de la Ruta); null si
  // es la última. Un curso especial se recorre solo dentro de sí mismo.
  const orden = modulo.especialId
    ? modulo.clases.map((c) => c.id)
    : cursos.filter((m) => !m.especialId).flatMap((m) => m.clases.map((c) => c.id));
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
      volverHref={volverHref}
      retoEnviado={retoEnviado}
      recursos={recursos}
    />
  );
}
