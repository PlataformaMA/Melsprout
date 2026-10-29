import { redirect } from "next/navigation";
import { getCreadorEquipo } from "@/lib/mkt-admin";
import { MktCreadorPerfil } from "@/components/MktCreadorPerfil";

export default async function CreadorEquipoPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ volver?: string }>;
}) {
  const { id } = await params;
  const { volver } = await searchParams;
  const c = await getCreadorEquipo(id);
  if (!c) redirect("/app/admin/marketplace/creadores");

  // Se vuelve a donde se venía (solicitudes, una campaña…) y no siempre a la
  // lista de creadores, que casi nunca es de donde se entró.
  const destino = volver && volver.startsWith("/app/admin/marketplace/")
    ? volver
    : "/app/admin/marketplace/creadores";

  return <MktCreadorPerfil c={c} volverHref={destino} />;
}
