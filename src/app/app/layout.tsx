// Layout de la app: agrega el espacio inferior para la barra de navegación móvil
// (la barra en sí la renderiza AppSidebar en cada página, para que siempre aparezca).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="pb-16 lg:pb-0">{children}</div>;
}
