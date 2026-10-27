import { redirect } from "next/navigation";
import { miMarca } from "@/lib/marca-cuenta";
import { miHilo } from "@/lib/mensajes-marca";
import { MarcaShell } from "@/components/MarcaShell";
import { HiloMensajes } from "@/components/HiloMensajes";

// La conversación con el equipo. Antes esto mandaba a WhatsApp; ahora el hilo
// vive aquí, junto a las campañas de las que se está hablando.
export default async function MensajesDeMarcaPage() {
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");

  const hilo = await miHilo();

  return (
    <MarcaShell marca={marca} activo="mensajes">
      <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Mensajes</h1>
      <p className="text-sub text-[13.5px] mt-1">Habla con el equipo de Melsprout.</p>

      <div className="bg-surface border border-border rounded-3xl shadow-sm mt-5 flex flex-col min-h-[62vh] overflow-hidden">
        <HiloMensajes marcaId={marca.id} inicial={hilo?.mensajes ?? []} yoSoy="marca" />
      </div>
    </MarcaShell>
  );
}
