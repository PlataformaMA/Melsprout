import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";

// Todo lo que cuelga de /app/marca es solo para cuentas de empresa.
export default async function MarcaLayout({ children }: { children: React.ReactNode }) {
  if (!(await miMarca())) redirect("/app/ruta");
  return <>{children}</>;
}
