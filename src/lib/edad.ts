// Melsprout es para mayores de edad. Vive fuera de los archivos "use server",
// que solo pueden exportar funciones asíncronas.
export const EDAD_MINIMA = 18;

export function cumpleEdadMinima(fecha: string): boolean {
  const n = new Date(fecha);
  if (Number.isNaN(n.getTime())) return false;
  const hoy = new Date();
  let años = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) años--;
  return años >= EDAD_MINIMA && años < 120;
}
