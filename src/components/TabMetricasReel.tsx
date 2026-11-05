"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarEnlaceReel, sincronizarReel } from "@/lib/metricas-reel";
import { fechaCorta } from "@/lib/formato-campanias";
import type { Reel, MetricasReel } from "@/lib/metricas-reel";

// Cómo le fue al reel que publicó, comparado con el promedio de la campaña.
//
// Los números no se escriben a mano: se leen de la red que ella conectó. Por
// eso siempre se dice cuándo se leyeron — un número sin fecha miente.

const TILES: { k: keyof MetricasReel; txt: string; icono: React.ReactNode; tono: string }[] = [
  { k: "vistas", txt: "Reproducciones", icono: <IcoPlay />, tono: "bg-accent-soft text-accent" },
  { k: "likes", txt: "Me gusta", icono: <IcoCorazon />, tono: "bg-pink-soft text-pink" },
  { k: "comentarios", txt: "Comentarios", icono: <IcoGlobo />, tono: "bg-accent-soft text-accent" },
  { k: "compartidos", txt: "Compartidos", icono: <IcoAvion />, tono: "bg-blue-50 text-blue-600" },
  { k: "engagement", txt: "Engagement", icono: <IcoSubida />, tono: "bg-accent-soft text-accent" },
];

export function TabMetricasReel({ reels }: { reels: Reel[] }) {
  const [cual, setCual] = useState(0);

  if (reels.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
        <h3 className="font-display font-extrabold text-[17px] mt-3">Todavía no hay métricas</h3>
        <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
          Cuando te seleccionen para una campaña y publiques tu contenido, aquí vas a ver
          cómo le fue comparado con el resto de la campaña.
        </p>
      </div>
    );
  }

  const reel = reels[Math.min(cual, reels.length - 1)];

  return (
    <>
      {reels.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {reels.map((r, i) => (
            <button key={r.colaboracionId} onClick={() => setCual(i)}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
                i === cual ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
              {r.campania}
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
        <TarjetaReel reel={reel} />
        <Panel reel={reel} />
      </div>
    </>
  );
}

// ————————————————— El reel —————————————————

function TarjetaReel({ reel }: { reel: Reel }) {
  return (
    <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 shadow-sm">
      <h3 className="font-display font-extrabold text-[15.5px]">Reel publicado</h3>

      <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-bg border border-border mt-3 relative">
        {reel.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reel.portada} alt="" className="w-full h-full object-cover" draggable={false} />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-accent-soft text-accent text-4xl">🎬</span>
        )}
        {reel.url && (
          <a href={reel.url} target="_blank" rel="noreferrer"
            className="absolute inset-0 grid place-items-center group" aria-label="Abrir la publicación">
            <span className="w-14 h-14 rounded-full bg-black/55 text-white grid place-items-center group-hover:bg-black/70 transition">
              <IcoPlayGrande />
            </span>
          </a>
        )}
        {reel.duracion != null && reel.duracion > 0 && (
          <span className="absolute bottom-2.5 right-2.5 bg-black/65 text-white text-[11.5px] font-bold rounded-md px-1.5 py-0.5">
            {reloj(reel.duracion)}
          </span>
        )}
      </div>

      {reel.titulo && (
        <h4 className="font-display font-extrabold text-[14.5px] mt-3.5 leading-snug">{reel.titulo}</h4>
      )}
      {reel.descripcion && (
        <p className="text-sub text-[13px] leading-snug mt-1.5 line-clamp-3">{reel.descripcion}</p>
      )}
      {reel.publicadoAt && (
        <p className="text-hint text-[12.5px] mt-2.5">{fechaCorta(reel.publicadoAt.slice(0, 10))}</p>
      )}

      {reel.url && (
        <a href={reel.url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-accent font-bold text-[13.5px] mt-3 hover:underline">
          Ver publicación ↗
        </a>
      )}

      <Enlace reel={reel} />
    </section>
  );
}

// Pegar el enlace es el único paso manual: solo ella sabe cuál de sus reels
// es el de esta campaña, y por eso no se adivina por fecha.
function Enlace({ reel }: { reel: Reel }) {
  const [abierto, setAbierto] = useState(!reel.url);
  const [valor, setValor] = useState(reel.url ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function guardar() {
    setOcupado(true);
    setError("");
    const r = await guardarEnlaceReel(reel.colaboracionId, valor);
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    setAbierto(false);
    router.refresh();
  }

  async function actualizar() {
    setOcupado(true);
    setError("");
    const r = await sincronizarReel(reel.colaboracionId);
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    router.refresh();
  }

  if (!abierto) {
    return (
      <div className="mt-4 pt-3.5 border-t border-border flex gap-2 flex-wrap">
        <button onClick={() => setAbierto(true)}
          className="text-[12.5px] font-bold text-sub hover:text-accent transition">
          Cambiar enlace
        </button>
        <span className="text-hint">·</span>
        <button onClick={actualizar} disabled={ocupado}
          className="text-[12.5px] font-bold text-accent hover:underline disabled:opacity-60">
          {ocupado ? "Actualizando…" : "Actualizar métricas"}
        </button>
        {error && <p className="text-[12px] text-pink bg-pink-soft rounded-lg px-2.5 py-2 mt-1 w-full leading-snug">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-3.5 border-t border-border">
      <label className="block text-[13px] font-bold">Enlace de tu publicación</label>
      <p className="text-hint text-[12px] leading-snug mt-0.5">
        Pega el enlace del reel o post que subiste para esta campaña.
      </p>
      <input value={valor} onChange={(e) => setValor(e.target.value)}
        placeholder="https://www.instagram.com/reel/…"
        className="w-full bg-bg border border-border focus:border-accent rounded-xl px-3 py-2.5 text-[13px] outline-none mt-2" />
      {error && <p className="text-[12px] text-pink bg-pink-soft rounded-lg px-2.5 py-2 mt-2 leading-snug">{error}</p>}
      <div className="flex gap-2 mt-2.5">
        <button onClick={guardar} disabled={ocupado}
          className="bg-accent text-white rounded-xl px-4 py-2 text-[12.5px] font-bold hover:brightness-110 transition disabled:opacity-60">
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
        {reel.url && (
          <button onClick={() => { setAbierto(false); setValor(reel.url ?? ""); }} disabled={ocupado}
            className="rounded-xl px-4 py-2 text-[12.5px] font-bold text-sub hover:bg-bg transition">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ————————————————— Los números —————————————————

function Panel({ reel }: { reel: Reel }) {
  const m = reel.metricas;

  return (
    <section className="bg-surface border border-border rounded-3xl p-4 sm:p-6 shadow-sm">
      <h3 className="font-display font-extrabold text-[19px]">Métricas de tu publicación</h3>
      <p className="text-sub text-[13.5px] mt-1 leading-snug">
        {reel.contraPromedio
          ? "Rendimiento de tu reel en comparación con el promedio de la campaña."
          : "Cómo le fue a tu contenido en esta campaña."}
      </p>

      {!m ? (
        <div className="bg-bg border border-dashed border-border rounded-2xl p-8 text-center mt-5">
          <p className="font-display font-extrabold text-[15px]">Todavía no tenemos los números</p>
          <p className="text-sub text-[13px] mt-1.5 leading-snug max-w-sm mx-auto">
            {reel.url
              ? "Conecta tu red social en tu perfil y toca «Actualizar métricas». Los leemos de tu propia cuenta, no los escribimos a mano."
              : "Pega el enlace de tu publicación aquí al lado y los buscamos en tu cuenta conectada."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
            {TILES.map((t) => (
              <Tile key={t.k} t={t} valor={m[t.k]} contra={reel.contraPromedio?.[t.k] ?? null} />
            ))}
          </div>
          {reel.leidasAt && (
            <p className="text-hint text-[12px] mt-4">
              Leído de tu cuenta el {fechaCorta(reel.leidasAt.slice(0, 10))}.
              {!reel.contraPromedio && " Todavía no hay con quién compararte en esta campaña."}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Tile({ t, valor, contra }: {
  t: (typeof TILES)[number]; valor: number | null; contra: number | null;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <span className={`w-10 h-10 rounded-xl grid place-items-center ${t.tono}`}>{t.icono}</span>
      <div className="text-sub text-[13.5px] font-semibold mt-3">{t.txt}</div>
      <div className="font-display text-[26px] font-extrabold leading-tight mt-0.5">
        {valor == null ? "—" : t.k === "engagement" ? `${valor}%` : miles(valor)}
      </div>
      {contra != null && (
        <>
          <div className={`text-[13px] font-bold mt-1.5 ${contra >= 0 ? "text-green" : "text-pink"}`}>
            {contra >= 0 ? "↑" : "↓"} {contra >= 0 ? "+" : ""}{contra}%
          </div>
          <div className="text-hint text-[11.5px] leading-snug">vs. promedio de campaña</div>
        </>
      )}
    </div>
  );
}

function miles(n: number): string {
  return n.toLocaleString("es-MX");
}

function reloj(seg: number): string {
  const m = Math.floor(seg / 60);
  return `${m}:${String(seg % 60).padStart(2, "0")}`;
}

const ICO = {
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round",
} as const;

function IcoPlay() { return <svg {...ICO}><path d="M8 5.5v13l11-6.5z" /></svg>; }
function IcoPlayGrande() { return <svg {...ICO} width="26" height="26" fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>; }
function IcoCorazon() { return <svg {...ICO}><path d="M12 20s-7-4.6-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.4 12 20 12 20z" /></svg>; }
function IcoGlobo() { return <svg {...ICO}><path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4.5 20l1.3-4.4A7.5 7.5 0 1 1 20 12z" /></svg>; }
function IcoAvion() { return <svg {...ICO}><path d="m21 3-9.5 18-2.3-7.2L2 11.5z" /><path d="m21 3-11.8 10.8" /></svg>; }
function IcoSubida() { return <svg {...ICO}><path d="m3 16 5-5 4 3.5L21 6" /><path d="M16 6h5v5" /></svg>; }
