import "server-only";

// InsightIQ (corre sobre la infraestructura de Phyllo): conexión de cuentas de
// creador CON CONSENTIMIENTO y lectura de métricas (seguidores, etc.).
// Auth = Basic base64(client_id:client_secret).

const CLIENT_ID = process.env.INSIGHTIQ_CLIENT_ID || "";
const CLIENT_SECRET = process.env.INSIGHTIQ_CLIENT_SECRET || "";
const ENV = (process.env.INSIGHTIQ_ENV || "staging").toLowerCase();

export const INSIGHTIQ_CONFIGURADO = !!CLIENT_ID && !!CLIENT_SECRET;

// La API de InsightIQ y el entorno que usa el SDK web (Phyllo Connect).
const API_BASE: Record<string, string> = {
  sandbox: "https://api.sandbox.insightiq.ai",
  staging: "https://api.staging.insightiq.ai",
  production: "https://api.insightiq.ai",
};
export function insightiqApiBase(): string {
  return API_BASE[ENV] || API_BASE.staging;
}
// Nombre de entorno que espera el SDK de conexión web.
export function insightiqEnv(): string {
  return ENV === "production" ? "production" : ENV; // staging | sandbox | production
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
}

async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T | null> {
  try {
    const r = await fetch(`${insightiqApiBase()}${path}`, {
      method: init?.method || "GET",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if (!r.ok) {
      console.error("InsightIQ", path, r.status, await r.text().catch(() => ""));
      return null;
    }
    return (await r.json()) as T;
  } catch (e) {
    console.error("InsightIQ fetch error", path, e);
    return null;
  }
}

// ————————————— Mapeo de plataformas —————————————
// IDs de work_platform en InsightIQ ↔ nuestras claves de red.
export const WORK_PLATFORM: Record<string, string> = {
  instagram: "9bb8913b-ddd9-430b-a66a-d74d846e6c66",
  tiktok: "de55aeec-0dc8-4119-bf90-16b3d1f0c987",
  youtube: "14d9ddf5-51c6-415e-bde6-f8ed36ad7054",
  facebook: "ad2fec62-2987-40a0-89fb-23485972598c",
};
const PLATFORM_A_PROVIDER: Record<string, string> = Object.fromEntries(
  Object.entries(WORK_PLATFORM).map(([k, v]) => [v, k])
);
export function providerDeWorkPlatform(id: string): string | null {
  return PLATFORM_A_PROVIDER[id] || null;
}

// ————————————— Usuarios / tokens —————————————
type IqUser = { id: string; name: string; external_id: string };

// Crea (o recupera) el usuario de InsightIQ para un usuario de Melsprout.
// external_id = id de Supabase, para que sea idempotente.
export async function crearUsuario(
  externalId: string,
  name: string
): Promise<string | null> {
  // Intentar crear.
  const creado = await api<IqUser>("/v1/users", {
    method: "POST",
    body: { name: name || externalId, external_id: externalId },
  });
  if (creado?.id) return creado.id;
  // Si ya existe, recuperarlo por external_id.
  const lista = await api<{ data: IqUser[] }>(
    `/v1/users?external_id=${encodeURIComponent(externalId)}`
  );
  return lista?.data?.[0]?.id ?? null;
}

// Cuentas conectadas (id de cuenta + red) para poder desconectarlas.
type IqAccount = { id: string; work_platform?: { id?: string }; status?: string };
export async function obtenerCuentas(
  userId: string
): Promise<{ accountId: string; provider: string }[]> {
  const r = await api<{ data: IqAccount[] }>(
    `/v1/accounts?user_id=${encodeURIComponent(userId)}&limit=50`
  );
  const out: { accountId: string; provider: string }[] = [];
  for (const a of r?.data ?? []) {
    const provider = providerDeWorkPlatform(a.work_platform?.id || "");
    if (provider && a.id) out.push({ accountId: a.id, provider });
  }
  return out;
}

// Desconecta una cuenta en InsightIQ (deja de sincronizar/leer sus datos).
export async function desconectarCuenta(accountId: string): Promise<boolean> {
  const r = await api<unknown>(`/v1/accounts/${accountId}/disconnect`, {
    method: "POST",
  });
  return r !== null;
}

export async function crearSdkToken(userId: string): Promise<string | null> {
  const r = await api<{ sdk_token: string }>("/v1/sdk-tokens", {
    method: "POST",
    body: {
      user_id: userId,
      // IDENTITY.AUDIENCE + ENGAGEMENT.AUDIENCE habilitan la demografía de audiencia.
      products: [
        "IDENTITY",
        "IDENTITY.AUDIENCE",
        "ENGAGEMENT",
        "ENGAGEMENT.AUDIENCE",
      ],
    },
  });
  return r?.sdk_token ?? null;
}

// ————————————— Cuentas conectadas + métricas —————————————
export type MetricaRed = {
  provider: string;
  username: string | null;
  url: string | null;
  image: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  likes: number | null;
};

type IqReputation = {
  follower_count?: number | null;
  following_count?: number | null;
  subscriber_count?: number | null;
  content_count?: number | null;
  like_count?: number | null;
};
type IqProfile = {
  work_platform?: { id?: string };
  platform_username?: string | null;
  username?: string | null;
  url?: string | null;
  image_url?: string | null;
  reputation?: IqReputation | null;
};

function num(v: number | null | undefined): number | null {
  return typeof v === "number" ? v : null;
}

// Lee los perfiles conectados del usuario y devuelve métricas reales por red.
export async function obtenerMetricas(userId: string): Promise<MetricaRed[]> {
  const r = await api<{ data: IqProfile[] }>(
    `/v1/profiles?user_id=${encodeURIComponent(userId)}&limit=50`
  );
  const data = r?.data ?? [];
  const out: MetricaRed[] = [];
  for (const p of data) {
    const pid = p.work_platform?.id || "";
    const provider = providerDeWorkPlatform(pid);
    if (!provider) continue;
    const rep = p.reputation || {};
    // YouTube usa subscriber_count; el resto follower_count.
    const followers = num(rep.follower_count) ?? num(rep.subscriber_count);
    out.push({
      provider,
      username: p.platform_username || p.username || null,
      url: p.url || null,
      image: p.image_url || null,
      followers,
      following: num(rep.following_count),
      posts: num(rep.content_count),
      likes: num(rep.like_count),
    });
  }
  return out;
}
