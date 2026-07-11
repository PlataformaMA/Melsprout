import "server-only";

// Integración con Phyllo (agregador de datos de creadores).
// Requiere PHYLLO_CLIENT_ID, PHYLLO_CLIENT_SECRET y PHYLLO_ENV (solo servidor).

const CLIENT_ID = process.env.PHYLLO_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PHYLLO_CLIENT_SECRET || "";
export const PHYLLO_ENV = (process.env.PHYLLO_ENV || "sandbox").toLowerCase();
export const PHYLLO_CONFIGURADO = !!CLIENT_ID && !!CLIENT_SECRET;

const BASE_URLS: Record<string, string> = {
  sandbox: "https://api.sandbox.getphyllo.com",
  staging: "https://api.staging.getphyllo.com",
  production: "https://api.getphyllo.com",
};
export function phylloBaseUrl(): string {
  return BASE_URLS[PHYLLO_ENV] || BASE_URLS.sandbox;
}

function authHeader(): string {
  const b64 = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  return `Basic ${b64}`;
}

async function phylloFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(`${phylloBaseUrl()}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    if (!r.ok) {
      // Log server-side para depurar en sandbox.
      console.error("Phyllo error", r.status, path, await r.text().catch(() => ""));
      return null;
    }
    return (await r.json()) as T;
  } catch (e) {
    console.error("Phyllo fetch fail", path, e);
    return null;
  }
}

// Crea (o reusa por external_id) un usuario en Phyllo.
export async function crearUsuario(name: string, externalId: string) {
  return phylloFetch<{ id: string; name: string; external_id: string }>("/v1/users", {
    method: "POST",
    body: JSON.stringify({ name: name.slice(0, 50) || "Creador", external_id: externalId }),
  });
}

// Busca un usuario ya creado por su external_id (para no duplicar).
export async function buscarUsuarioPorExternalId(externalId: string) {
  const r = await phylloFetch<{ data: { id: string; external_id: string }[] }>(
    `/v1/users?external_id=${encodeURIComponent(externalId)}&limit=1`
  );
  return r?.data?.[0] ?? null;
}

// Genera un token para inicializar el Connect SDK.
export async function crearSdkToken(phylloUserId: string) {
  return phylloFetch<{ sdk_token: string; expires_at: string }>("/v1/sdk-tokens", {
    method: "POST",
    body: JSON.stringify({
      user_id: phylloUserId,
      products: ["IDENTITY", "ENGAGEMENT", "IDENTITY.AUDIENCE"],
    }),
  });
}

// Cuentas conectadas por el usuario.
export type PhylloAccount = {
  id: string;
  user_id: string;
  status: string;
  username?: string;
  work_platform?: { id: string; name?: string; logo_url?: string };
};
export async function obtenerCuentas(phylloUserId: string) {
  const r = await phylloFetch<{ data: PhylloAccount[] }>(
    `/v1/accounts?user_id=${encodeURIComponent(phylloUserId)}&limit=50`
  );
  return r?.data ?? [];
}

// Perfil de cada cuenta (seguidores, etc.).
export type PhylloProfile = {
  account?: { id: string };
  work_platform?: { name?: string };
  platform_username?: string;
  reputation?: {
    follower_count?: number;
    subscriber_count?: number;
    following_count?: number;
    content_count?: number;
  };
};
export async function obtenerPerfiles(phylloUserId: string) {
  const r = await phylloFetch<{ data: PhylloProfile[] }>(
    `/v1/profiles?user_id=${encodeURIComponent(phylloUserId)}&limit=50`
  );
  return r?.data ?? [];
}

// Mapea el nombre de la plataforma de Phyllo a nuestras llaves.
export function llaveDePlataforma(nombre?: string): "instagram" | "tiktok" | "youtube" | null {
  const n = (nombre || "").toLowerCase();
  if (n.includes("instagram")) return "instagram";
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("youtube")) return "youtube";
  return null;
}
