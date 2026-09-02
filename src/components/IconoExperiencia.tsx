// La experiencia que la alumna eligió en el onboarding, contada como
// crecimiento: semilla → brote → planta → en flor. Va con el nombre Melsprout.

type Nivel = 1 | 2 | 3 | 4;

const NIVELES: { texto: string; nivel: Nivel }[] = [
  { texto: "Nunca he publicado", nivel: 1 },
  { texto: "He publicado algunas veces", nivel: 2 },
  { texto: "Ya soy creador", nivel: 3 },
  { texto: "Publico constantemente", nivel: 4 },
];

export function nivelExperiencia(texto: string | null): Nivel | null {
  if (!texto) return null;
  const t = texto.trim().toLowerCase();
  return NIVELES.find((n) => n.texto.toLowerCase() === t)?.nivel ?? null;
}

// Cada escalón sube de lila claro a morado fuerte.
const COLOR: Record<Nivel, { fondo: string; trazo: string }> = {
  1: { fondo: "#F3EFFC", trazo: "#B7A6E8" },
  2: { fondo: "#EDE6FB", trazo: "#9B7FE0" },
  3: { fondo: "#E4D9F9", trazo: "#7C3AED" },
  4: { fondo: "#DCCDF7", trazo: "#5B21B6" },
};

export function IconoExperiencia({ texto, size = 30 }: { texto: string | null; size?: number }) {
  const n = nivelExperiencia(texto);
  if (!n) {
    return (
      <span title="Sin responder" style={{ width: size, height: size }}
        className="rounded-xl bg-bg border border-border grid place-items-center text-hint text-[12px]">–</span>
    );
  }
  const c = COLOR[n];
  return (
    <span
      title={`${texto} · ${n} de 4`}
      aria-label={texto ?? ""}
      style={{ width: size, height: size, background: c.fondo }}
      className="rounded-xl grid place-items-center shrink-0"
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none"
        stroke={c.trazo} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {/* Tierra: siempre está */}
        <path d="M4.5 20.5h15" />

        {n === 1 && (
          // Semilla bajo la tierra
          <ellipse cx="12" cy="17" rx="2.6" ry="2" fill={c.trazo} stroke="none" />
        )}

        {n >= 2 && <path d="M12 20.5V11" />}
        {n === 2 && (
          // Brote: una hoja
          <path d="M12 13c-3.2 0-4.6-1.6-4.6-4.3 2.9-.5 4.6 1.2 4.6 4.3z" />
        )}

        {n >= 3 && (
          // Planta: dos hojas
          <>
            <path d="M12 14c-3.2 0-4.6-1.6-4.6-4.3 2.9-.5 4.6 1.2 4.6 4.3z" />
            <path d="M12 11.5c3.2 0 4.6-1.6 4.6-4.3-2.9-.5-4.6 1.2-4.6 4.3z" />
          </>
        )}

        {n === 4 && (
          // En flor: corona de pétalos arriba
          <>
            <circle cx="12" cy="5" r="1.7" fill={c.trazo} stroke="none" />
            <path d="M12 6.7V9" />
            <path d="M9.6 3.4 8.4 2M14.4 3.4 15.6 2M8.9 6.3 7.2 6.9M15.1 6.3l1.7.6" />
          </>
        )}
      </svg>
    </span>
  );
}

// Versión con texto, para la ficha.
export function ExperienciaConTexto({ texto }: { texto: string | null }) {
  return (
    <span className="flex items-center gap-2 justify-end">
      <IconoExperiencia texto={texto} size={26} />
      <span className="text-[13.5px] font-semibold">{texto || "Sin responder"}</span>
    </span>
  );
}
