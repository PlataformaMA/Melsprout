"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MarcaShell } from "@/components/MarcaShell";
import { crearBorrador } from "@/lib/marca-campanias";
import type { MiMarca } from "@/lib/marca-cuenta";
import type { CampaniaMarca, EstadoCampania } from "@/lib/marca-campanias";

// Mis campañas: activas, cerradas y borradores.

const ESTADOS: Record<EstadoCampania, { texto: string; clase: string }> = {
  borrador: { texto: "Borrador", clase: "bg-bg text-hint border border-border" },
  pendiente: { texto: "En revisión", clase: "bg-amber-100 text-amber-700" },
  aprobada: { texto: "Activa", clase: "bg-green/10 text-green" },
  rechazada: { texto: "Necesita cambios", clase: "bg-pink-soft text-pink" },
  cerrada: { texto: "Cerrada", clase: "bg-bg text-hint border border-border" },
};

export function MarcaCampanias({ marca, campanias }: { marca: MiMarca; campanias: CampaniaMarca[] }) {
  const [tab, setTab] = useState<"activas" | "cerradas" | "borradores">("activas");
  const [busca, setBusca] = useState("");
  const [creando, setCreando] = useState(false);

  const q = busca.trim().toLowerCase();
  const porTab = campanias.filter((c) => {
    if (q && !c.titulo.toLowerCase().includes(q)) return false;
    if (tab === "borradores") return c.estado === "borrador";
    if (tab === "cerradas") return c.estado === "cerrada";
    return c.estado === "pendiente" || c.estado === "aprobada" || c.estado === "rechazada";
  });

  return (
    <MarcaShell marca={marca} activo="campanias">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Mis campañas</h1>
          <p className="text-sub text-[13.5px] mt-1">
            Gestiona tus campañas, revisa candidatos, da seguimiento a entregables y consulta resultados.
          </p>
        </div>
        <button onClick={() => setCreando(true)}
          className="shrink-0 flex items-center gap-2 bg-accent text-white rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:brightness-110 active:scale-95 transition">
          + Crear nueva campaña
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mt-5">
        <label className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2.5 flex-1 min-w-[200px] max-w-[320px]">
          <Lupa />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar campañas…"
            className="flex-1 min-w-0 bg-transparent text-[14px] outline-none" />
        </label>
      </div>

      <div className="flex gap-6 border-b border-border mt-5 mb-5">
        {([["activas", "Activas"], ["cerradas", "Cerradas"], ["borradores", "Borradores"]] as const).map(([k, txt]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`pb-2.5 text-[14.5px] font-bold transition -mb-px border-b-2 ${
              tab === k ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
            }`}>
            {txt}
          </button>
        ))}
      </div>

      {porTab.length === 0 ? (
        <div className="bg-surface border border-border rounded-3xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-accent-soft grid place-items-center text-4xl mx-auto">📅</div>
          <h2 className="font-display font-extrabold text-[19px] mt-4">
            {tab === "borradores" ? "No tienes borradores"
              : tab === "cerradas" ? "No tienes campañas cerradas"
                : "Aún no tienes campañas activas"}
          </h2>
          <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
            Crea una nueva campaña para empezar a colaborar con creadores y darle visibilidad a tu marca.
          </p>
          <button onClick={() => setCreando(true)}
            className="mt-5 bg-accent text-white rounded-xl px-5 py-3 text-[14px] font-bold hover:brightness-110 transition">
            + Crear nueva campaña
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {porTab.map((c) => <Tarjeta key={c.id} c={c} />)}
        </div>
      )}

      {creando && <ModalCrear onCerrar={() => setCreando(false)} />}
    </MarcaShell>
  );
}

function Tarjeta({ c }: { c: CampaniaMarca }) {
  const e = ESTADOS[c.estado];
  return (
    <Link href={`/app/marca/campanias/${c.id}`}
      className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:border-accent/40 transition">
      <span className="relative block aspect-[16/9] bg-accent-soft">
        {c.imagenes[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.imagenes[0]} alt="" className="w-full h-full object-cover" />
        ) : null}
        <span className={`absolute top-2.5 left-2.5 text-[11px] font-bold rounded-full px-2.5 py-1 ${e.clase}`}>
          {e.texto}
        </span>
      </span>
      <span className="block p-4">
        <span className="block font-display font-extrabold text-[15px] leading-tight">{c.titulo}</span>
        {c.descripcion && (
          <span className="block text-[12.5px] text-sub leading-snug mt-1 line-clamp-2">{c.descripcion}</span>
        )}
        {c.tipos.length > 0 && (
          <span className="flex flex-wrap gap-1.5 mt-2.5">
            {c.tipos.map((t) => (
              <span key={t} className="text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2 py-0.5">
                {t}
              </span>
            ))}
          </span>
        )}
        <span className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
          <span className="text-[11.5px] text-hint">Creadores</span>
          <span className="font-display font-extrabold text-[14px]">
            {c.seleccionadas}{c.limitePostulaciones ? ` / ${c.limitePostulaciones}` : ""}
          </span>
        </span>
        {c.estado === "rechazada" && c.notaEquipo && (
          <span className="block text-[11.5px] text-pink bg-pink-soft rounded-lg px-2.5 py-2 mt-2.5 leading-snug">
            {c.notaEquipo}
          </span>
        )}
      </span>
    </Link>
  );
}

// El primer paso es solo el nombre, como en el diseño.
function ModalCrear({ onCerrar }: { onCerrar: () => void }) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();

  function crear() {
    setError("");
    startTransition(async () => {
      const r = await crearBorrador(nombre);
      if ("error" in r) { setError(r.error); return; }
      window.location.href = `/app/marca/campanias/${r.id}/editar`;
    });
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[400px] bg-surface rounded-3xl shadow-2xl p-6">
        <button type="button" onClick={onCerrar} aria-label="Cerrar"
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-full text-hint hover:bg-bg transition">
          ✕
        </button>
        <h2 className="font-display font-extrabold text-[19px]">Crear nueva campaña</h2>
        <p className="text-[13px] text-sub mt-1">Ingresa el nombre de tu campaña para comenzar.</p>

        <label className="block mt-4">
          <span className="text-[13px] font-bold">Nombre de la campaña</span>
          <input autoFocus value={nombre} maxLength={100}
            onChange={(e) => { setNombre(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") crear(); }}
            placeholder="Ej. Lanzamiento Verano 2026"
            className="w-full mt-1.5 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent" />
        </label>

        {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onCerrar}
            className="flex-1 border border-border text-sub rounded-xl py-2.5 text-[14px] font-bold hover:bg-bg transition">
            Cancelar
          </button>
          <button onClick={crear} disabled={pendiente || nombre.trim().length < 3}
            className="flex-1 bg-accent text-white rounded-xl py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {pendiente ? "Creando…" : "Crear campaña"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Lupa() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-hint" aria-hidden>
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}
