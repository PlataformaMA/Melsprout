import { solicitudesPendientes, postulacionesPendientes } from "@/lib/mkt-admin";
import { MktSolicitudes } from "@/components/MktSolicitudes";

export default async function SolicitudesPage() {
  const [lista, postulaciones] = await Promise.all([
    solicitudesPendientes(),
    postulacionesPendientes(),
  ]);
  return <MktSolicitudes lista={lista} postulaciones={postulaciones} />;
}
