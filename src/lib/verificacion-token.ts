import { createHmac, timingSafeEqual } from "node:crypto";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";

// Secreto para firmar los enlaces de verificación. Usa VERIFICACION_SECRET si
// existe; si no, la service key (siempre presente en el servidor).
const SECRET = process.env.VERIFICACION_SECRET || SUPABASE_SERVICE_ROLE_KEY || "melsprout-dev-secret";

// Crea un token firmado: base64url(userId.exp).firma  (válido `horas` horas).
export function crearTokenVerificacion(userId: string, horas = 24): string {
  const exp = Math.floor(Date.now() / 1000) + horas * 3600;
  const payload = `${userId}.${exp}`;
  const firma = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${firma}`;
}

// Valida el token: firma correcta y no expirado. Devuelve el userId o null.
export function validarTokenVerificacion(token: string): { userId: string } | null {
  try {
    const [payloadB64, firma] = token.split(".");
    if (!payloadB64 || !firma) return null;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const [userId, expStr] = payload.split(".");
    if (!userId || !expStr) return null;

    const esperada = createHmac("sha256", SECRET).update(payload).digest("base64url");
    const a = Buffer.from(firma);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
    return { userId };
  } catch {
    return null;
  }
}
