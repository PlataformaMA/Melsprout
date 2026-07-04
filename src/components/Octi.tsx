"use client";

import { useEffect, useState } from "react";

// 🐙 OCTI — la mascota pulpito morado de Melsprout (el "Duo" de la casa).
// Frases motivacionales que rotan solas, estilo Duolingo.
const FRASES = [
  "¡Hola! Soy Octi 🐙 Voy a acompañarte en todo el camino.",
  "Tu primera clase dura solo 12 minutos. ¿Empezamos?",
  "Publicar constante le gana al talento. Siempre.",
  "Un video al día y en 90 días serás otro creador. 🚀",
  "Mantén tu racha encendida. ¡No la dejes apagar! 🔥",
  "Aprende → crea → monetiza. Yo te guío paso a paso.",
  "El mejor momento para empezar fue ayer. El segundo, hoy.",
  "Cada reto que completas te acerca a tu diploma. 🏆",
];

export function Octi({
  size = 180,
  conBurbuja = true,
  mensaje,
  celebrando = false,
}: {
  size?: number;
  conBurbuja?: boolean;
  // Si se pasa `mensaje`, Octi dice ESE texto (controlado por el padre).
  // Si no, rota frases motivacionales solo.
  mensaje?: string;
  // Cuando es true, Octi salta de alegría en vez de flotar.
  celebrando?: boolean;
}) {
  const [i, setI] = useState(0);
  const controlado = mensaje !== undefined;

  // Modo rotación (auth): cambia de frase sola.
  useEffect(() => {
    if (controlado || !conBurbuja) return;
    const t = setInterval(() => {
      setI((n) => (n + 1) % FRASES.length);
    }, 4500);
    return () => clearInterval(t);
  }, [controlado, conBurbuja]);

  const texto = controlado ? mensaje : FRASES[i];
  const mostrarBurbuja = controlado ? !!mensaje : conBurbuja;

  const claseBurbuja =
    "relative bg-white text-[#3C1A6B] rounded-2xl px-4 py-3 text-[13.5px] font-medium leading-snug shadow-lg max-w-[280px] text-center octi-fade";

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {mostrarBurbuja && (
        // key={texto}: al cambiar el mensaje, se re-monta y reproduce el fundido.
        <div key={texto} className={claseBurbuja}>
          {texto}
          {/* pico de la burbuja */}
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white rotate-45" />
        </div>
      )}
      <OctiSVG size={size} anim={celebrando ? "octi-bounce" : "octi-float"} />
    </div>
  );
}

function OctiSVG({ size, anim = "octi-float" }: { size: number; anim?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={anim}
      role="img"
      aria-label="Octi, la mascota pulpito de Melsprout"
    >
      <defs>
        <radialGradient id="octiBody" cx="42%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="60%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
      </defs>

      {/* sombra suave */}
      <ellipse cx="100" cy="185" rx="46" ry="8" fill="#000" opacity="0.08" />

      {/* tentáculos */}
      <g fill="url(#octiBody)">
        <path d="M56 120 C40 140 34 160 44 176 C50 184 60 180 58 168 C56 156 62 140 74 132 Z" />
        <path d="M72 132 C64 156 60 172 68 182 C74 189 84 184 80 172 C77 162 80 146 88 138 Z" />
        <path d="M100 138 C96 160 96 176 100 184 C104 176 104 160 100 138 Z" />
        <path d="M128 132 C136 156 140 172 132 182 C126 189 116 184 120 172 C123 162 120 146 112 138 Z" />
        <path d="M144 120 C160 140 166 160 156 176 C150 184 140 180 142 168 C144 156 138 140 126 132 Z" />
      </g>

      {/* cabeza / manto */}
      <ellipse cx="100" cy="82" rx="60" ry="56" fill="url(#octiBody)" />
      {/* pancita más clara */}
      <ellipse cx="100" cy="98" rx="40" ry="34" fill="#EDE9FE" opacity="0.55" />

      {/* cachetitos */}
      <circle cx="66" cy="98" r="10" fill="#F9A8D4" opacity="0.75" />
      <circle cx="134" cy="98" r="10" fill="#F9A8D4" opacity="0.75" />

      {/* ojos (blanco) */}
      <g className="octi-eyes">
        <circle cx="80" cy="78" r="17" fill="#fff" />
        <circle cx="120" cy="78" r="17" fill="#fff" />
        {/* pupilas */}
        <circle cx="84" cy="80" r="8.5" fill="#2B1055" />
        <circle cx="124" cy="80" r="8.5" fill="#2B1055" />
        {/* brillitos */}
        <circle cx="80.5" cy="76" r="3" fill="#fff" />
        <circle cx="120.5" cy="76" r="3" fill="#fff" />
      </g>

      {/* cejitas */}
      <path d="M70 58 Q80 52 92 57" stroke="#5B21B6" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M108 57 Q120 52 130 58" stroke="#5B21B6" strokeWidth="3.5" strokeLinecap="round" />

      {/* sonrisa */}
      <path
        d="M86 104 Q100 116 114 104"
        stroke="#2B1055"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
