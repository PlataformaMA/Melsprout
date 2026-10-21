import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";
import { buscarCreadores } from "@/lib/marca-creadores";
import { opcionesDeFiltro } from "@/lib/marketplace";
import { MarcaMarketplace } from "@/components/MarcaMarketplace";

export default async function MarketplaceDeMarcaPage() {
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");
  const { categorias } = await opcionesDeFiltro();
  return (
    <MarcaMarketplace marca={marca} nichos={categorias} inicial={await buscarCreadores()} />
  );
}
