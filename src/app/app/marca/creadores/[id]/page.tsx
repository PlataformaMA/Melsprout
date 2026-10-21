import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { miMarca } from "@/lib/marca-cuenta";
import { getCreador } from "@/lib/marca-creadores";
import { MarcaCreadorPerfil } from "@/components/MarcaCreadorPerfil";

export default async function CreadorParaMarcaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");

  const creador = await getCreador(id);
  if (!creador) redirect("/app/marca/marketplace");

  // La bio es lo único que no trae la ficha, y es pública en la comunidad.
  const { data } = await createAdminClient().from("profiles").select("bio").eq("id", id).maybeSingle();

  return (
    <MarcaCreadorPerfil marca={marca} creador={creador} bio={(data?.bio as string) || null} />
  );
}
