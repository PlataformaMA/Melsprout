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
      <ellipse cx="100" cy="186" rx="48" ry="8" fill="#000" opacity="0.08" />

      {/* tentáculos traseros (más oscuros, dan profundidad) */}
      <g fill="#6D28D9">
        <path d="M64 118 C46 138 36 160 46 178 C53 188 64 183 62 170 C60 156 66 138 78 128 Z" />
        <path d="M136 118 C154 138 164 160 154 178 C147 188 136 183 138 170 C140 156 134 138 122 128 Z" />
      </g>
      {/* tentáculos frontales */}
      <g fill="url(#octiBody)">
        <path d="M80 128 C68 150 62 170 70 182 C76 190 86 186 84 173 C82 160 86 142 94 134 Z" />
        <path d="M100 132 C95 156 94 176 100 186 C106 176 106 156 100 132 Z" />
        <path d="M120 128 C132 150 138 170 130 182 C124 190 114 186 116 173 C118 160 114 142 106 134 Z" />
      </g>
      {/* ventositas */}
      <g fill="#C4B5FD">
        <circle cx="57" cy="168" r="3" /><circle cx="61" cy="176" r="2.4" />
        <circle cx="78" cy="171" r="3" /><circle cx="81" cy="180" r="2.4" />
        <circle cx="100" cy="176" r="3" /><circle cx="100" cy="184" r="2.4" />
        <circle cx="122" cy="171" r="3" /><circle cx="119" cy="180" r="2.4" />
        <circle cx="143" cy="168" r="3" /><circle cx="139" cy="176" r="2.4" />
      </g>

      {/* cabeza / manto */}
      <ellipse cx="100" cy="80" rx="58" ry="55" fill="url(#octiBody)" />
      {/* brillo superior */}
      <ellipse cx="80" cy="52" rx="24" ry="16" fill="#fff" opacity="0.18" />
      {/* pancita más clara */}
      <ellipse cx="100" cy="97" rx="39" ry="33" fill="#EDE9FE" opacity="0.5" />

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
