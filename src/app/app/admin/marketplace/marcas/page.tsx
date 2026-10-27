import { marcasDelEquipo } from "@/lib/mkt-admin";
import { MktMarcas } from "@/components/MktMarcas";

export default async function MarcasPage() {
  return <MktMarcas lista={await marcasDelEquipo()} />;
}
