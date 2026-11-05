import { redirect } from "next/navigation";
import { getMarcaFicha, campaniasDelEquipo } from "@/lib/mkt-admin";
import { MktMarcaFicha } from "@/components/MktMarcaFicha";

export default async function MarcaFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getMarcaFicha(id);
  if (!m) redirect("/app/admin/marketplace/marcas");

  // Se filtran aquí en vez de pedir otra consulta: son pocas y ya vienen
  // con postuladas y seleccionadas contadas.
  const campanias = (await campaniasDelEquipo()).filter((c) => c.marcaId === id);

  return <MktMarcaFicha m={m} campanias={campanias} />;
}
