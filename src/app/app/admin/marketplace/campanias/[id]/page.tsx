import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { puedeVerCampania } from "@/lib/acceso-campania";
import { postulacionesDe } from "@/lib/marca-creadores";
import { colaboracionesDe, opcionesColaboracion } from "@/lib/marca-colaboraciones";
import { CampaniaDetalleCuerpo } from "@/components/MarcaCampaniaDetalle";
import type { CampaniaMarca, Compensacion, Pregunta, EstadoCampania } from "@/lib/marca-campanias";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://melsprout.boostacademy.io";

// El detalle de una campaña visto por el equipo. Es la misma pantalla que ve
// la empresa (mismas pestañas, mismas tablas): solo cambia el menú de al lado
// y que aquí no salen los controles que solo le tocan a la marca.
export default async function CampaniaEquipoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await puedeVerCampania(id))) redirect("/app/admin/marketplace/campanias");

  const db = createAdminClient();
  const { data: c } = await db.from("campanias").select("*").eq("id", id).maybeSingle();
  if (!c) redirect("/app/admin/marketplace/campanias");

  const [postulaciones, colaboraciones, opciones] = await Promise.all([
    postulacionesDe(id),
    colaboracionesDe(id),
    opcionesColaboracion(),
  ]);

  const campania: CampaniaMarca = {
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
    postuladas: postulaciones.length,
    seleccionadas: postulaciones.filter((p) => p.etapa === "seleccionada").length,
  };

  return (
    <CampaniaDetalleCuerpo
      campania={campania}
      postulaciones={postulaciones}
      colaboraciones={colaboraciones}
      opciones={opciones}
      sitio={SITIO}
      volverHref="/app/admin/marketplace/campanias"
      comoEquipo
    />
  );
}
