import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// El enlace de embajador: /r/<codigo>
//
// Cuenta el clic y manda al checkout con el código pegado, para que la venta
// se pueda atribuir después. No pide sesión a propósito: lo abre gente de
// fuera, que es justamente de quien queremos las ventas.

const SITIO = (() => {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) return env;
  return "https://melsprout.boostacademy.io";
})();

// Hotmart devuelve este parámetro en sus avisos de compra, así que es el que
// permite saber de quién vino la venta.
const PARAMETRO = "sck";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const limpio = (codigo || "").trim().toLowerCase();

  // Si el código no tiene forma de código, ni se pregunta a la base.
  if (!/^[a-z0-9]{4,16}$/.test(limpio)) return NextResponse.redirect(SITIO, 302);

  try {
    const db = createAdminClient();
    // Suma el clic y devuelve el destino de una sola vez: si se leyera y
    // luego se escribiera, dos clics al mismo tiempo contarían como uno.
    const { data, error } = await db.rpc("sumar_clic", { p_codigo: limpio });
    // La función devuelve el destino pelón. Se aceptan las otras formas por si
    // la base trae una versión anterior que devolvía una tabla.
    const destino = typeof data === "string"
      ? data
      : Array.isArray(data)
        ? (data[0] as { destino?: string })?.destino
        : (data as { destino?: string } | null)?.destino;

    if (error || !destino) {
      // Código inexistente o campaña sin checkout configurado: a la casa, no
      // a una pantalla de error que no le dice nada a quien venía a comprar.
      return NextResponse.redirect(SITIO, 302);
    }

    const url = new URL(destino as string);
    url.searchParams.set(PARAMETRO, limpio);
    return NextResponse.redirect(url.toString(), 302);
  } catch (e) {
    console.error("[r] enlace de embajador:", e);
    return NextResponse.redirect(SITIO, 302);
  }
}
