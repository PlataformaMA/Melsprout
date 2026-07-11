import { NextResponse } from "next/server";
import { PHYLLO_ENV, phylloBaseUrl } from "@/lib/phyllo";

// Diagnóstico TEMPORAL: confirma qué entorno/credenciales usa producción.
// No expone secretos (solo longitudes y el status del test). Se elimina después.
export async function GET() {
  const id = process.env.PHYLLO_CLIENT_ID || "";
  const secret = process.env.PHYLLO_CLIENT_SECRET || "";
  const base = phylloBaseUrl();
  let testStatus = 0;
  let errType = "";
  try {
    const auth = "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
    const r = await fetch(`${base}/v1/users?limit=1`, {
      headers: { Authorization: auth, Accept: "application/json" },
      cache: "no-store",
    });
    testStatus = r.status;
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: { error_code?: string } };
      errType = j?.error?.error_code || "";
    }
  } catch {
    errType = "fetch_fail";
  }
  return NextResponse.json({
    envRaw: process.env.PHYLLO_ENV ?? null,
    envResuelto: PHYLLO_ENV,
    base,
    idLen: id.length,
    secretLen: secret.length,
    testStatus,
    errType,
  });
}
