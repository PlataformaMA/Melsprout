import "server-only";
import crypto from "node:crypto";
import { siteBase } from "@/lib/site-url";
import type { Audiencia, Reparto } from "@/lib/insightiq";

// Integración con "Instagram API con Instagram Login" (cuentas profesionales).
// Requiere INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET (solo servidor).

const IG_APP_ID = process.env.INSTAGRAM_APP_ID || "";
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "";
export const INSTAGRAM_CONFIGURADO = !!IG_APP_ID && !!IG_APP_SECRET;

function redirectUri(origin: string): string {
  return `${siteBase(origin)}/api/instagram/callback`;
}

// Permiso mínimo (siempre aprobado) y el de estadísticas, que es el que
// da seguidores, alcance y audiencia. Si Meta todavía no aprobó el segundo,
// el callback reintenta solo con el básico: la persona no ve ningún error.
export const SCOPE_BASICO = "instagram_business_basic";
export const SCOPE_COMPLETO = "instagram_business_basic,instagram_business_manage_insights";

export function buildAuthUrl(origin: string, state: string, scope = SCOPE_COMPLETO): string {
  const p = new URLSearchParams({
    client_id: IG_APP_ID,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope,
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${p.toString()}`;
}

export async function exchangeCode(origin: string, code: string) {
  const body = new URLSearchParams({
    client_id: IG_APP_ID,
    client_secret: IG_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(origin),
    code,
  });
  const r = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });
  if (!r.ok) return null;
  return (await r.json()) as { access_token: string; user_id: number };
}

export async function longLived(shortToken: string) {
  const p = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: IG_APP_SECRET,
    access_token: shortToken,
  });
  const r = await fetch(`https://graph.instagram.com/access_token?${p.toString()}`);
  if (!r.ok) return null;
  return (await r.json()) as { access_token: string; expires_in: number };
}

// ————————————— Estadísticas (instagram_business_manage_insights) —————————————

async function insights(
  token: string,
  params: Record<string, string>
): Promise<unknown | null> {
  const p = new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(`https://graph.instagram.com/me/insights?${p}`);
  if (!r.ok) {
    // Instagram niega la demografía a cuentas con menos de 100 seguidores.
    // No es un fallo nuestro: seguimos sin ese dato.
    console.warn("Instagram insights", params.metric, r.status);
    return null;
  }
  return r.json();
}

// Alcance del último día. Devuelve null si la cuenta aún no tiene datos.
export async function fetchAlcance(token: string): Promise<number | null> {
  const j = (await insights(token, { metric: "reach", period: "day" })) as {
    data?: { values?: { value?: number }[] }[];
  } | null;
  const v = j?.data?.[0]?.values?.at(-1)?.value;
  return typeof v === "number" ? v : null;
}

type Desglose = {
  data?: {
    total_value?: {
      breakdowns?: {
        results?: { dimension_values?: string[]; value?: number }[];
      }[];
    };
  }[];
};

// Instagram devuelve conteos absolutos; el perfil pinta porcentajes.
function aReparto(j: Desglose | null, traducir?: Record<string, string>): Reparto {
  const res = j?.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
  const total = res.reduce((s, r) => s + (r.value ?? 0), 0);
  if (!total) return [];
  return res
    .filter((r) => typeof r.value === "number")
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 6)
    .map((r) => {
      const clave = r.dimension_values?.[0] ?? "—";
      return {
        k: traducir?.[clave] ?? clave,
        pct: Math.round(((r.value ?? 0) / total) * 1000) / 10,
      };
    });
}

const GENERO_ES: Record<string, string> = {
  M: "Hombres",
  F: "Mujeres",
  U: "No especifica",
};

// Demografía de seguidores, en el mismo formato que ya usa el perfil.
export async function fetchAudiencia(token: string): Promise<Audiencia | null> {
  const base = {
    metric: "follower_demographics",
    period: "lifetime",
    metric_type: "total_value",
  };
  const [paises, ciudades, edad, genero] = await Promise.all([
    insights(token, { ...base, breakdown: "country" }),
    insights(token, { ...base, breakdown: "city" }),
    insights(token, { ...base, breakdown: "age" }),
    insights(token, { ...base, breakdown: "gender" }),
  ]) as [Desglose | null, Desglose | null, Desglose | null, Desglose | null];

  const a: Audiencia = {
    paises: aReparto(paises),
    ciudades: aReparto(ciudades),
    edad: aReparto(edad),
    genero: aReparto(genero, GENERO_ES),
  };
  const vacia =
    !a.paises.length && !a.ciudades.length && !a.edad.length && !a.genero.length;
  return vacia ? null : a;
}

// Meta firma sus avisos (cancelar autorización / eliminar datos) con un
// `signed_request` = "firma.contenido", ambos en base64url. La firma es un
// HMAC-SHA256 del contenido hecho con el App Secret: si no cuadra, no es Meta.
function base64Url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function verificarSignedRequest(
  signed: string
): { user_id?: string } | null {
  const [firma, contenido] = signed.split(".");
  if (!firma || !contenido || !IG_APP_SECRET) return null;

  const esperada = crypto
    .createHmac("sha256", IG_APP_SECRET)
    .update(contenido)
    .digest();
  const recibida = base64Url(firma);
  if (
    esperada.length !== recibida.length ||
    !crypto.timingSafeEqual(esperada, recibida)
  ) {
    return null;
  }

  try {
    return JSON.parse(base64Url(contenido).toString("utf8"));
  } catch {
    return null;
  }
}

export async function fetchProfile(token: string) {
  const p = new URLSearchParams({
    fields: "user_id,username,followers_count,media_count",
    access_token: token,
  });
  const r = await fetch(`https://graph.instagram.com/me?${p.toString()}`);
  if (!r.ok) return null;
  return (await r.json()) as {
    user_id: string;
    username: string;
    followers_count?: number;
    media_count?: number;
  };
}
