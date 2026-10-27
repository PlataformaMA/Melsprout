import { redirect } from "next/navigation";
import { getMarcaFicha } from "@/lib/mkt-admin";
import { MktMarcaFicha } from "@/components/MktMarcaFicha";

export default async function MarcaFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getMarcaFicha(id);
  if (!m) redirect("/app/admin/marketplace/marcas");

  return <MktMarcaFicha m={m} />;
}
