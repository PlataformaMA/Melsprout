import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";
import { misCampaniasDeMarca } from "@/lib/marca-campanias";
import { MarcaCampanias } from "@/components/MarcaCampanias";

export default async function CampaniasDeMarcaPage() {
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");
  return <MarcaCampanias marca={marca} campanias={await misCampaniasDeMarca()} />;
}
