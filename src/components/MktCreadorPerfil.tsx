"use client";

import { useState } from "react";
import Link from "next/link";
import { fechaCorta } from "@/lib/formato-campanias";
import { marcarDestacado } from "@/lib/mkt-admin";
import type { CreadorFichaEquipo } from "@/lib/mkt-admin";

// La ficha de un creador vista por el equipo: lo que necesita saber antes de
// proponérselo a una marca, y con qué campañas ya ha trabajado.

const ETAPAS: Record<string, [string, string]> = {
  seleccionada: ["Seleccionada", "bg-green/10 text-green"],
  postulada: ["En revisión", "bg-accent-soft text-accent"],
  descartada: ["No quedó", "bg-bg text-sub border border-border"],
};

export function MktCreadorPerfil({ c, volverHref }: {
  c: CreadorFichaEquipo;
  volverHref: string;
}) {
  const [destacado, setDestacado] = useState(c.destacado);
  const [error, setError] = useState("");

  async function alternar() {
    setDestacado((v) => !v);
    const r = await marcarDestacado(c.id, !destacado);
    if ("error" in r) { setError(r.error); setDestacado(c.destacado); }
  }

  return (
    <>
      <Link href={volverHref}
        className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-4 py-2 text-[13.5px] font-bold text-accent hover:bg-accent-soft transition">
        ← Volver
      </Link>

      <header className="bg-surface border border-border rounded-3xl p-5 sm:p-6 mt-4 flex items-start gap-4 flex-wrap">
        {c.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.avatar} alt="" className="w-[86px] h-[86px] rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-[86px] h-[86px] rounded-full bg-accent-soft text-accent grid place-items-center text-xl font-extrabold shrink-0">
            {c.nombre.slice(0, 2).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold">{c.nombre}</h1>
          {c.usuario && <p className="text-[13.5px] text-hint">@{c.usuario}</p>}
          {c.titular && <p className="text-[13.5px] text-sub mt-1">{c.titular}</p>}
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            {c.nicho && (
              <span className="text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">{c.nicho}</span>
            )}
            {c.pro && <span className="text-[11.5px] font-bold text-green bg-green/10 rounded-full px-2.5 py-1">Pro</span>}
            {(c.ciudad || c.pais) && (
              <span className="text-[11.5px] text-sub bg-bg border border-border rounded-full px-2.5 py-1">
                📍 {[c.ciudad, c.pais].filter(Boolean).join(", ")}
              </span>
            )}
            {c.seMeUnio && (
              <span className="text-[11.5px] text-sub bg-bg border border-border rounded-full px-2.5 py-1">
                Se unió en {fechaCorta(c.seMeUnio.slice(0, 10))}
              </span>
            )}
          </div>
        </div>

        <button onClick={alternar}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-[12.5px] font-bold border transition ${
            destacado
              ? "bg-accent border-accent text-white"
              : "border-border text-sub hover:border-accent/50 hover:text-accent"}`}>
          ★ {destacado ? "Destacado" : "Destacar"}
        </button>
      </header>

      {error && <p className="text-[13px] text-pink bg-pink-soft rounded-xl px-3.5 py-3 mt-3">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-3 mt-3 items-start">
        <div className="space-y-3">
          {c.bio && (
            <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <h2 className="font-display font-extrabold text-[15.5px]">Sobre mí</h2>
              <p className="text-[13.5px] text-sub leading-relaxed mt-2 whitespace-pre-wrap">{c.bio}</p>
            </section>
          )}

          <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
            <h2 className="font-display font-extrabold text-[15.5px]">Métricas</h2>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              <Num n={abreviar(c.seguidores)} t="Seguidores" />
              <Num n={c.engagement != null ? `${c.engagement}%` : "—"} t="Engagement" />
              <Num n={String(c.campanias)} t="Campañas" />
            </div>
            {c.redes.length > 0 && (
              <ul className="mt-4 divide-y divide-border">
                {c.redes.map((r) => {
                  const u = c.usuarios.find((x) => x.red === r.red);
                  return (
                    <li key={r.red} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                      <span className="capitalize font-semibold">{r.red}</span>
                      {u?.usuario && <span className="text-hint truncate flex-1 text-left">@{u.usuario}</span>}
                      <b>{abreviar(r.seguidores)}</b>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
            <h2 className="font-display font-extrabold text-[15.5px]">Campañas</h2>
            {c.historial.length === 0 ? (
              <p className="text-[13px] text-sub mt-2.5">Todavía no se ha postulado a ninguna.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {c.historial.map((h, i) => {
                  const [txt, clase] = ETAPAS[h.etapa] ?? ETAPAS.postulada;
                  return (
                    <li key={`${h.campaniaId}-${i}`} className="flex items-center gap-3 py-2.5 flex-wrap">
                      <Link href={`/app/admin/marketplace/campanias/${h.campaniaId}`}
                        className="min-w-0 flex-1 hover:text-accent transition">
                        <span className="block text-[13.5px] font-bold truncate">{h.campania}</span>
                        <span className="block text-[12px] text-hint truncate">{h.marca}</span>
                      </Link>
                      <span className="text-[12px] text-sub whitespace-nowrap">{fechaCorta(h.fecha)}</span>
                      <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 shrink-0 ${clase}`}>{txt}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <h2 className="font-display font-extrabold text-[15.5px]">Contacto</h2>
          <p className="text-[12px] text-hint mt-2.5">Correo de su cuenta</p>
          <p className="text-[13.5px] font-semibold break-all">{c.correo ?? "—"}</p>
          <p className="text-[12px] text-sub leading-snug mt-4 pt-3 border-t border-border">
            Este correo es del equipo, no se le comparte a las marcas. Si una marca quiere
            contactarla, el equipo hace de puente.
          </p>
        </aside>
      </div>
    </>
  );
}

function Num({ n, t }: { n: string; t: string }) {
  return (
    <div className="bg-bg rounded-xl py-3">
      <div className="font-display text-lg font-extrabold">{n}</div>
      <div className="text-[11.5px] text-hint">{t}</div>
    </div>
  );
}

function abreviar(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}
