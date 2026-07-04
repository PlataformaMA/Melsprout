// Catálogos compartidos (onboarding y perfil).

export const PAISES = [
  "México", "Colombia", "Argentina", "Perú", "Chile", "Ecuador",
  "Guatemala", "Venezuela", "España", "Estados Unidos", "República Dominicana",
  "Bolivia", "Honduras", "Paraguay", "El Salvador", "Nicaragua",
  "Costa Rica", "Panamá", "Uruguay", "Puerto Rico", "Otro",
];

export type ColorNicho = "pink" | "green" | "accent" | "blue" | "amber";
export const NICHOS: {
  id: string;
  emoji: string;
  desc: string;
  color: ColorNicho;
}[] = [
  { id: "Moda", emoji: "👗", desc: "Estilo, outfits, tendencias", color: "pink" },
  { id: "Salud", emoji: "🥗", desc: "Bienestar, fitness, nutrición", color: "green" },
  { id: "Belleza", emoji: "💄", desc: "Maquillaje, skincare, cuidado", color: "accent" },
  { id: "Tech", emoji: "💻", desc: "Tecnología, apps, gadgets", color: "blue" },
  { id: "Lifestyle", emoji: "✨", desc: "Vida diaria, viajes, rutinas", color: "amber" },
];

export const OBJETIVOS = [
  { id: "Empezar desde cero", emoji: "🌱" },
  { id: "Crecer mi audiencia", emoji: "📈" },
  { id: "Monetizar", emoji: "💰" },
];

export const PLATAFORMAS = [
  { id: "Instagram", emoji: "📸" },
  { id: "TikTok", emoji: "🎵" },
  { id: "YouTube", emoji: "▶️" },
];

export const AUDIENCIAS = ["0–500", "500–5K", "5K–50K", "50K+"];

export function emojiNicho(nicho: string | null): string {
  return NICHOS.find((n) => n.id === nicho)?.emoji ?? "🎯";
}
export function emojiObjetivo(o: string | null): string {
  return OBJETIVOS.find((x) => x.id === o)?.emoji ?? "🎯";
}
export function emojiPlataforma(p: string | null): string {
  return PLATAFORMAS.find((x) => x.id === p)?.emoji ?? "🌐";
}
