// Catálogo de retos de Melsprout. Cada reto está ligado a una clase (data.ts)
// y define sus pasos (texto/textarea/archivo), tips, ejemplo y consejo.
import { ETAPA_1 } from "@/lib/data";

export type PasoTipo = "texto" | "textarea" | "archivo";
export type PasoReto = {
  id: string;
  titulo: string;
  subtitulo?: string;
  tipo: PasoTipo;
  placeholder?: string;
  max?: number;
  acepta?: string;
  ayudaArchivo?: string;
  archivoImagen?: boolean; // true = imagen (se sube), false/undefined = video (por ahora solo nombre)
};
export type BloqueEjemplo = { titulo: string; texto: string; video?: boolean; imagen?: boolean };
export type RetoDef = {
  claseId: string;
  modulo: string;
  titulo: string;
  emoji: string;
  descripcion: string;
  intro: string;
  accion: string; // "publicarlo" | "compartirlo" | "compartir tu captura"
  xp: number;
  pasos: PasoReto[];
  tips: { titulo: string; items: string[] };
  sobre: string[];
  ejemplo: { autor: string; rol: string; tituloCard: string; bloques: BloqueEjemplo[] };
  consejo: string;
};

const SOBRE_DEFAULT = [
  "Comparte tu avance con la comunidad.",
  "Inspira a otros y recibe apoyo en tu camino.",
  "Revisa los comentarios y conecta con creadores como tú.",
];

