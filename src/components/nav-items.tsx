// Menú de la app en UN solo lugar: lo usan la barra lateral (desktop) y el
// drawer ☰ (móvil). Antes estaban duplicados y el móvil se quedó atrás —
// le faltaba Amigos y usaba emojis en vez de los mismos iconos.
export type NavItem = { id: string; label: string; href: string; icon: React.ReactNode };

export const NAV_ITEMS: NavItem[] = [
  { id: "clases", label: "Ruta de aprendizaje", href: "/app/ruta", icon: <MapIcon /> },
  { id: "especiales", label: "Cursos Especiales", href: "/app/especiales", icon: <ClaquetaIcon /> },
  { id: "vivo", label: "Clases en vivo", href: "/app/vivo", icon: <LiveIcon /> },
  { id: "comunidad", label: "Comunidad", href: "/app/comunidad", icon: <PeopleIcon /> },
  { id: "amigos", label: "Amigos", href: "/app/amigos", icon: <ChatIcon /> },
  { id: "perfil", label: "Mi perfil", href: "/app/perfil", icon: <UserIcon /> },
];

const ICO = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function MapIcon() { return <svg {...ICO}><path d="M9 4.5 3.7 6.4v13.1l5.3-1.9 6 1.9 5.3-1.9V4.5l-5.3 1.9-6-1.9z" /><path d="M9 4.5v13.1M15 6.4v13.1" /></svg>; }
export function LiveIcon() { return <svg {...ICO}><circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4" /><path d="M5.2 5.2a10 10 0 0 0 0 13.6" /><path d="M18.8 5.2a10 10 0 0 1 0 13.6" /></svg>; }
// Comunidad: grupo de personas con una estrellita (icono nuevo).
export function PeopleIcon() {
  return (
    <svg {...ICO}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19.5a6 6 0 0 1 12 0" />
      <circle cx="17.5" cy="9.5" r="2.2" />
      <path d="M16.5 15.5a5 5 0 0 1 4.5 4" />
    </svg>
  );
}
// Cursos especiales: claqueta con estrella.
export function ClaquetaIcon() {
  return (
    <svg {...ICO}>
      <path d="M3.5 8.5h17v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M4 8.5 6.4 4l3.4 4.5M10.8 8.5 13.2 4l3.4 4.5" />
      <path d="m12 12.2.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L9.1 14.4l2-.3z" />
    </svg>
  );
}
export function UserIcon() { return <svg {...ICO}><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>; }
export function ChatIcon() {
  return (
    <svg {...ICO}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
