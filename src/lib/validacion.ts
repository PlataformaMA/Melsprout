// Reglas de validación compartidas (cliente y servidor).
// La misma lógica corre en el navegador (feedback instantáneo) y en el
// servidor (seguridad real: nunca confíes solo en el navegador).

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type FuerzaPassword = {
  puntaje: 0 | 1 | 2 | 3 | 4; // 0 muy débil … 4 excelente
  etiqueta: string;
  cumpleMinimo: boolean; // requisito duro para poder registrarse
  faltantes: string[];
};

// Requisitos: mínimo 8 caracteres, con mayúscula, minúscula y número.
export function evaluarPassword(password: string): FuerzaPassword {
  const faltantes: string[] = [];
  if (password.length < 8) faltantes.push("mínimo 8 caracteres");
  if (!/[a-z]/.test(password)) faltantes.push("una minúscula");
  if (!/[A-Z]/.test(password)) faltantes.push("una mayúscula");
  if (!/[0-9]/.test(password)) faltantes.push("un número");

  let bruto = 0;
  if (password.length >= 8) bruto++;
  if (password.length >= 12) bruto++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) bruto++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) bruto++;
  const puntaje = Math.min(bruto, 4) as 0 | 1 | 2 | 3 | 4;

  const cumpleMinimo =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

  const etiquetas = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"];

  return {
    puntaje,
    etiqueta: etiquetas[puntaje],
    cumpleMinimo,
    faltantes,
  };
}

// Traduce los mensajes de error de Supabase a español amable.
export function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed"))
    return "Aún no confirmas tu correo. Revisa tu bandeja de entrada.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Ya existe una cuenta con este correo. Intenta iniciar sesión.";
  if (m.includes("password should be at least"))
    return "La contraseña es demasiado corta.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  if (m.includes("email rate limit"))
    return "Enviamos demasiados correos. Espera un momento.";
  return "Algo salió mal. Inténtalo de nuevo en un momento.";
}
