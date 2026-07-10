import "server-only";
import { siteBase } from "@/lib/site-url";

// TikTok Login Kit + Display API (follower_count).
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || "";
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";
export const TIKTOK_CONFIGURADO = !!CLIENT_KEY && !!CLIENT_SECRET;

function redirectUri(origin: string): string {
  return `${siteBase(origin)}/api/tiktok/callback`;
}

export function buildAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_key: CLIENT_KEY,
    response_type: "code",
    scope: "user.info.basic,user.info.stats",
    redirect_uri: redirectUri(origin),
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${p.toString()}`;
}

export async function exchangeCode(origin: string, code: string) {
  const body = new URLSearchParams({
    client_key: CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(origin),
  });
  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) return null;
  return (await r.json()) as {
    access_token: string;
    open_id: string;
    expires_in: number;
    refresh_token?: string;
  };
}

export async function fetchUser(token: string) {
  const r = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name,follower_count",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) return null;
  const j = (await r.json()) as {
    data?: {
      user?: {
        open_id?: string;
        username?: string;
        display_name?: string;
        follower_count?: number;
      };
    };
  };
  const u = j.data?.user;
  if (!u) return null;
  return {
    id: u.open_id ?? "",
    username: u.username || u.display_name || "tiktok",
    followers: typeof u.follower_count === "number" ? u.follower_count : null,
  };
}
