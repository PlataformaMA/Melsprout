"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Campañas, Empresas y Solicitudes son el mismo trabajo visto en tres
// momentos: lo que se va a publicar, quién lo publica y qué está esperando
// respuesta. Antes eran tres entradas sueltas del menú y había que acordarse
// de pasar por las tres; aquí se ven una al lado de la otra.

const TABS = [
  { href: "/app/admin/marketplace/campanias", texto: "Campañas" },
  { href: "/app/admin/marketplace/marcas", texto: "Empresas" },
  { href: "/app/admin/marketplace/solicitudes", texto: "Solicitudes" },
];

export function MktTabsCampanias({ pendientes = 0 }: { pendientes?: number }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 mt-4 flex-wrap">
      {TABS.map((t) => {
        const activo = pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition ${
              activo ? "bg-accent-soft text-accent" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
            {t.texto}
            {t.texto === "Solicitudes" && pendientes > 0 && (
              <span className="bg-accent text-white text-[11px] font-extrabold rounded-full px-1.5 min-w-[18px] text-center">
                {pendientes}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
