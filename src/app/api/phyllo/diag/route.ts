import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearUsuario, crearSdkToken } from "@/lib/phyllo";

// Diagnóstico TEMPORAL: mide cuánto tarda cada paso del servidor (para hallar el que se cuelga).
export async function GET() {
  const steps: Record<string, string> = {};

  let admin;
  const a0 = Date.now();
  try {
    admin = createAdminClient();
    steps.adminClient = `OK ${Date.now() - a0}ms`;
  } catch (e) {
    return NextResponse.json({ ...steps, fail: "adminClient", err: String(e) });
  }

  const b0 = Date.now();
  try {
    const sel = await admin
      .from("social_connections")
      .select("external_id")
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .eq("provider", "phyllo")
      .maybeSingle();
    steps.dbSelect = `${sel.error ? "ERR " + sel.error.message : "OK"} ${Date.now() - b0}ms`;
  } catch (e) {
    steps.dbSelect = `THROW ${String(e)} ${Date.now() - b0}ms`;
  }

  const c0 = Date.now();
  const u = await crearUsuario("Diag", "diag2-" + Date.now());
  steps.crearUsuario = `${u?.id ? "OK" : "null"} ${Date.now() - c0}ms`;

  if (u?.id) {
    const d0 = Date.now();
    const tok = await crearSdkToken(u.id);
    steps.sdkToken = `${tok?.sdk_token ? "OK" : "null"} ${Date.now() - d0}ms`;
  }

  return NextResponse.json(steps);
}
