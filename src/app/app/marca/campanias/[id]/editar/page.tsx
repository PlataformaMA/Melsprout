import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";
import { getCampaniaDeMarca, rangosDeSeguidores } from "@/lib/marca-campanias";
import { opcionesDeFiltro } from "@/lib/marketplace";
import { MarcaCampaniaEditor } from "@/components/MarcaCampaniaEditor";

export default async function EditarCampaniaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");

  const campania = await getCampaniaDeMarca(id);
  if (!campania) redirect("/app/marca/campanias");

  const { categorias } = await opcionesDeFiltro();
  return (
    <MarcaCampaniaEditor
      marca={marca}
      campania={campania}
      nichos={categorias}
      rangos={await rangosDeSeguidores()}
    />
  );
}
