"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { MarcaShell } from "@/components/MarcaShell";
import { buscarCreadores, solicitarCreadores } from "@/lib/marca-creadores";
import type { MiMarca } from "@/lib/marca-cuenta";
import type { CreadorFicha } from "@/lib/marca-creadores";

// El Marketplace de la marca: aquí busca creadoras, no campañas.
//
// Selecciona varias y se las manda al equipo, que hace de puente. La marca no
// ve correos ni teléfonos: solo lo que la creadora ya muestra en su perfil.

export function MarcaMarketplace({
  marca, nichos, inicial,
}: {
  marca: MiMarca; nichos: string[]; inicial: CreadorFicha[];
}) {
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<string[]>([]);
  const [gente, setGente] = useState<CreadorFicha[]>(inicial);
  const [cargando, setCargando] = useState(false);
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [filtros, setFiltros] = useState(false);
  const [enviar, setEnviar] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    const t = setTimeout(async () => {
      const r = await buscarCreadores(texto, filtro);
      if (vivo) { setGente(r); setCargando(false); }
    }, 350);
    return () => { vivo = false; clearTimeout(t); };
  }, [texto, filtro]);

  const alternar = (id: string) =>
    setElegidos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  return (
    <MarcaShell marca={marca} activo="marketplace">
      <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Marketplace</h1>
      <p className="text-sub text-[13.5px] mt-1">
        Revisa los creadores con los que puedes colaborar
      </p>

      <div className="flex flex-wrap items-center gap-2.5 mt-5 mb-5">
        <label className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2.5 flex-1 min-w-[200px] max-w-[380px]">
          <Lupa />
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar"
            className="flex-1 min-w-0 bg-transparent text-[14px] outline-none" />
        </label>
        <button onClick={() => setFiltros(true)}
          className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] font-semibold hover:border-accent/40 transition">
          Filtrar
          {filtro.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-extrabold grid place-items-center">
              {filtro.length}
            </span>
          )}
        </button>
      </div>

      {cargando ? (
        <p className="text-[14px] text-sub py-10 text-center">Buscando…</p>
      ) : gente.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
          <p className="text-[13.5px] text-sub">Ninguna creadora con esos criterios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
          {gente.map((c) => (
            <Ficha key={c.id} c={c} elegido={elegidos.has(c.id)} alternar={() => alternar(c.id)} />
          ))}
        </div>
      )}

      {/* Barra pegada abajo con lo seleccionado */}
      {elegidos.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
          <button onClick={() => setEnviar(true)}
            className="flex items-center gap-2.5 bg-accent text-white rounded-full pl-5 pr-4 py-3 text-[14px] font-bold shadow-xl shadow-accent/30 hover:brightness-110 active:scale-95 transition">
            📩 Solicitar creadores al equipo
            <span className="bg-white/25 rounded-full px-2.5 py-0.5 text-[12.5px]">{elegidos.size}</span>
          </button>
        </div>
      )}

      {filtros && (
        <ModalFiltros nichos={nichos} valor={filtro}
          onAplicar={(f) => { setFiltro(f); setFiltros(false); }}
          onCerrar={() => setFiltros(false)} />
      )}

      {enviar && (
        <ModalSolicitar ids={[...elegidos]}
          nombres={gente.filter((g) => elegidos.has(g.id)).map((g) => g.nombre)}
          onListo={() => { setEnviar(false); setElegidos(new Set()); }}
          onCerrar={() => setEnviar(false)} />
      )}
    </MarcaShell>
  );
}

