// Cofre en vector: la tapa es su propio grupo, así se abre de verdad.
export function CofreVector({
  size = 120,
  abierto = false,
  className = "",
}: {
  size?: number;
  abierto?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 140"
      width={size}
      height={(size * 140) / 160}
      className={`select-none ${className}`}
      role="img"
      aria-label="Cofre del tesoro"
    >
      <defs>
        <linearGradient id="cofMadera" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5E34" />
          <stop offset="100%" stopColor="#5C3A1E" />
        </linearGradient>
        <linearGradient id="cofTapa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A97142" />
          <stop offset="100%" stopColor="#7A4B24" />
        </linearGradient>
        <linearGradient id="cofOro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id="cofBrillo" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="132" rx="46" ry="6" fill="#000" opacity="0.1" />

      {/* Lo que se ve dentro cuando se abre */}
      {abierto && (
        <g>
          <ellipse cx="80" cy="74" rx="40" ry="12" fill="#3B2412" />
          <ellipse cx="80" cy="66" rx="46" ry="30" fill="url(#cofBrillo)" />
          <circle cx="66" cy="70" r="7" fill="url(#cofOro)" />
          <circle cx="82" cy="67" r="8.5" fill="url(#cofOro)" />
          <circle cx="97" cy="71" r="6.5" fill="url(#cofOro)" />
          <path d="M74 62l3.5 7 7.5 1-5.5 5 1.5 7.5-6.5-3.5-6.5 3.5 1.5-7.5-5.5-5 7.5-1z" fill="#FEF3C7" opacity="0.95" />
        </g>
      )}

      {/* Cuerpo */}
      <g className={abierto ? "cofre-base-tiembla" : undefined}>
        <rect x="30" y="74" width="100" height="48" rx="7" fill="url(#cofMadera)" />
        <rect x="30" y="86" width="100" height="9" fill="url(#cofOro)" />
        <rect x="30" y="112" width="100" height="7" rx="2" fill="url(#cofOro)" opacity="0.9" />
        <rect x="46" y="74" width="6" height="48" fill="#000" opacity="0.12" />
        <rect x="108" y="74" width="6" height="48" fill="#000" opacity="0.12" />
      </g>

      {/* Tapa: gira sobre su borde de atrás */}
      <g
        className={abierto ? "cofre-tapa-abriendo" : undefined}
      >
        <path d="M30 76V56c0-16 22-27 50-27s50 11 50 27v20z" fill="url(#cofTapa)" />
        <path d="M30 68h100v8H30z" fill="url(#cofOro)" opacity="0.9" />
        <path d="M46 76V54c0-7 5-12 10-13" stroke="#000" strokeOpacity="0.12" strokeWidth="6" fill="none" />
        <path d="M114 76V54c0-7-5-12-10-13" stroke="#000" strokeOpacity="0.12" strokeWidth="6" fill="none" />
        {/* Estrellitas de mar del diseño */}
        <path d="M63 44l2.6 5.2 5.6.8-4 4 .9 5.6-5.1-2.7-5.1 2.7.9-5.6-4-4 5.6-.8z" fill="#F9A8D4" />
        <path d="M99 40l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#FBCFE8" />
      </g>

      {/* Cerradura, siempre sobre el cuerpo */}
      <rect x="70" y="80" width="20" height="22" rx="4" fill="url(#cofOro)" />
      <circle cx="80" cy="88" r="3.6" fill="#7A4B24" />
      <path d="M80 90v6" stroke="#7A4B24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
