import { redirect } from "next/navigation";
import { getSolicitud } from "@/lib/mkt-admin";
import { MktSolicitudDetalle } from "@/components/MktSolicitudDetalle";

export default async function SolicitudPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getSolicitud(id);
  // Si ya la revisó alguien más (o el id no existe), de vuelta a la lista.
  if (!s) redirect("/app/admin/marketplace/solicitudes");

  return <MktSolicitudDetalle s={s} />;
}
