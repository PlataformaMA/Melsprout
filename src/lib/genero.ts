// Cómo le habla Octi a cada quien. Se elige en el onboarding y solo afecta a
// los mensajes de la mascota — el resto de la plataforma sigue en neutro.
export type Genero = "femenino" | "masculino" | "neutro";

export function generoDe(v: unknown): Genero {
  return v === "femenino" || v === "masculino" ? v : "neutro";
}

// Elige entre las tres formas según el género. En neutro evitamos la marca de
// género en vez de inventar una forma rara ("creador/a"), que se lee mal.
export function seg(g: Genero, fem: string, masc: string, neutro: string): string {
  if (g === "femenino") return fem;
  if (g === "masculino") return masc;
  return neutro;
}

// Frases de Octi listas para usar.
export const octiFrases = (g: Genero, nombre: string) => {
  const primer = nombre.split(" ")[0] || "creador";
  return {
    bienvenida: seg(g,
      `¡Bienvenida, ${primer}! 👋`,
      `¡Bienvenido, ${primer}! 👋`,
      `¡Te damos la bienvenida, ${primer}! 👋`),
    animo: [
      `¡Tú puedes, ${primer}! 💪`,
      `Termínala y ganas +100 XP ⭐`,
      `Una clase al día 🚀🔥`,
      seg(g,
        `¡Vamos con todo, creadora! 🐙`,
        `¡Vamos con todo, creador! 🐙`,
        `¡Vamos con todo! 🐙`),
    ],
    listo: seg(g, "¿Lista para empezar?", "¿Listo para empezar?", "¿Empezamos?"),
    orgullo: seg(g,
      "Estoy orgulloso de ti, vas increíble.",
      "Estoy orgulloso de ti, vas increíble.",
      "Vas increíble, sigue así."),
  };
};
