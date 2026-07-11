import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  INSIGHTIQ_CONFIGURADO,
  crearUsuario,
  obtenerCuentas,
  desconectarCuenta,
} from "@/lib/insightiq";
import { eliminarRedInsightIQ } from "@/lib/social-store";

// Desconecta una red del usuario. Se navega aquí como página completa (lleva sesión).
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const destino = `${origin}/app/perfil`;
  const provider = (searchParams.get("provider") || "").toLowerCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!INSIGHTIQ_CONFIGURADO || !provider)
    return NextResponse.redirect(destino);

  try {
    const iqUserId = await crearUsuario(user.id, user.email || "creador");
    if (iqUserId) {
      const cuentas = await obtenerCuentas(iqUserId);
      // Desconecta todas las cuentas de esa red (por si hay más de una).
      for (const c of cuentas.filter((x) => x.provider === provider)) {
        await desconectarCuenta(c.accountId);
      }
    }
    await eliminarRedInsightIQ(user.id, provider);
  } catch (e) {
    console.error("InsightIQ disconnect error", e);
  }

  return NextResponse.redirect(`${destino}?r=desconectado`);
}
