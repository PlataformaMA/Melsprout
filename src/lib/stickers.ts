// Catálogo CERRADO de stickers. El chat solo acepta estas claves, así que nadie
// puede mandar texto propio — por eso no hace falta moderar ni reportar.
export type Sticker = {
  clave: string;
  titulo: string;
  cuerpo: string;
  emoji: string;
};

export const STICKERS: Sticker[] = [
  { clave: "felicidades", titulo: "¡Felicidades!", cuerpo: "Lo estás logrando", emoji: "🎉" },
  { clave: "sigue-asi", titulo: "¡Sigue así!", cuerpo: "Vas por un gran camino", emoji: "💜" },
  { clave: "vamos-por-mas", titulo: "¡Vamos por más!", cuerpo: "Esto apenas empieza", emoji: "✨" },
  { clave: "increible", titulo: "¡Increíble!", cuerpo: "Qué avance", emoji: "🏆" },
  { clave: "tu-puedes", titulo: "¡Tú puedes!", cuerpo: "Confío en ti", emoji: "💪" },
  { clave: "gracias", titulo: "¡Gracias!", cuerpo: "Me animaste", emoji: "🙌" },
  { clave: "a-darle", titulo: "¡A darle!", cuerpo: "Sin freno", emoji: "🚀" },
  { clave: "que-racha", titulo: "¡Qué racha!", cuerpo: "No la sueltes", emoji: "🔥" },
  { clave: "bienvenida", titulo: "¡Qué gusto verte!", cuerpo: "Bienvenida o bienvenido por aquí", emoji: "👋" },
  { clave: "no-te-detengas", titulo: "¡No te detengas!", cuerpo: "Tú puedes lograr cualquier cosa", emoji: "⭐" },
];

const MAPA = new Map(STICKERS.map((s) => [s.clave, s]));

export function stickerDe(clave: string): Sticker | null {
  return MAPA.get(clave) ?? null;
}

export function esStickerValido(clave: string): boolean {
  return MAPA.has(clave);
}
