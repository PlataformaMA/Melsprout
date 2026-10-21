import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";
import { getCampaniaDeMarca } from "@/lib/marca-campanias";
import { postulacionesDe } from "@/lib/marca-creadores";
import { colaboracionesDe, opcionesColaboracion } from "@/lib/marca-colaboraciones";
import { MarcaCampaniaDetalle } from "@/components/MarcaCampaniaDetalle";

export default async function CampaniaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");

  const campania = await getCampaniaDeMarca(id);
  if (!campania) redirect("/app/marca/campanias");

  return (
    <MarcaCampaniaDetalle
      marca={marca}
      campania={campania}
      postulaciones={await postulacionesDe(id)}
      colaboraciones={await colaboracionesDe(id)}
      opciones={await opcionesColaboracion()}
      sitio={process.env.NEXT_PUBLIC_SITE_URL || "https://melsprout.boostacademy.io"}
    />
  );
}
