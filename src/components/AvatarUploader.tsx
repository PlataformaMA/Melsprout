"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subirAvatar } from "@/lib/perfil-actions";
import { RecortarFoto } from "@/components/RecortarFoto";

function iniciales(nombre: string): string {
  if (!nombre) return "🐙";
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function AvatarUploader({
  avatarUrl,
  nombre,
  size = 96,
}: {
  avatarUrl: string | null;
  nombre: string;
  size?: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [porRecortar, setPorRecortar] = useState<File | null>(null);

  // Al elegir archivo abrimos el editor; nada se sube hasta que encuadra.
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { setError("La imagen pesa más de 12 MB."); return; }
    setError("");
    setPorRecortar(file);
  }

  async function subir(dataUrl: string) {
    setPorRecortar(null);
    setSubiendo(true);
    try {
      const r = await subirAvatar(dataUrl);
      if ("error" in r) setError(r.error);
      else {
        setPreview(r.url);
        router.refresh();
      }
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="w-full h-full rounded-full border-4 border-surface shadow-lg overflow-hidden grid place-items-center text-white font-display font-extrabold text-2xl"
          style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)" }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <span>{iniciales(nombre)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          aria-label="Cambiar foto de perfil"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-white border-2 border-surface grid place-items-center shadow-md hover:brightness-110 transition disabled:opacity-60"
        >
          {subiendo ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <CameraIcon />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFile}
          className="hidden"
        />
      </div>
      {error && <p className="text-[11px] text-pink mt-1 max-w-[140px] text-center">{error}</p>}

      {porRecortar && (
        <RecortarFoto
          file={porRecortar}
          onCancelar={() => setPorRecortar(null)}
          onListo={subir}
        />
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
