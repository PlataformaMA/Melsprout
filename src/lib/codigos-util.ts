import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Alfabeto sin caracteres confusos (nada de 0/O, 1/I/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Genera un código legible tipo "A7K2M-9QX4P" (10 caracteres, ~49 bits).
export function generarCodigo(): string {
  const bytes = randomBytes(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += ALFABETO[bytes[i] % ALFABETO.length];
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}

// Normaliza lo que escribe el usuario: mayúsculas y sin guiones/espacios.
export function normalizar(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Cifra un código con scrypt + sal aleatoria. Devuelve { salt, hash } en hex.
export function cifrarCodigo(codigoNormalizado: string): {
  salt: string;
  hash: string;
} {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(codigoNormalizado, salt, 32).toString("hex");
  return { salt, hash };
}

// Compara de forma segura (tiempo constante) un código contra un hash guardado.
export function coincide(
  codigoNormalizado: string,
  salt: string,
  hashGuardado: string
): boolean {
  const calculado = scryptSync(codigoNormalizado, salt, 32);
  const guardado = Buffer.from(hashGuardado, "hex");
  if (calculado.length !== guardado.length) return false;
  return timingSafeEqual(calculado, guardado);
}
