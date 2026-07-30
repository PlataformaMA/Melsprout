import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getRetoUnificado } from "@/lib/retos-db";
import { getRetoSubmission } from "@/lib/retos-actions";
import { getCursos } from "@/lib/cursos-db";
import { RetoVista } from "@/components/RetoVista";

export default async function RetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const reto = await getRetoUnificado(id);
  if (!reto) redirect("/app/retos");

  const guardado = await getRetoSubmission(id);

  // Siguiente clase (para el botón "Ver siguiente clase"): la que sigue a esta
  // en el orden del curso; si es la última, vuelve a la Ruta.
  const cursos = await getCursos();
  const orden = cursos.flatMap((m) => m.clases.map((c) => c.id));
  const idx = orden.indexOf(reto.claseId);
  const siguienteHref = idx >= 0 && idx < orden.length - 1 ? `/app/clase/${orden[idx + 1]}` : "/app/ruta";

  return (
    <RetoVista
      reto={reto}
      perfil={{
        full_name: perfil.full_name,
        avatar_url: perfil.avatar_url,
        racha: perfil.racha,
        gemas: perfil.gemas,
      }}
      guardado={guardado}
      siguienteHref={siguienteHref}
    />
  );
}
