// ===== Datos del producto Melsprout (Fase 1) — del Briefing Maestro v1.0 =====
// Esto vivirá en Supabase más adelante; por ahora es la fuente local para el demo.

export type EstadoClase = "completada" | "en-progreso" | "disponible" | "bloqueada";

export type Clase = {
  id: string; // "1.1"
  titulo: string;
  instructor: string;
  duracionMin: number;
  reto: string;
  revision: "auto" | "equipo";
  grabada: boolean;
};

export type ModuloCurso = {
  id: number;
  nombre: string;
  descripcion: string;
  color: "green" | "accent" | "amber";
  clases: Clase[];
};

// Etapa 1 · Starter "Crea" — 3 módulos, 10 clases (Módulo 04 del briefing)
export const ETAPA_1: ModuloCurso[] = [
  {
    id: 1,
    nombre: "Fundamentos",
    descripcion: "Lo esencial para empezar tu camino.",
    color: "green",
    clases: [
      { id: "1.1", titulo: "Mindset del creador", instructor: "Melissa", duracionMin: 12, reto: "Escribe tu “porqué” y tu meta de 90 días; publícalo en la comunidad", revision: "auto", grabada: true },
      { id: "1.2", titulo: "Encuentra tu nicho", instructor: "Melissa", duracionMin: 14, reto: "Define tu nicho y subnicho y escríbelos en la plataforma", revision: "auto", grabada: false },
      { id: "1.3", titulo: "Optimiza tu perfil", instructor: "Alexia", duracionMin: 10, reto: "Deja bio + foto + nombre optimizados en tu red; sube la captura", revision: "equipo", grabada: true },
    ],
  },
  {
    id: 2,
    nombre: "Creación de contenido",
    descripcion: "Contenido que conecta y genera impacto.",
    color: "accent",
    clases: [
      { id: "2.1", titulo: "Ideas que conectan", instructor: "Melissa", duracionMin: 13, reto: "Crea tu banco de 10 ideas con la técnica de la clase", revision: "auto", grabada: true },
      { id: "2.2", titulo: "Guiones y estructuras", instructor: "Melissa", duracionMin: 16, reto: "Desarma 3 videos virales: gancho, estructura y llamado a la acción", revision: "equipo", grabada: true },
      { id: "2.3", titulo: "Grabación de alto impacto", instructor: "George", duracionMin: 15, reto: "Graba un clip de 15–30s aplicando encuadre, luz y audio", revision: "equipo", grabada: true },
      { id: "2.4", titulo: "Edición que atrapa", instructor: "Uriel", duracionMin: 18, reto: "Edita ese clip: cortes, subtítulos y música", revision: "equipo", grabada: true },
    ],
  },
  {
    id: 3,
    nombre: "Crecimiento",
    descripcion: "Audiencia y marca personal.",
    color: "amber",
    clases: [
      { id: "3.1", titulo: "Estrategia de redes", instructor: "Alexia", duracionMin: 14, reto: "Publica tu primer video con la estructura completa (el reto estrella)", revision: "equipo", grabada: true },
      { id: "3.2", titulo: "Analiza y mejora", instructor: "Alexia", duracionMin: 12, reto: "Revisa las métricas de tu video y escribe 3 aprendizajes", revision: "equipo", grabada: false },
      { id: "3.3", titulo: "Colaboraciones y networking", instructor: "Melissa", duracionMin: 11, reto: "Interactúa con 3 creadores de tu nicho dentro de la comunidad", revision: "auto", grabada: false },
    ],
  },
];

export const CATEGORIAS_FORO = ["General", "Marketing de contenido", "Redes sociales", "Branding personal", "YouTube", "TikTok", "Foto y video"];

export const NICHOS = ["Moda", "Salud", "Belleza", "Tech", "Lifestyle"] as const;
export const OBJETIVOS = ["Empezar desde cero", "Crecer mi audiencia", "Monetizar"] as const;
export const PLATAFORMAS = ["Instagram", "TikTok", "YouTube"] as const;
export const AUDIENCIAS = ["0–500", "500–5K", "5K–50K", "50K+"] as const;

// Los 10 niveles de XP (Módulo 08)
export const NIVELES_XP = [
  { nivel: 1, nombre: "Recién llegado", xp: 0 },
  { nivel: 2, nombre: "Explorador", xp: 100 },
  { nivel: 3, nombre: "Aprendiz", xp: 300 },
  { nivel: 4, nombre: "Creador en crecimiento", xp: 600 },
  { nivel: 5, nombre: "Creador constante", xp: 1000 },
  { nivel: 6, nombre: "Creador imparable", xp: 1500 },
  { nivel: 7, nombre: "Creador influyente", xp: 2500 },
  { nivel: 8, nombre: "Referente", xp: 4000 },
  { nivel: 9, nombre: "Mentor de la comunidad", xp: 6500 },
  { nivel: 10, nombre: "Leyenda Melsprout", xp: 10000 },
];

export function nivelPorXP(xp: number) {
  let actual = NIVELES_XP[0];
  for (const n of NIVELES_XP) if (xp >= n.xp) actual = n;
  const siguiente = NIVELES_XP.find((n) => n.xp > xp);
  return { actual, siguiente, faltan: siguiente ? siguiente.xp - xp : 0 };
}

export const TOTAL_CLASES = ETAPA_1.reduce((n, m) => n + m.clases.length, 0);
