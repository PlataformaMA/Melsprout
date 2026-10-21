import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";
import { inicioDeMarca } from "@/lib/marca-campanias";
import { MarcaInicio } from "@/components/MarcaInicio";

export default async function MarcaInicioPage() {
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");
  const datos = await inicioDeMarca();
  if (!datos) redirect("/app/ruta");
  return <MarcaInicio marca={marca} datos={datos} />;
}