const RETOS: Record<string, RetoDef> = {
  "1.1": {
    claseId: "1.1",
    modulo: "Mindset del creador",
    titulo: "Tu propósito y tu meta de 90 días",
    emoji: "🎯",
    descripcion: "Clarifica tu porqué y define una meta realista que te enfoque y te impulse cada día.",
    intro: "Este reto te ayudará a conectar con tu propósito como creador y a trazar un plan claro a 90 días.",
    accion: "publicarlo",
    xp: 50,
    pasos: [
      { id: "porque", titulo: "Escribe tu “porqué”", subtitulo: "¿Qué te motiva a crear contenido? ¿Qué impacto quieres generar?", tipo: "textarea", placeholder: "Escribe aquí tu porqué...", max: 500 },
      { id: "meta", titulo: "Define tu meta de 90 días", subtitulo: "Sé específico. ¿Qué quieres lograr en los próximos 90 días?", tipo: "textarea", placeholder: "Escribe aquí tu meta de 90 días...", max: 500 },
    ],
    tips: { titulo: "Tips para una buena meta:", items: ["Sé específico", "Debe ser medible", "Que sea alcanzable", "Tener un plazo definido"] },
    sobre: [
      "Comparte tu porqué y tu meta de 90 días con la comunidad.",
      "Inspira a otros y recibe apoyo en tu camino.",
      "Revisa los comentarios y conecta con creadores como tú.",
    ],
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Ejemplo de publicación",
      bloques: [
        { titulo: "Mi porqué 💜", texto: "Quiero inspirar a más personas a creer en ellas mismas y a usar su voz para generar cambios positivos." },
        { titulo: "Mi meta de 90 días 🎯", texto: "Publicar 60 videos en TikTok, alcanzar 10,000 seguidores y lanzar mi primer producto digital." },
      ],
    },
    consejo: "Tu porqué es tu brújula. Tu meta es tu mapa. La acción diaria es lo que te llevará allí. 💜",
  },
  "1.2": {
    claseId: "1.2",
    modulo: "Encuentra tu nicho",
    titulo: "Define tu nicho y subnicho",
    emoji: "🎯",
    descripcion: "Clarifica tu enfoque para crear contenido relevante y atraer a tu audiencia ideal.",
    intro: "Este reto te ayudará a enfocar tu contenido y destacar en tu mercado.",
    accion: "publicarlo",
    xp: 50,
    pasos: [
      { id: "nicho", titulo: "Define tu nicho", subtitulo: "¿Sobre qué tema principal crearás contenido?", tipo: "textarea", placeholder: "Escribe aquí tu nicho...", max: 80 },
      { id: "subnicho", titulo: "Define tu subnicho", subtitulo: "Sé más específico. ¿A quién ayudas y con qué enfoque único?", tipo: "textarea", placeholder: "Escribe aquí tu subnicho...", max: 120 },
    ],
    tips: { titulo: "Tips para definir tu nicho y subnicho:", items: ["Alineado a tus pasiones", "Resuelve un problema", "Tiene audiencia", "Puedes aportar valor único"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [
        { titulo: "Mi nicho 💜", texto: "Marketing digital y estrategia de contenido para marcas personales." },
        { titulo: "Mi subnicho 🎯", texto: "Ayudo a emprendedoras a crecer en redes sociales creando contenido auténtico y con propósito." },
      ],
    },
    consejo: "Tu nicho es tu dirección. Tu subnicho es tu diferenciador. La claridad atrae a tu audiencia ideal. 💜",
  },
  "1.3": {
    claseId: "1.3",
    modulo: "Optimiza tu perfil",
    titulo: "Deja bio + foto + nombre optimizados en tu red",
    emoji: "🎯",
    descripcion: "Tu perfil es tu carta de presentación. Optimízalo para que conecte y genere confianza.",
    intro: "Este reto te ayudará a mejorar tu presencia y atraer a tu audiencia ideal.",
    accion: "compartir tu captura",
    xp: 50,
    pasos: [
      { id: "nombre", titulo: "Optimiza tu nombre", subtitulo: "Usa tu nombre real o un nombre que sea fácil de recordar y represente tu marca personal.", tipo: "texto", placeholder: "Melissa Arria | Marketing para Creadores", max: 60 },
      { id: "bio", titulo: "Optimiza tu bio", subtitulo: "Explica qué haces, a quién ayudas y qué resultados generas.", tipo: "textarea", placeholder: "Escribe aquí tu bio...", max: 180 },
      { id: "captura", titulo: "Sube la captura de tu perfil optimizado", subtitulo: "Comparte la captura de tu bio + foto + nombre optimizados en tu red.", tipo: "archivo", acepta: "image/png,image/jpeg", ayudaArchivo: "PNG o JPG · Máx. 3 MB", archivoImagen: true },
    ],
    tips: { titulo: "Tips para un perfil optimizado:", items: ["Foto clara y profesional", "Nombre fácil de recordar", "Bio que comunique valor", "Enlace relevante"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [
        { titulo: "Mi nombre 💜", texto: "Valentina L. | Creadora de Contenido" },
        { titulo: "Mi bio ✨", texto: "Ayudo a marcas personales a crecer en redes sociales con contenido estratégico y auténtico." },
        { titulo: "Mi captura 🖼️", texto: "", imagen: true },
      ],
    },
    consejo: "Tu perfil es tu escaparate digital. Haz que tu nombre, bio y foto hablen por ti y por tu marca. 💜",
  },
  "2.3": {
    claseId: "2.3",
    modulo: "Grabación de alto impacto",
    titulo: "Graba un clip de 15–30s aplicando encuadre, luz y audio",
    emoji: "🎬",
    descripcion: "Pon en práctica los fundamentos para crear contenido visual y auditivo de calidad.",
    intro: "Este reto te ayudará a mejorar la calidad de tu contenido y conectar con tu audiencia.",
    accion: "compartirlo",
    xp: 50,
    pasos: [
      { id: "plan", titulo: "Planifica tu clip", subtitulo: "¿Qué vas a comunicar y a quién va dirigido tu mensaje?", tipo: "textarea", placeholder: "Escribe aquí tu idea principal...", max: 120 },
      { id: "video", titulo: "Graba tu clip (15-30s)", subtitulo: "Aplica encuadre, buena luz y audio claro. Sé auténtico y directo.", tipo: "archivo", acepta: "video/mp4,video/quicktime", ayudaArchivo: "Formatos: MP4, MOV · Máx. 200 MB · Duración: 15–30s", archivoImagen: false },
      { id: "desc", titulo: "Agrega una descripción corta", subtitulo: "Cuéntanos de qué trata tu clip y qué aprendizaje aplicaste.", tipo: "textarea", placeholder: "Describe brevemente tu clip y lo que aprendiste...", max: 150 },
    ],
    tips: { titulo: "Tips para un gran clip:", items: ["Encuadre a nivel de ojos", "Luz frontal o natural", "Audio limpio y sin ruido", "Mensaje claro y directo"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [
        { titulo: "Mi clip 🎬", texto: "Aplicando encuadre, luz y audio para conectar mejor con mi audiencia. 🎬✨", video: true },
      ],
    },
    consejo: "La calidad no depende del equipo, sino de cómo aplicas lo básico. Encuadre, luz y audio cambian todo. ¡Tú puedes! 💜",
  },
};

// Genera un reto genérico (una descripción + captura) para clases sin reto detallado.
function retoGenerico(claseId: string): RetoDef | null {
  for (const m of ETAPA_1) {
    const c = m.clases.find((x) => x.id === claseId);
    if (c) {
      return {
        claseId,
        modulo: c.titulo,
        titulo: c.reto,
        emoji: "🎯",
        descripcion: "Aplica lo aprendido en la clase y compártelo con la comunidad.",
        intro: "Completa este reto para poner en práctica lo que viste y ganar XP.",
        accion: "compartirlo",
        xp: 50,
        pasos: [
          { id: "respuesta", titulo: "Tu respuesta al reto", subtitulo: c.reto, tipo: "textarea", placeholder: "Escribe aquí tu respuesta...", max: 500 },
        ],
        tips: { titulo: "Tips:", items: ["Sé claro", "Aplica lo de la clase", "Comparte con la comunidad"] },
        sobre: SOBRE_DEFAULT,
        ejemplo: { autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones", bloques: [{ titulo: "Mi respuesta 💜", texto: "Apliqué lo aprendido y compartí mi avance con la comunidad." }] },
        consejo: "La constancia es lo que te llevará lejos. Un reto a la vez. 💜",
      };
    }
  }
  return null;
}

export function getReto(claseId: string): RetoDef | null {
  return RETOS[claseId] || retoGenerico(claseId);
}

// Lista de todos los retos (para el índice /app/retos).
export function listaRetos(): { claseId: string; modulo: string; titulo: string; emoji: string; xp: number }[] {
  const out: { claseId: string; modulo: string; titulo: string; emoji: string; xp: number }[] = [];
  for (const m of ETAPA_1) {
    for (const c of m.clases) {
      const r = getReto(c.id);
      if (r) out.push({ claseId: c.id, modulo: r.modulo, titulo: r.titulo, emoji: r.emoji, xp: r.xp });
    }
  }
  return out;
}
