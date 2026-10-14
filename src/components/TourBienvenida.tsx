"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav-items";

// Recorrido guiado de bienvenida.
//
// No es una tarjeta al centro: es un globo pegado a cada sección del menú, y el
// fondo va cambiando a la pantalla de la que habla, para que se vea de qué
// está hablando. Sale una sola vez y se puede volver a ver desde el menú de la
// cuenta ("Ver el recorrido").
//
// En celular el menú lateral no existe (hay un drawer), así que ahí el mismo
// texto se muestra como tarjeta abajo, sin flecha a ningún lado.

type Paso = {
  // A qué entrada del menú se pega el globo (null = no se pega a ninguna).
  nav: string | null;
  ruta: string;
  titulo: string;
  texto: string;
};

const PASOS: Paso[] = [
  {
    nav: "clases",
    ruta: "/app/ruta",
    titulo: "Ruta de aprendizaje",
    texto: "Aquí encontrarás tus últimos cursos adquiridos.",
  },
  {
    nav: "especiales",
    ruta: "/app/especiales",
    titulo: "Cursos especiales",
    texto:
      "Aquí encontrarás los cursos adicionales que ofrece la plataforma y estarán desbloqueados los que hayas adquirido.",
  },
  {
    nav: "vivo",
    ruta: "/app/vivo",
    titulo: "Clases en vivo",
    texto:
      "Aquí encontrarás las clases en vivo programadas en el calendario y las grabaciones de clases pasadas.",
  },
  {
    nav: "comunidad",
    ruta: "/app/comunidad",
    titulo: "Comunidad",
    texto:
      "Aquí se publican dudas, presentaciones y avances. También están los grupos y los retos de la comunidad.",
  },
  {
    nav: "amigos",
    ruta: "/app/amigos",
    titulo: "Amigos",
    texto:
      "Aquí puedes buscar a otras creadoras, seguirlas y felicitarlas cuando logren algo.",
  },
  {
    nav: "perfil",
    ruta: "/app/perfil",
    titulo: "Mi perfil",
    texto:
      "Aquí completas tu información y conectas tus redes. Mientras más completo, más fácil es que las marcas te encuentren.",
  },
  {
    nav: null,
    ruta: "/app/ruta",
    titulo: "Tu racha y tus XP",
    texto:
      "Arriba a la derecha llevas tu racha 🔥 y tus XP 💎. Toca el diamante cuando quieras ver cuántos llevas y cómo conseguir más.",
  },
];

const HECHO = "melsprout_tour";
const PASO = "melsprout_tour_paso";
const ACTIVO = "melsprout_tour_activo";

function avisarAlMenu(activo: boolean) {
  try {
    if (activo) sessionStorage.setItem(ACTIVO, "1");
    else sessionStorage.removeItem(ACTIVO);
  } catch {}
  window.dispatchEvent(new CustomEvent("melsprout:tour", { detail: activo }));
}

export function TourBienvenida() {
  const router = useRouter();
  const pathname = usePathname();
  const [paso, setPaso] = useState<number | null>(null);
  // Dónde está la entrada del menú a la que se pega el globo.
  const [ancla, setAncla] = useState<{ top: number; left: number } | null>(null);

  // ¿Toca mostrarlo? Se decide en el navegador, no en el servidor.
  useEffect(() => {
    try {
      if (localStorage.getItem(HECHO)) return;
      const n = Number(localStorage.getItem(PASO) || "0");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaso(Number.isFinite(n) && n >= 0 && n < PASOS.length ? n : 0);
      avisarAlMenu(true);
    } catch {
      // Navegación privada: mejor no molestar.
    }
  }, []);

  // Si la pantalla no es la del paso, se va sola: el globo habla de lo que se
  // está viendo, no de algo que quedó dos clics atrás.
  useEffect(() => {
    if (paso === null) return;
    const destino = PASOS[paso].ruta;
    if (pathname !== destino) router.push(destino);
  }, [paso, pathname, router]);

  // Mide la entrada del menú para pegarle el globo al lado.
  const medir = useCallback(() => {
    if (paso === null) return;
    const nav = PASOS[paso].nav;
    if (!nav || window.innerWidth < 1024) { setAncla(null); return; }
    const el = document.querySelector<HTMLElement>(`[data-nav="${nav}"]`);
    if (!el) { setAncla(null); return; }
    const r = el.getBoundingClientRect();
    setAncla({ top: r.top + r.height / 2, left: r.right + 14 });
  }, [paso]);

  useEffect(() => {
    if (paso === null) return;
    // El menú tarda un instante en abrirse; se mide un par de veces.
    const t1 = setTimeout(medir, 60);
    const t2 = setTimeout(medir, 400);
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [paso, pathname, medir]);

  function guardar(n: number) {
    try { localStorage.setItem(PASO, String(n)); } catch {}
  }

  function siguiente() {
    if (paso === null) return;
    if (paso + 1 >= PASOS.length) return terminar();
    guardar(paso + 1);
    setPaso(paso + 1);
  }

  function terminar() {
    try {
      localStorage.setItem(HECHO, "1");
      localStorage.removeItem(PASO);
    } catch {}
    avisarAlMenu(false);
    setPaso(null);
  }

  if (paso === null) return null;
  const p = PASOS[paso];
  const cuenta = `${paso + 1}/${PASOS.length}`;

  const globo = (
    <div className="w-[280px] bg-surface rounded-2xl shadow-2xl border-2 border-accent p-4 pointer-events-auto relative">
      <span className="w-9 h-9 rounded-xl bg-accent-soft text-accent grid place-items-center mb-2">
        {NAV_ITEMS.find((i) => i.id === p.nav)?.icon ?? <span className="text-[16px]">💎</span>}
      </span>
      <h3 className="font-display font-extrabold text-[14px] leading-tight">{p.titulo}</h3>
      <p className="text-[12.5px] text-sub leading-snug mt-1">{p.texto}</p>
      <div className="flex items-center justify-between gap-3 mt-3">
        <button type="button" onClick={siguiente}
          className="bg-accent text-white font-bold text-[13px] rounded-lg px-4 py-2 hover:brightness-110 active:scale-95 transition">
          Entendido
        </button>
        <span className="text-[12px] font-bold text-hint">{cuenta}</span>
      </div>
      <button type="button" onClick={terminar}
        className="absolute -top-7 right-0 text-[11.5px] font-bold text-white drop-shadow hover:opacity-80 transition">
        Saltar recorrido
      </button>
    </div>
  );

  return (
    // El fondo se oscurece pero deja ver la pantalla de la que habla el globo.
    <div className="fixed inset-0 z-[140] bg-black/25 pointer-events-auto" onClick={terminar}>
      <div
        className="absolute"
        onClick={(e) => e.stopPropagation()}
        style={
          ancla
            ? { top: ancla.top, left: ancla.left, transform: "translateY(-50%)" }
            : { left: "50%", bottom: 24, transform: "translateX(-50%)" }
        }
      >
        <div className="relative">
          {/* Piquito hacia el menú, solo cuando está pegado a una sección. */}
          {ancla && (
            <span className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-surface border-l-2 border-b-2 border-accent" />
          )}
          {globo}
        </div>
      </div>
    </div>
  );
}
