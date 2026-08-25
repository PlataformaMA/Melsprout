// Nombre del instructor con su foto. Si no tenemos foto, caen sus iniciales.
// Las fotos viven en /public/instructores para que no dependan de la BD.
const FOTOS: Record<string, string> = {
  melissa: "/instructores/melissa.jpg",
  "melissa arria": "/instructores/melissa.jpg",
};

export function fotoInstructor(nombre?: string | null): string | null {
  if (!nombre) return null;
  return FOTOS[nombre.trim().toLowerCase()] ?? null;
}

function iniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function AvatarInstructor({
  nombre,
  size = 28,
  className = "",
}: {
  nombre: string;
  size?: number;
  className?: string;
}) {
  const foto = fotoInstructor(nombre);
  const estilo = { width: size, height: size };
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={foto}
        alt={nombre}
        style={estilo}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }
  return (
    <span
      style={estilo}
      className={`rounded-full bg-accent/15 text-accent grid place-items-center font-bold shrink-0 ${className}`}
    >
      <span style={{ fontSize: Math.max(9, Math.round(size * 0.4)) }}>{iniciales(nombre)}</span>
    </span>
  );
}
