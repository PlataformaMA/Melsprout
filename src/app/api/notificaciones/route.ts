import { NextResponse } from "next/server";
import { getNotificaciones, recordarPerfilIncompleto } from "@/lib/notificaciones-actions";

// La campanita pide por aquí sus notificaciones y su número de pendientes.
// Con una petición normal el número sale bien en todas las pantallas.
export async function GET(request: Request) {
  const soloConteo = new URL(request.url).searchParams.get("conteo") === "1";
  try {
    // Antes de contar, se revisa si le falta algo del perfil. Solo crea el
    // recordatorio si de verdad falta y no se le mandó en los últimos tres días.
    await recordarPerfilIncompleto();
    const { lista, sinLeer } = await getNotificaciones();
    return NextResponse.json(soloConteo ? { sinLeer } : { lista, sinLeer });
  } catch {
    return NextResponse.json({ lista: [], sinLeer: 0 });
  }
}
