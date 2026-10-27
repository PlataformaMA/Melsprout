import { campaniasDelEquipo } from "@/lib/mkt-admin";
import { MktCampanias } from "@/components/MktCampanias";

export default async function CampaniasPage() {
  return <MktCampanias lista={await campaniasDelEquipo()} />;
}
