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
  { id: "Belleza", emoji: "💄", desc: "Maquillaje, skincare, cuidado", color: "accent" },
  { id: "Salud y Bienestar", emoji: "🥗", desc: "Nutrición, hábitos, bienestar", color: "green" },
  { id: "Fitness y Deporte", emoji: "🏋️", desc: "Ejercicio, deportes, rutinas", color: "amber" },
  { id: "Lifestyle", emoji: "✨", desc: "Vida diaria, rutinas, hogar", color: "amber" },
  { id: "Gastronomía", emoji: "🍳", desc: "Cocina, recetas, comida", color: "pink" },
  { id: "Viajes", emoji: "✈️", desc: "Destinos, tips, aventuras", color: "blue" },
  { id: "Tecnología", emoji: "💻", desc: "Apps, gadgets, IA", color: "blue" },
  { id: "Gaming", emoji: "🎮", desc: "Videojuegos, streaming", color: "accent" },
  { id: "Negocios y Emprendimiento", emoji: "💼", desc: "Emprender, ventas, marca", color: "accent" },
  { id: "Marketing", emoji: "📈", desc: "Redes, contenido, growth", color: "accent" },
  { id: "Finanzas", emoji: "💰", desc: "Dinero, ahorro, inversión", color: "green" },
  { id: "Educación", emoji: "📚", desc: "Enseñar, cursos, tutoriales", color: "blue" },
  { id: "Desarrollo Personal", emoji: "🌱", desc: "Hábitos, mindset, motivación", color: "green" },
  { id: "Arte y Diseño", emoji: "🎨", desc: "Ilustración, diseño, creatividad", color: "pink" },
  { id: "Música", emoji: "🎵", desc: "Música, covers, producción", color: "accent" },
  { id: "Entretenimiento", emoji: "🎬", desc: "Humor, cine, cultura pop", color: "amber" },
  { id: "Familia y Maternidad", emoji: "👶", desc: "Crianza, familia, hogar", color: "pink" },
  { id: "Otro", emoji: "➕", desc: "Cuéntanos tu nicho", color: "accent" },
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

// Bandera emoji por país (para el encabezado del perfil).
export const PAIS_FLAG: Record<string, string> = {
  "México": "🇲🇽", "Colombia": "🇨🇴", "Argentina": "🇦🇷", "Perú": "🇵🇪",
  "Chile": "🇨🇱", "Ecuador": "🇪🇨", "Guatemala": "🇬🇹", "Venezuela": "🇻🇪",
  "España": "🇪🇸", "Estados Unidos": "🇺🇸", "República Dominicana": "🇩🇴",
  "Bolivia": "🇧🇴", "Honduras": "🇭🇳", "Paraguay": "🇵🇾", "El Salvador": "🇸🇻",
  "Nicaragua": "🇳🇮", "Costa Rica": "🇨🇷", "Panamá": "🇵🇦", "Uruguay": "🇺🇾",
  "Puerto Rico": "🇵🇷",
};
export function banderaPais(pais: string | null): string {
  return (pais && PAIS_FLAG[pais]) || "🌎";
}

// Código ISO por país → para imágenes de bandera reales (con escudo).
export const ISO_PAIS: Record<string, string> = {
  "México": "mx", "Colombia": "co", "Argentina": "ar", "Perú": "pe", "Chile": "cl",
  "Ecuador": "ec", "Guatemala": "gt", "Venezuela": "ve", "España": "es",
  "Estados Unidos": "us", "República Dominicana": "do", "Bolivia": "bo",
  "Honduras": "hn", "Paraguay": "py", "El Salvador": "sv", "Nicaragua": "ni",
  "Costa Rica": "cr", "Panamá": "pa", "Uruguay": "uy", "Puerto Rico": "pr",
};
export function banderaUrl(pais: string | null): string | null {
  const c = pais ? ISO_PAIS[pais] : null;
  return c ? `https://flagcdn.com/w80/${c}.png` : null;
}

export function emojiNicho(nicho: string | null): string {
  return NICHOS.find((n) => n.id === nicho)?.emoji ?? "🎯";
}
export function emojiObjetivo(o: string | null): string {
  return OBJETIVOS.find((x) => x.id === o)?.emoji ?? "🎯";
}
export function emojiPlataforma(p: string | null): string {
  return PLATAFORMAS.find((x) => x.id === p)?.emoji ?? "🌐";
}
