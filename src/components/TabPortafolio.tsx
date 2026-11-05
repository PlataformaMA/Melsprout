"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  urlParaSubirVideo, urlParaSubirPortada, registrarVideo,
  fijarPrimero, borrarVideo,
} from "@/lib/portafolio";
import type { VideoPortafolio } from "@/lib/portafolio";

// El portafolio: los mejores videos de la creadora, lo primero que mira una
// marca antes de elegirla.
//
// `propio` manda: en su perfil puede subir, ordenar y borrar; en la ficha que
// ven la marca y el equipo es una galería y nada más.

const MAX_VIDEOS = 12;
const MAX_MB = 500;

export function TabPortafolio({ videos, propio, nombre }: {
  videos: VideoPortafolio[];
  propio: boolean;
  nombre?: string;
}) {
  const [viendo, setViendo] = useState<VideoPortafolio | null>(null);

  return (
    <section className="mt-5">
      <h3 className="font-display font-extrabold text-[17px]">Contenido destacado</h3>
      <p className="text-sub text-[13px] mt-1 leading-snug">
        {propio
          ? "Tus mejores videos. Es lo primero que abre una marca cuando entra a tu perfil."
          : `Videos que muestran ${nombre ? "su" : "su"} estilo, calidad de contenido y experiencias previas con marcas.`}
      </p>

      {videos.length === 0 && !propio ? (
        <div className="mt-4 bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
          <span className="text-3xl">🎬</span>
          <p className="text-sub text-[13.5px] mt-2 leading-snug max-w-xs mx-auto">
            Todavía no ha subido videos a su portafolio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {videos.map((v) => (
            <Tarjeta key={v.id} v={v} propio={propio} onVer={() => setViendo(v)} />
          ))}
          {propio && videos.length < MAX_VIDEOS && <Subir restantes={MAX_VIDEOS - videos.length} />}
        </div>
      )}

      {viendo && <Reproductor v={viendo} onCerrar={() => setViendo(null)} />}
    </section>
  );
}

// ————————————————— Una tarjeta —————————————————

