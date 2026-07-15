import { NextResponse } from "next/server";
import { ADMIN_EMAILS } from "@/lib/admin";

// Diagnóstico SEGURO: no expone secretos, solo config de admin y marcador de build.
export async function GET() {
  return NextResponse.json({
    build: "admin-v2-isadmin", // marcador para confirmar que el deploy está vivo
    adminEmailsCount: ADMIN_EMAILS.length,
    incluyeSveidyBoost: ADMIN_EMAILS.includes("sveidy@boostacademy.io"),
    // primeras letras de cada correo admin (para ubicar sin exponer)
    pistas: ADMIN_EMAILS.map((e) => e.slice(0, 4) + "…@" + (e.split("@")[1] || "")),
  });
}
