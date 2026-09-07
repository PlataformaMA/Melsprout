"use client";

import { useEffect, useState } from "react";
import { CofreVector } from "@/components/CofreVector";

// La secuencia completa: el cofre crece en el centro de la pantalla, la tapa
// se abre, salen monedas y destellos, y hasta entonces aparece lo demás.
export function AbrirCofre({ onListo }: { onListo: () => void }) {
  const [fase, setFase] = useState<"creciendo" | "abriendo" | "saliendo">("creciendo");

  useEffect(() => {
    const a = setTimeout(() => setFase("abriendo"), 380);
    const b = setTimeout(() => setFase("saliendo"), 900);
    const c = setTimeout(onListo, 1750);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [onListo]);

  // Lo que sale volando del cofre.
  const cosas = [
    { e: "🪙", dx: "-90px", dy: "-150px", r: "-35deg", d: "0s" },
    { e: "💎", dx: "70px", dy: "-175px", r: "30deg", d: "0.06s" },
    { e: "⭐", dx: "-40px", dy: "-195px", r: "-15deg", d: "0.12s" },
    { e: "🪙", dx: "115px", dy: "-120px", r: "45deg", d: "0.18s" },
    { e: "✨", dx: "-125px", dy: "-105px", r: "-50deg", d: "0.1s" },
    { e: "💎", dx: "25px", dy: "-205px", r: "12deg", d: "0.22s" },
    { e: "⭐", dx: "-70px", dy: "-130px", r: "-25deg", d: "0.28s" },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 grid place-items-center" role="dialog" aria-modal="true"
      aria-label="Abriendo el cofre">
      <div className="relative grid place-items-center">
        {fase !== "creciendo" &&
          cosas.map((c, i) => (
            <span key={i} aria-hidden
              className="cofre-vuela absolute text-3xl pointer-events-none"
              style={{
                animationDelay: c.d,
                ["--dx" as string]: c.dx,
                ["--dy" as string]: c.dy,
                ["--rot" as string]: c.r,
              }}>
              {c.e}
            </span>
          ))}

        <div className={fase === "creciendo" ? "cofre-crece" : "cofre-grande"}>
          <CofreVector size={220} abierto={fase !== "creciendo"} />
        </div>

        {fase === "saliendo" && (
          <p className="absolute -bottom-14 text-white font-display font-extrabold text-xl octi-aparece">
            ¡Mira lo que hay dentro!
          </p>
        )}
      </div>
    </div>
  );
}
