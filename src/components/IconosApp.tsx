// Iconos de la app (los del Figma). Son PNG de una sola tinta, así que se
// pintan con máscara: el archivo da la forma y el color lo pone el CSS.
// Así el mismo archivo sirve en morado, en blanco o en gris.

export type NombreIcono =
  | "estrella" | "chispa" | "candado" | "completado" | "play"
  | "descargar" | "documento" | "calendario" | "corazon" | "corazon-lleno"
  | "reloj" | "comentario" | "comentario-linea" | "personas" | "persona"
  | "cuadricula" | "mapa";

export function Icono({
  nombre,
  size = 20,
  color = "currentColor",
  className = "",
}: {
  nombre: NombreIcono;
  size?: number;
  color?: string;
  className?: string;
}) {
  const url = `url(/iconos/${nombre}.png)`;
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

// La flecha de regresar viene con su círculo blanco, así que va tal cual.
export function BotonVolver({
  href, onClick, className = "",
}: {
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const contenido = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/iconos/volver.png" alt="" width={40} height={40}
      className="w-10 h-10 select-none" draggable={false} />
  );
  const clases = `inline-block hover:brightness-95 active:scale-95 transition ${className}`;
  if (href) return <a href={href} aria-label="Volver" className={clases}>{contenido}</a>;
  return <button type="button" onClick={onClick} aria-label="Volver" className={clases}>{contenido}</button>;
}
