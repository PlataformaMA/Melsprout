/** Ícono de un grupo: emoji, o imagen si `emoji` es una URL (ej. logo de un curso). */
export default function IconoGrupo({ emoji, className }: { emoji: string; className: string }) {
  const esImagen = emoji.startsWith("/") || emoji.startsWith("http");
  if (esImagen) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={emoji} alt="" className={`${className} object-cover overflow-hidden`} />;
  }
  return <span className={`${className} grid place-items-center`}>{emoji}</span>;
}