function Tarjeta({ v, propio, onVer }: {
  v: VideoPortafolio; propio: boolean; onVer: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function accion(fn: () => Promise<{ ok: true } | { error: string }>) {
    setMenu(false);
    setOcupado(true);
    await fn();
    setOcupado(false);
    router.refresh();
  }

  return (
    <div className="relative group">
      <button onClick={onVer}
        className="block w-full aspect-[9/16] rounded-2xl overflow-hidden bg-bg border border-border relative"
        aria-label={v.nombre || "Ver video"}>
        {v.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.portada} alt="" className="w-full h-full object-cover" draggable={false} />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-accent-soft text-accent text-3xl">🎬</span>
        )}
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition grid place-items-center">
          <span className="w-11 h-11 rounded-full bg-white/85 text-accent grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-lg">
            <IcoPlay />
          </span>
        </span>
        {v.duracion != null && v.duracion > 0 && (
          <span className="absolute bottom-2 left-2 bg-black/65 text-white text-[11px] font-bold rounded-md px-1.5 py-0.5">
            {reloj(v.duracion)}
          </span>
        )}
        {ocupado && (
          <span className="absolute inset-0 bg-white/70 grid place-items-center text-[12px] font-bold text-sub">
            Un momento…
          </span>
        )}
      </button>

      {propio && (
        <>
          <button onClick={() => setMenu((m) => !m)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-sub grid place-items-center shadow hover:text-ink transition"
            aria-label="Opciones del video">⋮</button>

          {menu && (
            <>
              {/* Un clic en cualquier otro lado cierra el menú. */}
              <button className="fixed inset-0 z-20 cursor-default" aria-label="Cerrar menú"
                onClick={() => setMenu(false)} />
              <div className="absolute top-10 right-2 z-30 bg-surface border border-border rounded-xl shadow-lg w-44 overflow-hidden">
                <button onClick={() => accion(() => fijarPrimero(v.id))}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold hover:bg-bg transition">
                  Poner al inicio
                </button>
                <button onClick={() => accion(() => borrarVideo(v.id))}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold text-pink hover:bg-pink-soft transition border-t border-border">
                  Quitar del portafolio
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ————————————————— Subir —————————————————

function Subir({ restantes }: { restantes: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [paso, setPaso] = useState("");
  const [error, setError] = useState("");
  const [encima, setEncima] = useState(false);
  const router = useRouter();

  async function elegido(archivo: File | undefined) {
    if (!archivo || subiendo) return;
    setError("");

    const ext = (archivo.name.split(".").pop() || "").toLowerCase();
    if (!["mp4", "mov"].includes(ext)) { setError("Se aceptan videos MP4 y MOV."); return; }
    if (archivo.size > MAX_MB * 1024 * 1024) { setError(`El video pasa de ${MAX_MB} MB.`); return; }

    setSubiendo(true);
    setPaso("Preparando…");
    // La portada se saca antes de subir: si el navegador no puede leer el
    // video (pasa con algunos .mov), se sube igual y la tarjeta usa el ícono.
    const { blob, duracion } = await cuadroDelVideo(archivo);

    const permiso = await urlParaSubirVideo(archivo.name, archivo.size);
    if ("error" in permiso) { setSubiendo(false); setError(permiso.error); return; }

    const sb = createClient();
    setPaso("Subiendo video…");
    const sub = await sb.storage.from("portafolio")
      .uploadToSignedUrl(permiso.ruta, permiso.token, archivo);
    if (sub.error) {
      setSubiendo(false);
      setError("No se pudo subir el video. Revisa tu conexión e inténtalo otra vez.");
      return;
    }

    let portada: string | null = null;
    if (blob) {
      setPaso("Guardando portada…");
      const p = await urlParaSubirPortada();
      if (!("error" in p)) {
        const r = await sb.storage.from("portafolio").uploadToSignedUrl(p.ruta, p.token, blob);
        if (!r.error) portada = p.ruta;
      }
    }

    const r = await registrarVideo(permiso.ruta, archivo.name, archivo.size, duracion, portada);
    setSubiendo(false);
    setPaso("");
    if ("error" in r) { setError(r.error); return; }
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => { e.preventDefault(); setEncima(false); elegido(e.dataTransfer.files?.[0]); }}
        disabled={subiendo}
        className={`w-full aspect-[9/16] rounded-2xl border-2 border-dashed grid place-items-center px-3 text-center transition ${
          encima ? "border-accent bg-accent-soft" : "border-accent/35 bg-accent-soft/35 hover:border-accent hover:bg-accent-soft"
        } disabled:opacity-70`}>
        <span>
          <span className="w-11 h-11 rounded-full bg-white/80 text-accent grid place-items-center mx-auto">
            <IcoVideo />
          </span>
          <span className="block font-display font-extrabold text-[13.5px] mt-2.5">
            {subiendo ? paso || "Subiendo…" : "Sube tus videos"}
          </span>
          {!subiendo && (
            <>
              <span className="block text-sub text-[11.5px] leading-snug mt-1">
                Toca o arrastra tus archivos
              </span>
              <span className="block text-hint text-[10.5px] leading-relaxed mt-2">
                Formato: MP4, MOV<br />Máx: {MAX_MB} MB<br />Video vertical (9:16)
              </span>
              <span className="block text-hint text-[10.5px] mt-1.5">
                Te quedan {restantes}
              </span>
            </>
          )}
        </span>
      </button>

      <input ref={input} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="hidden"
        onChange={(e) => elegido(e.target.files?.[0])} />

      {error && <p className="text-[12px] text-pink bg-pink-soft rounded-lg px-2.5 py-2 mt-2 leading-snug">{error}</p>}
    </div>
  );
}

// Un cuadro del propio video, sacado aquí en el navegador. Subir una imagen
// de 40 KB junto al video evita que la rejilla cargue seis videos completos
// solo para pintarse.
function cuadroDelVideo(archivo: File): Promise<{ blob: Blob | null; duracion: number | null }> {
  return new Promise((resolve) => {
    let listo = false;
    const url = URL.createObjectURL(archivo);
    const terminar = (blob: Blob | null, duracion: number | null) => {
      if (listo) return;
      listo = true;
      URL.revokeObjectURL(url);
      resolve({ blob, duracion });
    };

    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.src = url;

    v.onerror = () => terminar(null, null);
    v.onloadedmetadata = () => {
      const dur = Number.isFinite(v.duration) ? Math.round(v.duration) : null;
      v.onseeked = () => {
        try {
          const lienzo = document.createElement("canvas");
          const ancho = 540;
          const escala = ancho / (v.videoWidth || ancho);
          lienzo.width = ancho;
          lienzo.height = Math.round((v.videoHeight || ancho) * escala);
          lienzo.getContext("2d")?.drawImage(v, 0, 0, lienzo.width, lienzo.height);
          lienzo.toBlob((b) => terminar(b, dur), "image/jpeg", 0.82);
        } catch {
          terminar(null, dur);
        }
      };
      // Un segundo adentro: el cuadro cero suele ser negro.
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    };

    // Si el navegador no puede con el códec, no se queda colgado esperándolo.
    setTimeout(() => terminar(null, null), 20000);
  });
}

// ————————————————— Ver un video —————————————————

function Reproductor({ v, onCerrar }: { v: VideoPortafolio; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/92 grid place-items-center p-4"
      onClick={onCerrar} role="presentation">
      <button onClick={onCerrar}
        className="absolute top-4 right-5 text-white/80 hover:text-white text-2xl leading-none"
        aria-label="Cerrar">✕</button>
      <video src={v.url} controls autoPlay playsInline
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-full w-auto rounded-xl shadow-2xl bg-black" />
    </div>
  );
}

function reloj(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const ICO = {
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round",
} as const;

function IcoPlay() { return <svg {...ICO} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>; }
function IcoVideo() { return <svg {...ICO}><rect x="2.5" y="6" width="13" height="12" rx="2.5" /><path d="m16.5 10.5 5-3v9l-5-3z" /></svg>; }
