"use client";

import { useState, useEffect } from "react";

// Recorrido guiado: qué es cada sección de Melsprout.
//
// Sale una sola vez, la primera vez que alguien entra a su Ruta, y se puede
// saltar en cualquier momento. Son tarjetas, no globos pegados a los botones:
// un globo anclado se descoloca en cuanto cambia el tamaño de la pantalla o la
// barra lateral se contrae, y acaba señalando el vacío.
//
// Se puede volver a ver desde el menú de la cuenta ("Ver el recorrido").

const PASOS: { icono: string; titulo: string; texto: string }[] = [
  {
    icono: "/octi.png",
    titulo: "Esta es tu ruta",
    texto:
      "El camino de abajo son tus clases, en orden. Cada clase se abre cuando terminas la anterior, y al final de cada mundo hay una puerta al siguiente.",
  },
  {
    icono: "/trofeo.png",
    titulo: "Gana XP y sube de nivel",
    texto:
      "Terminar una clase, entregar un reto o entrar a una clase en vivo te da puntos. Toca el 💎 de arriba cuando quieras ver cuántos llevas y cómo conseguir más.",
  },
  {
    icono: "/desafios/diana.png",
    titulo: "Los retos no se saltan",
    texto:
      "Después de cada clase hay un reto. Es lo que convierte lo que viste en algo tuyo, así que hay que entregarlo para seguir avanzando.",
  },
  {
    icono: "/octi.png",
    titulo: "Clases en vivo y cursos especiales",
    texto:
      "En el menú de la izquierda están las clases en vivo con invitados y los cursos especiales que vayas tomando. Ahí también quedan las grabaciones.",
  },
  {
    icono: "/octi.png",
    titulo: "No estás sola en esto",
    texto:
      "En Comunidad se publican dudas, avances y presentaciones. En Amigos puedes buscar a otras creadoras, seguirlas y felicitarlas cuando logren algo.",
  },
  {
    icono: "/cofre.png",
    titulo: "Completa tu perfil",
    texto:
      "Con tu foto, tu bio y tus redes conectadas sumas gemas y las marcas pueden encontrarte. Está en «Mi perfil», al final del menú.",
  },
];

const GUARDADO = "melsprout_tour";

export function TourBienvenida({ forzar = false, alCerrar }: { forzar?: boolean; alCerrar?: () => void }) {
  const [visible, setVisible] = useState(forzar);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (forzar) return;
    try {
      if (localStorage.getItem(GUARDADO)) return;
    } catch {
      return; // navegación privada: mejor no molestar
    }
    // Un respiro antes de aparecer: que primero vea su ruta.
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [forzar]);

  function cerrar() {
    try {
      localStorage.setItem(GUARDADO, "1");
    } catch {}
    setVisible(false);
    alCerrar?.();
  }

  if (!visible) return null;
  const p = PASOS[paso];
  const ultimo = paso === PASOS.length - 1;

  return (
    <div className="fixed inset-0 z-[150] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={cerrar} />
      <div className="relative w-full max-w-[400px] bg-surface rounded-[28px] shadow-2xl my-4 onb-slide p-6 text-center">
        <button type="button" onClick={cerrar}
          className="absolute top-4 right-4 text-[12px] font-bold text-hint hover:text-sub transition">
          Saltar
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.icono} alt="" className="octi-vivo mx-auto w-[118px] select-none" draggable={false} />

        <h2 className="font-display font-extrabold text-[21px] leading-tight mt-2">{p.titulo}</h2>
        <p className="text-sub text-[13.5px] leading-relaxed mt-2.5">{p.texto}</p>

        {/* Puntitos: cuántos pasos faltan. */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {PASOS.map((_, i) => (
            <span key={i}
              className={`h-1.5 rounded-full transition-all ${i === paso ? "w-5 bg-accent" : "w-1.5 bg-border"}`} />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-5">
          {paso > 0 && (
            <button type="button" onClick={() => setPaso((n) => n - 1)}
              className="rounded-full px-4 py-3 text-[14px] font-bold text-sub hover:bg-bg transition">
              Atrás
            </button>
          )}
          <button type="button"
            onClick={() => (ultimo ? cerrar() : setPaso((n) => n + 1))}
            className="flex-1 rounded-full bg-accent text-white font-bold text-[14.5px] py-3 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition">
            {ultimo ? "¡Empezar! 🚀" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
