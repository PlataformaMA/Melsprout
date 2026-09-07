// Octi en vector, dibujado para parecerse al de la ilustración pero despiezado:
// cada tentáculo es su propio grupo, con su ancla, su ritmo y su retraso, así
// se mueven de a uno y nunca coinciden.

type Tent = {
  id: string;
  d: string;
  ancla: [number, number];
  dur: number;
  retraso: number;
  giro: number;
  atras?: boolean;
  ventosas?: [number, number, number][];
};

// Los dos de los lados van levantados y curvados; los cuatro de abajo cuelgan.
const TENTACULOS: Tent[] = [
  // Los dos de los lados se levantan y se enroscan, como en la ilustración.
  {
    id: "lado-izq", ancla: [58, 96], dur: 3.4, retraso: 0, giro: 7,
    d: "M60 94C44 96 31 90 26 76c-3-10 3-19 11-17 7 2 8 11 2 14",
    ventosas: [[29, 84, 2.8], [34, 73, 2.4]],
  },
  {
    id: "lado-der", ancla: [142, 96], dur: 3.9, retraso: 0.5, giro: -7,
    d: "M140 94c16 2 29-4 34-18 3-10-3-19-11-17-7 2-8 11-2 14",
    ventosas: [[171, 84, 2.8], [166, 73, 2.4]],
  },
  // Los cuatro de abajo, largos y abiertos hacia afuera.
  {
    id: "abajo-1", atras: true, ancla: [70, 112], dur: 3.1, retraso: 0.3, giro: 5,
    d: "M70 108c-9 18-21 31-35 37-10 4-18-3-15-12 2-7 10-8 14-3",
    ventosas: [[41, 143, 2.7], [51, 136, 2.3]],
  },
  {
    id: "abajo-2", ancla: [88, 118], dur: 3.6, retraso: 0.85, giro: 4,
    d: "M88 114c-5 20-11 34-19 42-7 7-16 3-16-6 0-7 7-9 12-5",
    ventosas: [[63, 152, 2.7], [72, 143, 2.3]],
  },
  {
    id: "abajo-3", ancla: [112, 118], dur: 3.3, retraso: 0.15, giro: -4,
    d: "M112 114c5 20 11 34 19 42 7 7 16 3 16-6 0-7-7-9-12-5",
    ventosas: [[137, 152, 2.7], [128, 143, 2.3]],
  },
  {
    id: "abajo-4", atras: true, ancla: [130, 112], dur: 4.0, retraso: 0.65, giro: -5,
    d: "M130 108c9 18 21 31 35 37 10 4 18-3 15-12-2-7-10-8-14-3",
    ventosas: [[159, 143, 2.7], [149, 136, 2.3]],
  },
];

export function OctiVector({
  size = 160,
  animado = true,
  className = "",
}: {
  size?: number;
  animado?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 176"
      width={size}
      height={(size * 176) / 200}
      className={`select-none ${animado ? "octi-cuerpo" : ""} ${className}`}
      role="img"
      aria-label="Octi"
    >
      <defs>
        <radialGradient id="ovCuerpo" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="58%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
        <linearGradient id="ovTent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#B79DF5" />
        </linearGradient>
        <linearGradient id="ovTentAtras" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="168" rx="44" ry="6" fill="#000" opacity="0.07" />

      {/* Tentáculos de atrás */}
      {TENTACULOS.filter((t) => t.atras).map((t) => (
        <Tentaculo key={t.id} t={t} animado={animado} />
      ))}

      {/* Cabeza */}
      <ellipse cx="100" cy="70" rx="52" ry="52" fill="url(#ovCuerpo)" />
      {/* Pancita más clara */}
      <ellipse cx="100" cy="88" rx="35" ry="30" fill="#EDE9FE" opacity="0.38" />

      {/* Tentáculos de enfrente */}
      {TENTACULOS.filter((t) => !t.atras).map((t) => (
        <Tentaculo key={t.id} t={t} animado={animado} />
      ))}

      {/* Brillos de arriba */}
      <ellipse cx="78" cy="38" rx="17" ry="11" fill="#fff" opacity="0.24" transform="rotate(-25 78 38)" />
      <circle cx="102" cy="27" r="4.5" fill="#fff" opacity="0.2" />

      {/* Cejas */}
      <path d="M70 50c7-6 17-7 24-2" stroke="#5B21B6" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M130 50c-7-6-17-7-24-2" stroke="#5B21B6" strokeWidth="4.5" strokeLinecap="round" fill="none" />

      {/* Ojos */}
      <g className={animado ? "octi-ojos" : undefined} style={{ transformOrigin: "100px 74px" }}>
        <ellipse cx="82" cy="74" rx="15" ry="17" fill="#fff" />
        <ellipse cx="118" cy="74" rx="15" ry="17" fill="#fff" />
        <circle cx="85" cy="76" r="8" fill="#2B1055" />
        <circle cx="121" cy="76" r="8" fill="#2B1055" />
        <circle cx="81.5" cy="71" r="3" fill="#fff" />
        <circle cx="117.5" cy="71" r="3" fill="#fff" />
      </g>

      {/* Cachetes */}
      <circle cx="66" cy="90" r="8.5" fill="#F9A8D4" opacity="0.8" />
      <circle cx="134" cy="90" r="8.5" fill="#F9A8D4" opacity="0.8" />

      {/* Sonrisa */}
      <path d="M92 96c4 6 12 6 16 0" stroke="#2B1055" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Tentaculo({ t, animado }: { t: Tent; animado: boolean }) {
  return (
    <g
      className={animado ? "octi-tent" : undefined}
      style={{
        transformOrigin: `${t.ancla[0]}px ${t.ancla[1]}px`,
        animationDuration: `${t.dur}s`,
        animationDelay: `${t.retraso}s`,
        ["--giro" as string]: `${t.giro}deg`,
      }}
    >
      <path
        d={t.d}
        fill="none"
        stroke={t.atras ? "url(#ovTentAtras)" : "url(#ovTent)"}
        strokeWidth="13"
        strokeLinecap="round"
      />
      {(t.ventosas ?? []).map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#C4B5FD" opacity="0.9" />
      ))}
    </g>
  );
}
