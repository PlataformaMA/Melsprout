import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Cuando a alguien lo seleccionan, su colaboración tiene que existir YA.
//
// Antes la fila se creaba de rebote, la primera vez que la marca abría la
// pestaña de Colaboraciones. Mientras eso no pasara, la creadora entraba a
// "Mis campañas" y no veía nada: le habían dicho que sí y su pantalla seguía
// vacía. Ahora se crea en el momento de aceptarla, venga de donde venga.

export async function asegurarColaboracion(aplicacionId: string): Promise<void> {
  try {
    await createAdminClient()
      .from("campania_colaboraciones")
      .upsert({ aplicacion_id: aplicacionId }, { onConflict: "aplicacion_id", ignoreDuplicates: true });
  } catch (e) {
    // Que no se pueda crear no debe tumbar la selección, que es lo importante;
    // la pestaña de la marca la sigue creando como respaldo.
    console.error("[colaboracion] no se pudo crear la fila:", e);
  }
}

// La etapa y el estado son dos nombres de la misma cosa y tienen que ir
// juntos: la creadora lee la etapa y el equipo lee el estado. Si se separan,
// alguien queda aceptado en una pantalla y pendiente en la otra.
export function etapaDelEstado(estado: string): "seleccionada" | "descartada" | "postulada" {
  if (estado === "aceptada") return "seleccionada";
  if (estado === "rechazada") return "descartada";
  return "postulada";
}
