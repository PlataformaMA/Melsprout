"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subirCover } from "@/lib/perfil-actions";

// Recorta la imagen a una portada ancha 1200x400 en el navegador.
function procesar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const W = 1200, H = 400;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        const scale = Math.max(W / img.width, H / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("img"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

export function CoverUploader({ coverUrl }: { coverUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(coverUrl);
  const [subiendo, setSubiendo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const dataUrl = await procesar(file);
      const r = await subirCover(dataUrl);
      if (!("error" in r)) {
        setPreview(r.url);
        router.refresh();
      }
    } catch {
      /* ignore */
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className="h-28 sm:h-36 relative bg-cover bg-center"
      style={
        preview
          ? { backgroundImage: `url(${preview})` }
          : { background: "linear-gradient(120deg,#5B21B6 0%,#7C3AED 55%,#A78BFA 100%)" }
      }
    >
      {!preview && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #fff3 0 20%, transparent 20%), radial-gradient(circle at 80% 60%, #fff2 0 15%, transparent 15%)",
          }}
        />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/35 hover:bg-black/50 text-white text-[12px] font-semibold rounded-lg px-2.5 py-1.5 backdrop-blur transition disabled:opacity-60"
      >
        {subiendo ? (
          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <CameraIcon />
        )}
        Portada
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFile}
        className="hidden"
      />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
