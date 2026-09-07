"use client";

import { useState } from "react";

// El cofre se abre de verdad: la tapa es una imagen aparte y gira hacia atrás.
// Cuando termina de abrirse, recién entonces aparece lo que hay dentro.
export function CofreAnimado({
  size = 56,
  label = "Cofre · recompensas",
  onAbierto,
  className = "",
}: {
  size?: number;
  label?: string;
  onAbierto: () => void;
  className?: string;
}) {
  const [abriendo, setAbriendo] = useState(false);

  function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    // El modal entra cuando la tapa ya terminó de levantarse.
    setTimeout(() => {
      setAbriendo(false);
      onAbierto();
    }, 700);
  }

  // Destellos que salen del cofre, cada uno hacia su lado.
  const chispas = [
    { dx: "-24px", dy: "-32px", d: "0.10s", c: "#F5B301" },
    { dx: "20px", dy: "-36px", d: "0.16s", c: "#7C3AED" },
    { dx: "-10px", dy: "-44px", d: "0.22s", c: "#F472B6" },
    { dx: "28px", dy: "-22px", d: "0.19s", c: "#F5B301" },
    { dx: "-30px", dy: "-18px", d: "0.25s", c: "#A78BFA" },
  ];

  // La tapa ocupa la parte de arriba de la ilustración; la base, el resto.
  const altoTapa = size * 0.45;
  const altoBase = size * 0.57;

  return (
    <button
      onClick={abrir}
      title={label}
      aria-label={label}
      className={`relative grid place-items-end justify-items-center hover:-translate-y-0.5 active:scale-95 transition ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Luz que sale del interior al abrirse */}
      {abriendo && (
        <span
          aria-hidden
          className="cofre-luz absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
          style={{
            bottom: altoBase * 0.55,
            width: size * 0.6,
            height: size * 0.7,
            background: "radial-gradient(ellipse at bottom, #FDE68A 0%, rgba(253,230,138,0) 70%)",
          }}
        />
      )}

      {abriendo &&
        chispas.map((ch, i) => (
          <span
            key={i}
            aria-hidden
            className="chispa absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              bottom: altoBase * 0.6,
              background: ch.c,
              animationDelay: ch.d,
              ["--dx" as string]: ch.dx,
              ["--dy" as string]: ch.dy,
            }}
          />
        ))}

      {/* Tapa: gira hacia atrás desde su borde de abajo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cofre-tapa.png"
        alt=""
        draggable={false}
        className={`absolute left-0 select-none ${abriendo ? "cofre-tapa-abriendo" : ""}`}
        style={{ width: size, height: altoTapa, bottom: altoBase * 0.86, objectFit: "contain" }}
      />

      {/* Base */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cofre-base.png"
        alt=""
        draggable={false}
        className={`relative select-none ${abriendo ? "cofre-base-tiembla" : ""}`}
        style={{ width: size, height: altoBase, objectFit: "contain" }}
      />
    </button>
  );
}
