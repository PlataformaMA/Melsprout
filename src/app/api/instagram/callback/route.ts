import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCode,
  longLived,
  fetchProfile,
  fetchAlcance,
  fetchAudiencia,
} from "@/lib/instagram";
import { guardarConexion } from "@/lib/social-store";

// Lee el state: usuario | intento (f = completo, b = básico) | a dónde volver.
function leerState(raw: string | null) {
  const [, intento = "f", volver = "%2Fapp%2Fperfil"] = (raw || "").split("|");
  return { completo: intento === "f", volver: decodeURIComponent(volver) };
}

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const { completo, volver } = leerState(searchParams.get("state"));
  const destino = `${origin}${volver}`;
  const code = searchParams.get("code");

  if (searchParams.get("error") || !code) {
    // Si falló pidiendo estadísticas, lo intentamos con el permiso mínimo:
    // así la conexión se logra aunque Meta aún no apruebe las métricas.
    if (completo && searchParams.get("error") !== "access_denied") {
      return NextResponse.redirect(
        `${origin}/api/instagram/connect?basico=1&volver=${encodeURIComponent(volver)}`
      );
    }
    return NextResponse.redirect(`${destino}?r=instagram_err`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const short = await exchangeCode(origin, code);
  if (!short) return NextResponse.redirect(`${destino}?r=instagram_err`);
  const long = await longLived(short.access_token);
  const token = long?.access_token ?? short.access_token;
  const prof = await fetchProfile(token);
  if (!prof) return NextResponse.redirect(`${destino}?r=instagram_err`);

  // Estadísticas: si la cuenta es nueva o chica, Instagram las niega. No es
  // motivo para fallar la conexión, así que van aparte y pueden venir vacías.
  const [alcance, audiencia] = await Promise.all([
    fetchAlcance(token),
    fetchAudiencia(token),
  ]);

  await guardarConexion(user.id, "instagram", {
    externalId: String(prof.user_id),
    username: prof.username,
    followers: prof.followers_count ?? null,
    posts: prof.media_count ?? null,
    alcance,
    audiencia,
    accessToken: token,
    expiresAt: long ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null,
  });

  return NextResponse.redirect(`${destino}?r=instagram_ok`);
}