function Ficha({ c, elegido, alternar }: { c: CreadorFicha; elegido: boolean; alternar: () => void }) {
  return (
    <article className={`bg-surface border rounded-2xl p-4 shadow-sm transition ${
      elegido ? "border-accent" : "border-border"}`}>
      <div className="flex items-start gap-3">
        {c.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.avatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-14 h-14 rounded-full bg-accent-soft text-accent grid place-items-center font-extrabold shrink-0">
            {c.nombre.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display font-extrabold text-[14.5px] leading-tight">{c.nombre}</div>
          {c.titular && <p className="text-[12px] text-sub leading-snug mt-0.5 line-clamp-2">{c.titular}</p>}
        </div>
        <input type="checkbox" checked={elegido} onChange={alternar}
          aria-label={`Seleccionar a ${c.nombre}`}
          className="w-5 h-5 accent-accent cursor-pointer shrink-0" />
      </div>

      {c.nichos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {c.nichos.map((n) => (
            <span key={n} className="text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2 py-0.5">{n}</span>
          ))}
        </div>
      )}

      {c.redes.length > 0 && (
        <div className="space-y-1 mt-3">
          {c.redes.slice(0, 3).map((r) => (
            <div key={r.red} className="flex items-center justify-between text-[12px]">
              <span className="text-sub capitalize">{r.red}</span>
              <span className="font-bold">{corto(r.seguidores)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-center">
        <Dato n={corto(c.seguidores)} txt="Seguidores" />
        <Dato n={c.engagement != null ? `${c.engagement}%` : "—"} txt="Engagement" />
        <Dato n={String(c.campanias)} txt="Campañas" />
      </div>

      <Link href={`/app/marca/creadores/${c.id}`}
        className="block text-center mt-3 border border-border rounded-xl py-2 text-[12.5px] font-bold text-sub hover:border-accent/40 transition">
        Ver perfil
      </Link>
    </article>
  );
}

function Dato({ n, txt }: { n: string; txt: string }) {
  return (
    <div>
      <div className="font-display font-extrabold text-[14px]">{n}</div>
      <div className="text-[10.5px] text-hint">{txt}</div>
    </div>
  );
}

function ModalFiltros({ nichos, valor, onAplicar, onCerrar }: {
  nichos: string[]; valor: string[]; onAplicar: (v: string[]) => void; onCerrar: () => void;
}) {
  const [f, setF] = useState(valor);
  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[380px] bg-surface rounded-3xl shadow-2xl my-4 p-5 max-h-[86vh] flex flex-col">
        <h2 className="font-display font-extrabold text-[17px] mb-3">Filtros</h2>
        <div className="overflow-y-auto flex-1">
          <h3 className="font-display font-extrabold text-[13.5px] mb-2">Nicho</h3>
          {nichos.map((n) => (
            <label key={n} className="flex items-center gap-2.5 text-[13.5px] text-sub cursor-pointer py-1">
              <input type="checkbox" checked={f.includes(n)}
                onChange={() => setF(f.includes(n) ? f.filter((x) => x !== n) : [...f, n])}
                className="w-4 h-4 accent-accent cursor-pointer" />
              {n}
            </label>
          ))}
        </div>
        <div className="flex gap-3 pt-4 mt-3 border-t border-border">
          <button onClick={() => setF([])} className="text-[13px] font-bold text-sub hover:text-text transition">
            Limpiar
          </button>
          <button onClick={() => onAplicar(f)}
            className="flex-1 bg-accent text-white font-bold text-[15px] rounded-xl py-3 hover:brightness-110 transition">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSolicitar({ ids, nombres, onListo, onCerrar }: {
  ids: string[]; nombres: string[]; onListo: () => void; onCerrar: () => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function enviar() {
    setError("");
    startTransition(async () => {
      const r = await solicitarCreadores(ids, mensaje);
      if ("error" in r) { setError(r.error); return; }
      setListo(true);
    });
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[420px] bg-surface rounded-3xl shadow-2xl p-6">
        {listo ? (
          <div className="text-center">
            <span className="w-14 h-14 rounded-full bg-green/10 grid place-items-center text-2xl mx-auto">✓</span>
            <h2 className="font-display font-extrabold text-[18px] mt-3">Lista enviada al equipo</h2>
            <p className="text-[13px] text-sub leading-snug mt-2">
              El equipo de Melsprout revisa tu selección y te contacta para seguir con la colaboración.
            </p>
            <button onClick={onListo}
              className="w-full mt-5 bg-accent text-white rounded-xl py-3 text-[14px] font-bold hover:brightness-110 transition">
              Entendido
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-display font-extrabold text-[18px]">
              Solicitar {ids.length} {ids.length === 1 ? "creadora" : "creadoras"}
            </h2>
            <p className="text-[13px] text-sub leading-snug mt-1.5">
              El equipo de Melsprout hace el puente: revisa tu selección y te contacta.
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3 max-h-[110px] overflow-y-auto">
              {nombres.map((n) => (
                <span key={n} className="text-[12px] bg-bg border border-border rounded-full px-2.5 py-1">{n}</span>
              ))}
            </div>

            <label className="block mt-4">
              <span className="text-[13px] font-bold">Cuéntale al equipo qué buscas <span className="text-hint font-semibold">(opcional)</span></span>
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} maxLength={500}
                placeholder="Ej. Para la campaña de verano, nos interesa su estilo en video corto."
                className="w-full mt-1.5 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-accent resize-none" />
            </label>

            {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-3">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={onCerrar}
                className="flex-1 border border-border text-sub rounded-xl py-2.5 text-[14px] font-bold hover:bg-bg transition">
                Cancelar
              </button>
              <button onClick={enviar} disabled={pendiente}
                className="flex-1 bg-accent text-white rounded-xl py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-60">
                {pendiente ? "Enviando…" : "Enviar al equipo"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function corto(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

function Lupa() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-hint" aria-hidden>
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}
