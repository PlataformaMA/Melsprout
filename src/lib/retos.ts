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
  octi?: string; // mensaje de Octi guiando este paso
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
  revisa?: "sola" | "equipo"; // 'sola' = auto-publica; 'equipo' = revisión 48h
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
      { id: "porque", titulo: "Escribe tu “porqué”", subtitulo: "¿Qué te motiva a crear contenido? ¿Qué impacto quieres generar?", tipo: "textarea", placeholder: "Escribe aquí tu porqué...", max: 500, octi: "¡Hola! Empecemos por lo más importante: tu porqué. Escríbelo desde el corazón, sin filtros. 💜" },
      { id: "meta", titulo: "Define tu meta de 90 días", subtitulo: "Sé específico. ¿Qué quieres lograr en los próximos 90 días?", tipo: "textarea", placeholder: "Escribe aquí tu meta de 90 días...", max: 500, octi: "¡Genial! Ahora tu meta. Que sea concreta y medible, así sabrás cuándo la lograste. 🎯" },
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
      { id: "nicho", titulo: "Define tu nicho", subtitulo: "¿Sobre qué tema principal crearás contenido?", tipo: "textarea", placeholder: "Escribe aquí tu nicho...", max: 80, octi: "Piensa en ese tema del que podrías hablar horas. Ese es tu nicho. 🌱" },
      { id: "subnicho", titulo: "Define tu subnicho", subtitulo: "Sé más específico. ¿A quién ayudas y con qué enfoque único?", tipo: "textarea", placeholder: "Escribe aquí tu subnicho...", max: 120, octi: "Ahora afínalo: ¿a quién ayudas exactamente? Mientras más claro, mejor. ✨" },
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
      { id: "nombre", titulo: "Optimiza tu nombre", subtitulo: "Usa tu nombre real o un nombre que sea fácil de recordar y represente tu marca personal.", tipo: "texto", placeholder: "Melissa Arria | Marketing para Creadores", max: 60, octi: "Tu nombre es lo primero que ven. Que sea claro y fácil de recordar. 😊" },
      { id: "bio", titulo: "Optimiza tu bio", subtitulo: "Explica qué haces, a quién ayudas y qué resultados generas.", tipo: "textarea", placeholder: "Escribe aquí tu bio...", max: 180, octi: "En tu bio di qué haces y a quién ayudas. ¡Corta y poderosa! 💪" },
      { id: "captura", titulo: "Sube la captura de tu perfil optimizado", subtitulo: "Comparte la captura de tu bio + foto + nombre optimizados en tu red.", tipo: "archivo", acepta: "image/png,image/jpeg", ayudaArchivo: "PNG o JPG · Máx. 3 MB", archivoImagen: true, octi: "Sube la captura de tu perfil ya optimizado. ¡Vas increíble! 📸" },
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
      { id: "plan", titulo: "Planifica tu clip", subtitulo: "¿Qué vas a comunicar y a quién va dirigido tu mensaje?", tipo: "textarea", placeholder: "Escribe aquí tu idea principal...", max: 120, octi: "Antes de grabar, ten claro tu mensaje. Un buen plan = un gran clip. 🎬" },
      { id: "video", titulo: "Graba tu clip (15-30s)", subtitulo: "Aplica encuadre, buena luz y audio claro. Sé auténtico y directo.", tipo: "archivo", acepta: "video/mp4,video/quicktime", ayudaArchivo: "Formatos: MP4, MOV · Máx. 200 MB · Duración: 15–30s", archivoImagen: false, octi: "¡A grabar! Buena luz, audio claro y tú al centro. Tú puedes. ✨" },
      { id: "desc", titulo: "Agrega una descripción corta", subtitulo: "Cuéntanos de qué trata tu clip y qué aprendizaje aplicaste.", tipo: "textarea", placeholder: "Describe brevemente tu clip y lo que aprendiste...", max: 150, octi: "Cuéntanos de qué trata y qué aprendiste. ¡Ya casi terminas! 🙌" },
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
  "2.1": {
    claseId: "2.1",
    modulo: "Ideas que conectan",
    titulo: "Crea tu banco de 10 ideas",
    emoji: "💡",
    descripcion: "Nunca más te quedes sin qué publicar: arma tu banco de ideas con la técnica de la clase.",
    intro: "Este reto te ayudará a tener ideas listas para crear contenido sin bloqueos.",
    accion: "publicarlo",
    revisa: "sola",
    xp: 50,
    pasos: [
      { id: "tema", titulo: "Elige tu tema base", subtitulo: "¿Sobre qué tema/nicho generarás tus ideas?", tipo: "texto", placeholder: "Ej. Marketing para emprendedoras", max: 80, octi: "Empieza por tu tema. De ahí saldrán todas tus ideas. 🌱" },
      { id: "ideas", titulo: "Escribe tus 10 ideas", subtitulo: "Aplica la técnica de la clase. Una idea por línea (dolores, preguntas frecuentes, tips…).", tipo: "textarea", placeholder: "1. ...\n2. ...\n3. ...", max: 700, octi: "¡A soltar ideas! No las juzgues, solo escríbelas. Luego eliges las mejores. ✨" },
    ],
    tips: { titulo: "Tips para buenas ideas:", items: ["Responde dudas reales de tu audiencia", "Habla de errores comunes", "Comparte tips rápidos", "Cuenta tu experiencia"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [
        { titulo: "Mi tema 💜", texto: "Finanzas personales para jóvenes." },
        { titulo: "Mis 10 ideas 💡", texto: "1. Errores al ahorrar. 2. Apps que uso. 3. Cómo hacer un presupuesto…" },
      ],
    },
    consejo: "Un banco de ideas es tu seguro contra el bloqueo. Aliméntalo cada semana. 💜",
  },
  "2.2": {
    claseId: "2.2",
    modulo: "Guiones y estructuras",
    titulo: "Desarma 3 videos virales",
    emoji: "🧩",
    descripcion: "Aprende de lo que ya funciona: analiza gancho, estructura y llamado a la acción de 3 videos.",
    intro: "Este reto entrena tu ojo para detectar por qué un video engancha y cómo replicarlo.",
    accion: "publicarlo",
    revisa: "equipo",
    xp: 50,
    pasos: [
      { id: "videos", titulo: "Desarma 3 videos virales", subtitulo: "Por cada uno, escribe: el gancho (primeros 3s), la estructura y el llamado a la acción.", tipo: "textarea", placeholder: "Video 1 — Gancho: ... Estructura: ... CTA: ...\nVideo 2 — ...\nVideo 3 — ...", max: 800, octi: "Analiza como detective: ¿qué te hizo quedarte? Eso es el gancho. 🔍" },
      { id: "aprendizaje", titulo: "¿Qué vas a aplicar?", subtitulo: "De lo que analizaste, ¿qué usarás en tu próximo video?", tipo: "textarea", placeholder: "Escribe aquí tu aprendizaje...", max: 300, octi: "Quédate con lo que SÍ puedes aplicar tú. ¡Eso vale oro! ✨" },
    ],
    tips: { titulo: "Qué observar:", items: ["Los primeros 3 segundos", "Cómo mantienen la atención", "El cierre / CTA", "Ritmo y edición"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [{ titulo: "Mi análisis 🧩", texto: "Video 1 — Gancho: pregunta directa. Estructura: problema-solución. CTA: 'guárdalo'." }],
    },
    consejo: "Lo que admiras, analízalo. Ahí está la fórmula que tú también puedes usar. 💜",
  },
  "2.4": {
    claseId: "2.4",
    modulo: "Edición que atrapa",
    titulo: "Edita tu clip: cortes, subtítulos y música",
    emoji: "✂️",
    descripcion: "La edición es lo que mantiene a la gente viendo. Edita tu clip y súbelo.",
    intro: "Este reto te ayudará a darle ritmo y claridad a tu contenido con una buena edición.",
    accion: "compartirlo",
    revisa: "equipo",
    xp: 50,
    pasos: [
      { id: "video", titulo: "Sube tu clip editado", subtitulo: "Aplica cortes que den ritmo, subtítulos legibles y música que acompañe.", tipo: "archivo", acepta: "video/mp4,video/quicktime", ayudaArchivo: "Formatos: MP4, MOV · Máx. 200 MB", archivoImagen: false, octi: "¡Muéstranos tu edición! Cortes al punto, subtítulos claros y música con vibra. 🎬" },
      { id: "detalle", titulo: "¿Qué editaste?", subtitulo: "Cuéntanos qué cortes, subtítulos y música aplicaste y por qué.", tipo: "textarea", placeholder: "Describe tu edición...", max: 250, octi: "Cuéntanos tus decisiones de edición. ¡Se aprende explicándolo! 🙌" },
    ],
    tips: { titulo: "Tips de edición:", items: ["Corta las pausas muertas", "Subtítulos siempre (80% ve sin audio)", "Música que acompañe, no que tape", "Ritmo dinámico al inicio"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [{ titulo: "Mi edición ✂️", texto: "Cortes rápidos al inicio, subtítulos amarillos y una pista trend. ¡Quedó con ritmo!", video: true }],
    },
    consejo: "La buena edición no se nota, se siente. Mantén el ritmo y respeta la atención de tu audiencia. 💜",
  },
  "3.1": {
    claseId: "3.1",
    modulo: "Estrategia de redes",
    titulo: "Publica tu primer video con la estructura completa",
    emoji: "🚀",
    descripcion: "El reto estrella: aplica TODO lo aprendido y publica tu video en tus redes.",
    intro: "Este es el momento de brillar: junta idea, guion, grabación y edición en una publicación real.",
    accion: "compartir tu enlace",
    revisa: "equipo",
    xp: 50,
    pasos: [
      { id: "enlace", titulo: "Pega el enlace de tu video publicado", subtitulo: "Debe estar publicado en tu red (Instagram, TikTok o YouTube).", tipo: "texto", placeholder: "https://...", max: 200, octi: "¡Lo lograste! Pega aquí el link de tu video ya publicado. 🚀" },
      { id: "estructura", titulo: "¿Qué estructura usaste?", subtitulo: "Cuéntanos tu gancho, el desarrollo y el llamado a la acción.", tipo: "textarea", placeholder: "Gancho: ... Desarrollo: ... CTA: ...", max: 400, octi: "Explica tu estructura. Así reforzamos lo que aprendiste. 💪" },
    ],
    tips: { titulo: "Antes de publicar:", items: ["Gancho fuerte en los 3s", "Aporta valor claro", "Cierra con un CTA", "Buen texto/caption y hashtags"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [{ titulo: "Mi primer video 🚀", texto: "Apliqué gancho de pregunta, 3 tips y CTA de 'sígueme'. ¡Mi mejor video hasta ahora!" }],
    },
    consejo: "Publicar da miedo, pero es donde todo cobra sentido. Hecho es mejor que perfecto. ¡Vas con todo! 💜",
  },
  "3.2": {
    claseId: "3.2",
    modulo: "Analiza y mejora",
    titulo: "Revisa tus métricas y escribe 3 aprendizajes",
    emoji: "📊",
    descripcion: "Los números te dicen qué funciona. Analízalos y saca conclusiones para mejorar.",
    intro: "Este reto te ayudará a tomar decisiones con datos, no con suposiciones.",
    accion: "publicarlo",
    revisa: "equipo",
    xp: 50,
    pasos: [
      { id: "metricas", titulo: "Anota tus métricas", subtitulo: "Retención, alcance, likes, guardados, compartidos… lo que veas en tu video.", tipo: "textarea", placeholder: "Alcance: ... Retención: ... Guardados: ...", max: 300, octi: "Abre tus estadísticas y anota los números clave. ¡Sin miedo! 📊" },
      { id: "aprendizajes", titulo: "Escribe 3 aprendizajes", subtitulo: "¿Qué funcionó, qué no, y qué harás distinto la próxima vez?", tipo: "textarea", placeholder: "1. ...\n2. ...\n3. ...", max: 400, octi: "3 aprendizajes concretos. Eso es crecer como creador. 🌱" },
    ],
    tips: { titulo: "Qué mirar:", items: ["Retención (¿dónde se van?)", "Guardados y compartidos", "Comentarios", "De dónde llegó el alcance"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [{ titulo: "Mis aprendizajes 📊", texto: "1. El gancho retuvo más. 2. Faltó CTA. 3. Publicar de noche funcionó mejor." }],
    },
    consejo: "Lo que se mide, se mejora. Cada video es un experimento que te acerca a tu audiencia. 💜",
  },
  "3.3": {
    claseId: "3.3",
    modulo: "Colaboraciones y networking",
    titulo: "Interactúa con 3 creadores de tu nicho",
    emoji: "🤝",
    descripcion: "Tu red es tu red de apoyo. Conecta genuinamente con 3 creadores de tu nicho.",
    intro: "Este reto te ayudará a construir relaciones que abren puertas y colaboraciones.",
    accion: "publicarlo",
    revisa: "sola",
    xp: 50,
    pasos: [
      { id: "creadores", titulo: "¿Con quién interactuaste?", subtitulo: "Menciona a los 3 creadores y qué hiciste (comentario de valor, mensaje, colaboración…).", tipo: "textarea", placeholder: "1. @creador — comenté... 2. @otra — le escribí...", max: 400, octi: "Interactúa de verdad: aporta valor, no solo un '🔥'. Se nota. 🤝" },
      { id: "aprendizaje", titulo: "¿Qué te llevas?", subtitulo: "¿Qué aprendiste o qué oportunidad surgió al conectar?", tipo: "textarea", placeholder: "Escribe aquí...", max: 250, octi: "Networking real = relaciones reales. ¿Qué puerta se abrió? ✨" },
    ],
    tips: { titulo: "Cómo conectar bien:", items: ["Comenta con valor, no genérico", "Comparte su contenido", "Ofrece antes de pedir", "Sé genuino y constante"] },
    sobre: SOBRE_DEFAULT,
    ejemplo: {
      autor: "Valentina L.", rol: "Creadora de contenido", tituloCard: "Mira otras publicaciones",
      bloques: [{ titulo: "Mis conexiones 🤝", texto: "Comenté con aporte en 3 cuentas de mi nicho y una me respondió para colaborar. 🙌" }],
    },
    consejo: "Nadie crece solo. Rodéate de creadores que sumen y devuelve el apoyo. 💜",
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
