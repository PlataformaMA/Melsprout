import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";
import { opcionesDeFiltro } from "@/lib/marketplace";
import { MarcaCuenta } from "@/components/MarcaCuenta";

export default async function CuentaDeMarcaPage() {
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");
  const { categorias } = await opcionesDeFiltro();
  return <MarcaCuenta marca={marca} categorias={categorias} />;
}
