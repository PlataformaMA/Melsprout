"use client";

import Link from "next/link";
import { MarcaShell } from "@/components/MarcaShell";
import type { MiMarca } from "@/lib/marca-cuenta";
import type { CreadorFicha } from "@/lib/marca-creadores";

// El perfil de una creadora, visto por una marca.
//
// Solo lo que ella ya muestra en la comunidad. Para contactarla, la marca
// la agrega a su selección y el equipo hace el puente.
export function MarcaCreadorPerfil({
  marca, creador, bio,
}: {
  marca: MiMarca; creador: CreadorFicha; bio: string | null;
}) {
  return (
    <MarcaShell marca={marca} activo="marketplace">
      <Link href="/app/marca/marketplace" className="text-[13.5px] font-bold text-accent">← Volver</Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start mt-3">
        <div className="min-w-0 space-y-4">
          <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              {creador.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creador.avatar} alt="" className="w-20 h-20 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-20 h-20 rounded-full bg-accent-soft text-accent grid place-items-center text-[20px] font-extrabold shrink-0">
                  {creador.nombre.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl font-extrabold">{creador.nombre}</h1>
                {creador.usuario && <p className="text-[13px] text-sub">@{creador.usuario}</p>}
                {creador.titular && (
                  <span className="inline-block text-[11.5px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-1 mt-1.5">
                    {creador.titular}
                  </span>
                )}
              </div>
              {[creador.ciudad, creador.pais].filter(Boolean).length > 0 && (
                <span className="shrink-0 text-[12px] text-sub">
                  {[creador.ciudad, creador.pais].filter(Boolean).join(", ")}
                </span>
              )}
            </div>

            {bio && (
              <>
                <h2 className="font-display font-extrabold text-[14px] mt-5">Sobre mí</h2>
                <p className="text-[13.5px] leading-relaxed mt-1.5 whitespace-pre-line">{bio}</p>
              </>
            )}

            {creador.nichos.length > 0 && (
              <>
                <h2 className="font-display font-extrabold text-[14px] mt-5">Nichos</h2>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {creador.nichos.map((n) => (
                    <span key={n} className="text-[12px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-1">{n}</span>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <h2 className="font-display font-extrabold text-[14px]">Métricas principales</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <Metrica icono="👥" n={corto(creador.seguidores)} t="Seguidores totales" />
              <Metrica icono="📣" n={String(creador.campanias)} t="Campañas" />
              <Metrica icono="❤️" n={creador.engagement != null ? `${creador.engagement}%` : "—"} t="Engagement" />
            </div>

            {creador.redes.length > 0 ? (
              <div className="mt-4 space-y-2">
                {creador.redes.map((r) => (
                  <div key={r.red} className="flex items-center justify-between bg-bg rounded-xl px-3.5 py-2.5">
                    <span className="text-[13px] font-semibold capitalize">{r.red}</span>
                    <span className="text-[12.5px] text-sub">
                      {r.usuario ? `@${r.usuario} · ` : ""}<b className="text-text">{corto(r.seguidores)}</b>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-hint mt-3 leading-snug">
                Esta creadora todavía no conecta sus redes, así que no hay métricas que mostrar.
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-5">
          <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-display font-extrabold text-[14px]">¿Quieres trabajar con ella?</h3>
            <p className="text-[12.5px] text-sub leading-snug mt-1.5">
              Agrégala a tu selección en el Marketplace y mándasela al equipo de Melsprout:
              ellos hacen el puente y te contactan.
            </p>
            <Link href="/app/marca/marketplace"
              className="block text-center mt-4 bg-accent text-white rounded-xl py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
              Ir al Marketplace
            </Link>
          </section>
        </aside>
      </div>
    </MarcaShell>
  );
}

function Metrica({ icono, n, t }: { icono: string; n: string; t: string }) {
  return (
    <div className="bg-bg rounded-xl p-3.5">
      <div className="text-[15px]">{icono}</div>
      <div className="font-display font-extrabold text-[19px] mt-1">{n}</div>
      <div className="text-[11px] text-hint">{t}</div>
    </div>
  );
}

function corto(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}
