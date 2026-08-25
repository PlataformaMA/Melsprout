"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Editor de foto de perfil: arrastrar para encuadrar y zoom para acercar.
// Devuelve un dataURL cuadrado listo para subir.
export function RecortarFoto({
  file,
  onCancelar,
  onListo,
  salida = 512,
}: {
  file: File;
  onCancelar: () => void;
  onListo: (dataUrl: string) => void;
  salida?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const marcoRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Lado del marco en píxeles (cuadrado, se adapta a la pantalla).
  const [lado, setLado] = useState(280);
  useEffect(() => {
    const medir = () => setLado(Math.min(300, Math.max(200, window.innerWidth - 96)));
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => setError("No pudimos leer esa imagen.");
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Escala mínima para que la foto siempre cubra el marco.
  const base = img ? Math.max(lado / img.width, lado / img.height) : 1;
  const k = base * zoom;
  const anchoMostrado = img ? img.width * k : 0;
  const altoMostrado = img ? img.height * k : 0;

  // Nunca dejamos huecos: el desplazamiento se limita al sobrante.
  const limitar = useCallback(
    (p: { x: number; y: number }) => {
      const mx = Math.max(0, (anchoMostrado - lado) / 2);
      const my = Math.max(0, (altoMostrado - lado) / 2);
      return {
        x: Math.min(mx, Math.max(-mx, p.x)),
        y: Math.min(my, Math.max(-my, p.y)),
      };
    },
    [anchoMostrado, altoMostrado, lado],
  );

  useEffect(() => { setPos((p) => limitar(p)); }, [limitar]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const a = arrastre.current;
    if (!a) return;
    setPos(limitar({ x: a.px + (e.clientX - a.x), y: a.py + (e.clientY - a.y) }));
  }
  function onPointerUp() { arrastre.current = null; }

  function recortar() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = salida;
    canvas.height = salida;
    const ctx = canvas.getContext("2d");
    if (!ctx) return setError("Tu navegador no pudo procesar la imagen.");

    // El marco, traducido a coordenadas de la imagen original.
    const sx = (anchoMostrado / 2 - pos.x - lado / 2) / k;
    const sy = (altoMostrado / 2 - pos.y - lado / 2) / k;
    const s = lado / k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, s, s, 0, 0, salida, salida);
    onListo(canvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[380px] p-5 shadow-2xl">
        <h2 className="font-display font-extrabold text-[18px] text-center">Ajusta tu foto</h2>
        <p className="text-[12.5px] text-sub text-center mt-1 mb-4">
          Arrastra para encuadrar y usa el zoom para acercar.
        </p>

        <div
          ref={marcoRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative mx-auto rounded-full overflow-hidden bg-bg border-4 border-accent/30 touch-none cursor-grab active:cursor-grabbing select-none"
          style={{ width: lado, height: lado }}
        >
          {src && img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="Foto por recortar"
              draggable={false}
              className="absolute max-w-none pointer-events-none"
              style={{
                width: anchoMostrado,
                height: altoMostrado,
                left: lado / 2 + pos.x - anchoMostrado / 2,
                top: lado / 2 + pos.y - altoMostrado / 2,
              }}
            />
          )}
          {!img && !error && (
            <div className="absolute inset-0 grid place-items-center text-[13px] text-hint">Cargando…</div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <span className="text-sub text-[13px]" aria-hidden>−</span>
          <input
            type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="flex-1 accent-accent"
          />
          <span className="text-sub text-[15px]" aria-hidden>+</span>
        </div>

        {error && <p className="text-[12.5px] text-pink text-center mt-3">{error}</p>}

        <div className="flex gap-2.5 mt-5">
          <button
            type="button" onClick={onCancelar}
            className="flex-1 border border-border rounded-full py-2.5 text-[14px] font-bold text-sub hover:bg-bg transition"
          >
            Cancelar
          </button>
          <button
            type="button" onClick={recortar} disabled={!img}
            className="flex-1 bg-accent text-white rounded-full py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-50"
          >
            Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}
