import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Feed .ics público y SUSCRIBIBLE (webcal) con las próximas clases en vivo.
// Al suscribirse (Apple/Google), el calendario se actualiza solo cuando se
// agregan nuevas clases. No expone datos sensibles (solo el horario público).
export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string): string {
  return (s || "").replace(/[\r\n]+/g, " ").replace(/([,;\\])/g, "\\$1");
}

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("clases_vivo")
    .select("id, titulo, inicia_at, duracion_min, instructor, stream_url")
    .order("inicia_at", { ascending: true });

  const now = Date.now();
  const clases = (data || []).filter(
    (c) => new Date(c.inicia_at as string).getTime() + ((c.duracion_min as number) || 60) * 60000 > now
  );

  const eventos = clases
    .map((c) => {
      const s = new Date(c.inicia_at as string);
      const e = new Date(s.getTime() + ((c.duracion_min as number) || 60) * 60000);
      return [
        "BEGIN:VEVENT",
        `UID:${c.id}@melsprout`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(s)}`,
        `DTEND:${fmt(e)}`,
        `SUMMARY:${esc((c.titulo as string) || "Clase en vivo")}`,
        `DESCRIPTION:${esc("Clase en vivo de Melsprout" + (c.instructor ? " con " + c.instructor : ""))}`,
        c.stream_url ? `URL:${esc(c.stream_url as string)}` : "",
        "BEGIN:VALARM",
        "TRIGGER:-PT60M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Tu clase en vivo empieza pronto",
        "END:VALARM",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Melsprout//Clases en vivo//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Melsprout · Clases en vivo",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    eventos,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=melsprout-clases.ics",
      "Cache-Control": "public, max-age=300",
    },
  });
}
