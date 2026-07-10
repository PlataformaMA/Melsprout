import "server-only";

// Resuelve la URL base del sitio de forma robusta para los redirect_uri de OAuth.
// Si NEXT_PUBLIC_SITE_URL quedó mal configurada en "localhost" pero corremos en
// un host real (producción), usa el host real (origin) para que el redirect_uri
// que se manda a Instagram/TikTok/YouTube no se rompa.
export function siteBase(origin: string): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const originReal = !!origin && !origin.includes("localhost");
  if (env && !(env.includes("localhost") && originReal)) return env;
  return (origin || "http://localhost:3000").replace(/\/$/, "");
}
