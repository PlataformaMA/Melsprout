import "server-only";

// Remitente de los correos. Si la variable trae solo la dirección
// (hola@boostacademy.io), el correo llegaba con "hola" como nombre; se le
// antepone el nombre de la plataforma.
export function remitenteCorreo(): string | null {
  const v = process.env.CORREO_REMITENTE?.trim();
  if (!v) return null;
  return v.includes("<") ? v : `Melsprout <${v}>`;
}
