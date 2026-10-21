import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { miMarca } from "@/lib/marca-cuenta";
import { opcionesDeFiltro } from "@/lib/marketplace";
import { AltaEmpresa } from "@/components/AltaEmpresa";

// Último paso del registro de una marca: sus datos.
export default async function AltaEmpresaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Si ya la dio de alta, a su portal.
  if (await miMarca()) redirect("/app/marca");

  const { categorias } = await opcionesDeFiltro();
  return <AltaEmpresa categorias={categorias} />;
}
