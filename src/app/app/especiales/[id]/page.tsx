import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getCursoEspecial } from "@/lib/cursos-db";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { abiertasDelCurso } from "@/lib/secuencia";
import { tengoAcceso, getTestimonios } from "@/lib/acceso-actions";
import { VentaCursoVista } from "@/components/VentaCursoVista";
import { CursoCompradoVista } from "@/components/CursoCompradoVista";

export default async function CursoEspecialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const curso = await getCursoEspecial(id);
  if (!curso) notFound();

  const yo = {
    nombre: perfil.full_name ?? "Creador",
    avatar: perfil.avatar_url,
    racha: perfil.racha,
    gemas: perfil.gemas,
  };

  // Sin acceso se ve la landing de venta; con acceso, el curso completo.
  if (!(await tengoAcceso(id))) {
    return <VentaCursoVista yo={yo} curso={curso} testimonios={await getTestimonios(id)} />;
  }

  const completadas = await getClasesCompletadas();
  // El curso se lleva en orden: dentro de cada módulo la clase se abre cuando
  // la anterior está terminada (video completo o reto entregado).
  const abiertas = [...(await abiertasDelCurso(user.id, curso.clases, completadas))];
  return <CursoCompradoVista yo={yo} curso={curso} completadas={[...completadas]} abiertas={abiertas} />;
}
