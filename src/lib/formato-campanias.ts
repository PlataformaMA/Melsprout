// Cómo se escriben fechas y montos en las pantallas de campañas.
//
// No es "use server": son funciones puras que corren en el navegador. Las
// fechas se formatean AQUÍ y no en el servidor porque el servidor vive en UTC
// y una entrega de las 7 de la noche salía con la fecha del día siguiente.

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-10-20" → "20 oct 2026". Una fecha sin hora NO se pasa por Date():
// Date la lee como medianoche UTC y en México se corre un día hacia atrás.
export function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return "—";
  const solo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (solo) {
    const [, a, m, d] = solo;
    return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
  }
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) return "—";
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

// "2026-10-20T14:05:00Z" → "17 oct 2026, 10:24 a.m."
export function fechaYHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) return "—";
  const hora = f.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}, ${hora}`;
}

export function dinero(monto: number | null | undefined, moneda = "MXN"): string {
  if (monto == null) return "A convenir";
  return `$${monto.toLocaleString("en-US")} ${moneda}`;
}

export function pesoArchivo(bytes: number | null | undefined): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
