"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { descargarRecurso } from "@/lib/recursos-actions";
import type { MaterialVivo } from "@/lib/vivo-actions";
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
  xp,
  racha,
  material = [],
}: {
  clase: ClaseVivo;
  nombre: string;
  avatarUrl: string | null;
  xp: number;
  racha: number;
  // La presentación y lo demás que dejó quien dio la clase.
  material?: MaterialVivo[];
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
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
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
              <video src={url} controls playsInline preload="metadata" className="w-full h-full"
                controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/70 text-[14px]">
                Esta grabación todavía no está disponible.
              </div>
            )}
          </div>

          {/* De qué curso es. Si la grabación está atada a un curso (modulo_id),
              se dice que es exclusiva: así nadie la comparte creyendo que es
              abierta. */}
          {clase.categoria && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-[12px] font-bold rounded-full px-3 py-1.5">
                {clase.modulo_id ? `🔒 Exclusiva de ${clase.categoria}` : clase.categoria}
              </span>
            </div>
          )}

          <h1 className="font-display text-xl sm:text-2xl font-extrabold mt-2.5">{clase.titulo}</h1>
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

          {/* Material de la clase. Hasta ahora no se veía en ningún lado. */}
          {material.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display font-extrabold text-[16px] mb-3">Material de la clase</h2>
              <div className="space-y-2.5">
                {material.map((m) => <FilaMaterial key={m.id} m={m} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Una pieza de material: se pide el enlace al servidor (firmado y con caducidad)
// y se abre. Así el archivo nunca queda expuesto.
function FilaMaterial({ m }: { m: MaterialVivo }) {
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();

  function abrir() {
    setError("");
    startTransition(async () => {
      const r = await descargarRecurso(m.id);
      if ("error" in r) { setError(r.error); return; }
      window.open(r.url, "_blank", "noopener");
    });
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3.5">
      <span className="w-11 h-11 rounded-xl bg-accent-soft grid place-items-center text-[20px] shrink-0">
        {m.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display font-extrabold text-[14px] leading-tight">{m.titulo}</div>
        {m.descripcion && <p className="text-[12.5px] text-sub leading-snug mt-0.5">{m.descripcion}</p>}
        {m.peso && <div className="text-[11.5px] text-hint mt-0.5">{m.peso}</div>}
        {error && <p className="text-[11.5px] text-pink mt-1">{error}</p>}
      </div>
      <button type="button" onClick={abrir} disabled={pendiente}
        className="shrink-0 bg-accent text-white rounded-xl px-4 py-2.5 text-[13px] font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-60">
        {pendiente ? "Abriendo…" : m.esArchivo ? "Descargar" : "Abrir"}
      </button>
    </div>
  );
}
