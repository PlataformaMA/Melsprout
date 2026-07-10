import "server-only";

// Resuelve la URL base del sitio para los redirect_uri de OAuth.
// PRIORIZA el host real de la petición (el dominio donde entró el usuario), así
// el redirect_uri siempre apunta a ese dominio (melsprout.boostacademy.io) sin
// depender de NEXT_PUBLIC_SITE_URL (que puede estar mal configurada).
export function siteBase(origin: string): string {
  const originClean = origin?.replace(/\/$/, "");
  if (originClean && !originClean.includes("localhost")) return originClean;
  // En local usamos la variable si existe (útil para túneles/ngrok).
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return env || originClean || "http://localhost:3000";
}
