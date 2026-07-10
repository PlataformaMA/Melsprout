import "server-only";
import { siteBase } from "@/lib/site-url";

// Integración con "Instagram API con Instagram Login" (cuentas profesionales).
// Requiere INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET (solo servidor).

const IG_APP_ID = process.env.INSTAGRAM_APP_ID || "";
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "";
export const INSTAGRAM_CONFIGURADO = !!IG_APP_ID && !!IG_APP_SECRET;

function redirectUri(origin: string): string {
  return `${siteBase(origin)}/api/instagram/callback`;
}

export function buildAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: IG_APP_ID,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "instagram_business_basic",
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
