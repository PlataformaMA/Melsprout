import { NextResponse } from "next/server";

// Diagnóstico SEGURO: solo dice si las variables están presentes (nunca su valor).
export async function GET() {
  return NextResponse.json({
    configured:
      !!process.env.INSIGHTIQ_CLIENT_ID && !!process.env.INSIGHTIQ_CLIENT_SECRET,
    env: process.env.INSIGHTIQ_ENV || null,
    client_id_len: (process.env.INSIGHTIQ_CLIENT_ID || "").length,
    secret_len: (process.env.INSIGHTIQ_CLIENT_SECRET || "").length,
  });
}
