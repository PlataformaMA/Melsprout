// Menú de la app en UN solo lugar: lo usan la barra lateral (desktop) y el
// drawer ☰ (móvil). Antes estaban duplicados y el móvil se quedó atrás —
// le faltaba Amigos y usaba emojis en vez de los mismos iconos.
export type NavItem = { id: string; label: string; href: string; icon: React.ReactNode };

export const NAV_ITEMS: NavItem[] = [
  { id: "clases", label: "Ruta de aprendizaje", href: "/app/ruta", icon: <MapIcon /> },
  { id: "vivo", label: "Clases en vivo", href: "/app/vivo", icon: <LiveIcon /> },
  { id: "comunidad", label: "Comunidad", href: "/app/comunidad", icon: <PeopleIcon /> },
  { id: "amigos", label: "Amigos", href: "/app/amigos", icon: <ChatIcon /> },
  { id: "perfil", label: "Mi perfil", href: "/app/perfil", icon: <UserIcon /> },
];

const ICO = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function MapIcon() { return <svg {...ICO}><path d="M9 4.5 3.7 6.4v13.1l5.3-1.9 6 1.9 5.3-1.9V4.5l-5.3 1.9-6-1.9z" /><path d="M9 4.5v13.1M15 6.4v13.1" /></svg>; }
export function LiveIcon() { return <svg {...ICO}><circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4" /><path d="M5.2 5.2a10 10 0 0 0 0 13.6" /><path d="M18.8 5.2a10 10 0 0 1 0 13.6" /></svg>; }
export function PeopleIcon() { return <svg {...ICO}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" /><path d="M15.5 6a3 3 0 0 1 0 5.6M20.5 19.5a5.5 5.5 0 0 0-3.6-5.2" /></svg>; }
export function UserIcon() { return <svg {...ICO}><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>; }
export function ChatIcon() {
  return (
    <svg {...ICO}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
