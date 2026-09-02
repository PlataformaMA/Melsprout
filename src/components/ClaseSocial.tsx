"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCalificacion, calificarClase, getComentariosClase, comentarClase,
  type ComentarioClase,
} from "@/lib/clase-social-actions";

function hace(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

// Debajo de la clase: qué te pareció y qué dice la comunidad.
export function ClaseSocial({ claseId }: { claseId: string }) {
  const [cal, setCal] = useState<{ mia: number | null; promedio: number | null; total: number } | null>(null);
  const [hover, setHover] = useState(0);
  const [coments, setComents] = useState<ComentarioClase[] | null>(null);
  const [texto, setTexto] = useState("");
  const [responde, setResponde] = useState<ComentarioClase | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    getCalificacion(claseId).then(setCal);
    getComentariosClase(claseId).then(setComents);
  }, [claseId]);

  async function calificar(n: number) {
    setCal((c) => (c ? { ...c, mia: n } : c));
    await calificarClase(claseId, n);
    setCal(await getCalificacion(claseId));
  }

  async function publicar() {
    if (texto.trim().length < 2) return;
    setEnviando(true);
    const r = await comentarClase(claseId, texto, responde?.id);
    setEnviando(false);
    if ("error" in r) { alert(r.error); return; }
    setTexto(""); setResponde(null);
    setComents(await getComentariosClase(claseId));
  }

  const raiz = (coments || []).filter((c) => !c.respondeA);
  const respuestasDe = (id: string) => (coments || []).filter((c) => c.respondeA === id);

  return (
    <div className="space-y-6">
      {/* Calificación */}
      <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="font-display font-extrabold text-[16px]">¿Qué te pareció esta clase?</h2>
        <div className="flex flex-wrap items-center gap-3 mt-2.5">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => calificar(n)} onMouseEnter={() => setHover(n)}
                aria-label={`${n} de 5 estrellas`}
                className={`text-2xl leading-none transition ${
                  (hover || cal?.mia || 0) >= n ? "text-[#F5B301]" : "text-border"
                }`}>★</button>
            ))}
          </div>
          {cal?.mia && <span className="text-[13px] text-green font-bold">¡Gracias por calificar!</span>}
          {cal?.promedio != null && (
            <span className="text-[12.5px] text-sub ml-auto">
              Promedio <b className="text-text">{cal.promedio}</b> · {cal.total} {cal.total === 1 ? "voto" : "votos"}
            </span>
          )}
        </div>
      </section>

      {/* Comentarios */}
      <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="font-display font-extrabold text-[16px] mb-3">
          Comentarios {coments ? `(${coments.length})` : ""}
        </h2>

        {responde && (
          <div className="flex items-center gap-2 text-[12.5px] text-sub bg-bg rounded-xl px-3 py-2 mb-2">
            Respondiendo a <b className="text-text">{responde.autorNombre}</b>
            <button onClick={() => setResponde(null)} className="ml-auto text-hint hover:text-pink">×</button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <input value={texto} onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") publicar(); }}
            placeholder="Escribe tu comentario…" maxLength={800}
            className="flex-1 bg-bg border border-border rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-accent" />
          <button onClick={publicar} disabled={enviando || texto.trim().length < 2}
            className="bg-accent text-white rounded-full px-4 py-2.5 text-[13px] font-bold disabled:opacity-50 hover:brightness-110 transition shrink-0">
            {enviando ? "…" : "Enviar"}
          </button>
        </div>

        {coments === null ? (
          <p className="text-[13px] text-hint">Cargando comentarios…</p>
        ) : raiz.length === 0 ? (
          <p className="text-[13px] text-hint">Todavía nadie comenta esta clase. Estrena tú 💜</p>
        ) : (
          <div className="space-y-4">
            {raiz.map((c) => (
              <div key={c.id}>
                <Comentario c={c} onResponder={() => setResponde(c)} />
                {respuestasDe(c.id).length > 0 && (
                  <div className="ml-11 mt-3 space-y-3 border-l border-border pl-3">
                    {respuestasDe(c.id).map((r) => (
                      <Comentario key={r.id} c={r} onResponder={() => setResponde(c)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Comentario({ c, onResponder }: { c: ComentarioClase; onResponder: () => void }) {
  return (
    <div className="flex items-start gap-2.5">
      <Link href={`/app/creador/${c.autorId}`} className="shrink-0">
        {c.autorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.autorAvatar} alt={c.autorNombre} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold">
            {c.autorNombre.slice(0, 2).toUpperCase()}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="bg-bg rounded-2xl px-3.5 py-2.5">
          <Link href={`/app/creador/${c.autorId}`} className="font-bold text-[13px] hover:text-accent transition">
            {c.autorNombre}
          </Link>
          <p className="text-[13.5px] text-text whitespace-pre-wrap leading-relaxed mt-0.5">{c.texto}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 ml-1 text-[12px]">
          <span className="text-hint">{hace(c.fecha)}</span>
          <button onClick={onResponder} className="font-semibold text-sub hover:text-accent transition">Responder</button>
        </div>
      </div>
    </div>
  );
}
