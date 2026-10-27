import { conversaciones, mensajesDe } from "@/lib/mensajes-marca";
import { MktMensajes } from "@/components/MktMensajes";

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca } = await searchParams;
  const lista = await conversaciones();

  // Los avisos traen ?marca=… para abrir directo esa conversación.
  const abierta = lista.find((c) => c.marcaId === marca) ?? null;
  const mensajes = abierta ? await mensajesDe(abierta.marcaId) : [];

  return <MktMensajes lista={lista} abierta={abierta} mensajes={mensajes} />;
}
