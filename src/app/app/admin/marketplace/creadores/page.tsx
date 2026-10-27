import { creadoresDelEquipo } from "@/lib/mkt-admin";
import { MktCreadores } from "@/components/MktCreadores";

export default async function CreadoresPage() {
  return <MktCreadores lista={await creadoresDelEquipo()} />;
}
