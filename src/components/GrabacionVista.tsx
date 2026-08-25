"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { AvatarInstructor } from "@/components/Instructor";
import type { ClaseVivo } from "@/lib/vivo-actions";

function dur(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// Si la grabación está en YouTube la incrustamos; si es un archivo nuestro,
// se reproduce con el reproductor del navegador. En los dos casos, sin salir.
function idYouTube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function GrabacionVista({
  clase,
  nombre,
  avatarUrl,
  gemas,
  racha,
}: {
  clase: ClaseVivo;
  nombre: string;
  avatarUrl: string | null;
  gemas: number;
  racha: number;
}) {
  const url = clase.grabacion_url || "";
  const yt = idYouTube(url);

  return (
    <div className="flex min-h-screen bg-bg">
      <AppSidebar active="vivo" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {gemas}</span>
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <Link href="/app/vivo" className="text-[13px] font-semibold text-sub hover:text-accent transition">
            ← Volver a clases en vivo
          </Link>

          <div className="mt-3 rounded-2xl overflow-hidden bg-black aspect-video">
            {yt ? (
              <iframe
                src={`https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`}
                title={clase.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : url ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={url} controls playsInline preload="metadata" className="w-full h-full" />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/70 text-[14px]">
                Esta grabación todavía no está disponible.
              </div>
            )}
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-extrabold mt-4">{clase.titulo}</h1>
          {clase.descripcion && <p className="text-[14px] text-sub mt-1.5 leading-relaxed">{clase.descripcion}</p>}

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            {clase.instructor && <AvatarInstructor nombre={clase.instructor} size={40} />}
            <div>
              <div className="font-display font-extrabold text-[15px]">{clase.instructor || "Melsprout"}</div>
              <div className="text-[12px] text-sub">
                Grabación · {dur(clase.duracion_min)}
                {clase.categoria ? ` · ${clase.categoria}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
