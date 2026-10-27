import { solicitudesPendientes } from "@/lib/mkt-admin";
import { MktSolicitudes } from "@/components/MktSolicitudes";

export default async function SolicitudesPage() {
  return <MktSolicitudes lista={await solicitudesPendientes()} />;
}
