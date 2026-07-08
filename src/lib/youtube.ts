import "server-only";

// YouTube: OAuth de Google + YouTube Data API v3 (subscriberCount).
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "";
export const YOUTUBE_CONFIGURADO = !!CLIENT_ID && !!CLIENT_SECRET;

function redirectUri(origin: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  return `${base}/api/youtube/callback`;
}

export function buildAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export async function exchangeCode(origin: string, code: string) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(origin),
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) return null;
  return (await r.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export async function fetchChannel(token: string) {
  const r = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) return null;
  const j = (await r.json()) as {
    items?: {
      id: string;
      snippet?: { title?: string; customUrl?: string };
      statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
    }[];
  };
  const it = j.items?.[0];
  if (!it) return null;
  const subs = it.statistics?.subscriberCount
    ? Number(it.statistics.subscriberCount)
    : null;
  return {
    id: it.id,
    title: it.snippet?.customUrl || it.snippet?.title || "canal",
    followers: subs,
  };
}
