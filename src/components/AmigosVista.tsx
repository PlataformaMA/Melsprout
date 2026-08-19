"use client";

import { useState } from "react";
import Link from "next/link";
import type { Amigo } from "@/lib/chat-actions";
import type { ActividadAmigo, PersonaLista } from "@/lib/amigos-actions";
import type { Solicitud } from "@/lib/seguidores-actions";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { InvitarCard } from "@/components/InvitarCard";
import { SolicitudesLista } from "@/components/SolicitudesLista";

export function AmigosVista({
  yo, amigos, solicitudes, actividad, seguidores, seguidos,
}: {
  yo: { id: string; nombre: string; avatar: string | null; racha: number; gemas: number };
  amigos: Amigo[];
  solicitudes: Solicitud[];
  actividad: ActividadAmigo[];
  seguidores: PersonaLista[];
  seguidos: PersonaLista[];
}) {
  const [verTodos, setVerTodos] = useState(false);
  const [tab, setTab] = useState<"Seguidores" | "Seguidos">("Seguidores");
  const lista = tab === "Seguidores" ? seguidores : seguidos;

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="amigos" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          {/* Barra superior */}
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {yo.racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {yo.gemas}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={yo.avatar} nombre={yo.nombre} />
          </header>

          <h1 className="font-display text-2xl font-extrabold mb-4">Amigos</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0">
              {/* Fila de amigos + botón para verlos todos */}
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                {amigos.slice(0, 8).map((a) => (
                  <Link key={a.id} href={`/app/amigos/${a.id}`} className="shrink-0 w-[74px] text-center group">
                    <span className="relative block">
                      {a.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.avatar} alt={a.nombre} className="w-[68px] h-[68px] rounded-full object-cover mx-auto" />
                      ) : (
                        <span className="w-[68px] h-[68px] rounded-full bg-accent-soft text-accent grid place-items-center font-display font-extrabold text-lg mx-auto">
                          {a.nombre.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      {a.sinLeer > 0 && (
                        <span className="absolute top-0 right-1 w-5 h-5 rounded-full bg-accent text-white text-[11px] font-extrabold grid place-items-center ring-2 ring-bg">
                          {a.sinLeer > 9 ? "9+" : a.sinLeer}
                        </span>
                      )}
                      {a.enLinea && <span className="absolute bottom-0 right-2 w-3.5 h-3.5 rounded-full bg-green ring-2 ring-bg" />}
                    </span>
                    <span className="block text-[12px] font-bold mt-1.5 truncate group-hover:text-accent transition">
                      {a.nombre.split(" ")[0]}
                    </span>
                  </Link>
                ))}

                <button onClick={() => setVerTodos(true)}
                  className="shrink-0 w-[74px] text-center group" aria-label="Ver todos tus amigos">
                  <span className="w-[68px] h-[68px] rounded-full bg-[#E9EBEF] text-sub grid place-items-center text-3xl mx-auto group-hover:bg-accent-soft group-hover:text-accent transition">
                    +
                  </span>
                  <span className="block text-[12px] font-bold mt-1.5 text-sub">Ver todos</span>
                </button>
              </div>

              <SolicitudesLista inicial={solicitudes} />

              <h2 className="font-display text-xl font-extrabold mt-6 mb-3">Actividad</h2>
              {actividad.length === 0 ? (
                <div className="bg-surface border border-border rounded-3xl p-8 text-center shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/octi.png" alt="" className="w-20 mx-auto" />
                  <h3 className="font-display font-extrabold mt-3">Todavía no hay actividad</h3>
                  <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
                    Cuando tus amigos completen clases, retos o hagan racha, lo vas a ver aquí para felicitarlos.
                  </p>
                  <Link href="/app/comunidad"
                    className="inline-block mt-4 bg-accent text-white rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
                    Explorar la comunidad
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {actividad.map((a) => (
                    <article key={a.id} className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link href={`/app/creador/${a.userId}`} className="shrink-0">
                          {a.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.avatar} alt={a.nombre} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="w-10 h-10 rounded-full bg-accent-soft text-accent grid place-items-center font-bold">
                              {a.nombre.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </Link>
                        <Link href={`/app/creador/${a.userId}`} className="font-display font-extrabold text-[15px] truncate hover:text-accent transition">
                          {a.nombre}
                        </Link>
                        <Link href={`/app/amigos/${a.userId}`}
                          className="ml-auto shrink-0 bg-accent text-white rounded-full px-4 py-1.5 text-[13px] font-bold hover:brightness-110 transition">
                          Felicitar
                        </Link>
                      </div>

                      <div className="flex items-end gap-3 mt-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] leading-snug">{a.texto}</p>
                          <p className="text-[12.5px] text-hint mt-2">{a.hace}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-2xl">{a.icono}</span>
                          {a.valor && <span className="font-display text-3xl font-extrabold text-accent">{a.valor}</span>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Columna derecha */}
            <aside className="space-y-5 lg:sticky lg:top-5">
              <section className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="flex border-b border-border">
                  {(["Seguidores", "Seguidos"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-3 text-[14px] font-bold -mb-px border-b-2 transition ${
                        tab === t ? "border-accent text-text" : "border-transparent text-hint hover:text-sub"
                      }`}>{t}</button>
                  ))}
                </div>
                {lista.length === 0 ? (
                  <p className="text-[13px] text-hint px-5 py-6 text-center">
                    {tab === "Seguidores" ? "Todavía no te sigue nadie." : "Todavía no sigues a nadie."}
                  </p>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
                    {lista.map((p) => (
                      <Link key={p.id} href={`/app/creador/${p.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-bg transition">
                        {p.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar} alt={p.nombre} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-10 h-10 rounded-full bg-accent-soft text-accent grid place-items-center font-bold shrink-0">
                            {p.nombre.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className="font-bold text-[14px] truncate">{p.nombre}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <InvitarCard userId={yo.id} />
            </aside>
          </div>
        </div>
      </main>

      {/* Modal: todos tus amigos, con su racha y sus gemas */}
      {verTodos && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVerTodos(false)} />
          <div className="relative w-full max-w-[560px] max-h-[80vh] overflow-y-auto bg-surface rounded-3xl shadow-2xl p-5 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-extrabold">Todos tus amigos</h2>
              <button onClick={() => setVerTodos(false)} aria-label="Cerrar"
                className="w-8 h-8 grid place-items-center rounded-lg text-hint hover:bg-bg transition">✕</button>
            </div>

            {amigos.length === 0 ? (
              <p className="text-[13.5px] text-sub py-6 text-center">
                Todavía no tienes amigos. Sigue a alguien en la comunidad y espera a que acepte.
              </p>
            ) : (
              <div className="space-y-2">
                {amigos.map((a) => (
                  <Link key={a.id} href={`/app/amigos/${a.id}`}
                    className="flex items-center gap-3 rounded-2xl p-2 hover:bg-bg transition">
                    {a.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatar} alt={a.nombre} className="w-12 h-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-12 h-12 rounded-full bg-accent-soft text-accent grid place-items-center font-bold shrink-0">
                        {a.nombre.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="flex-1 min-w-0 font-display font-extrabold text-[15px] truncate">{a.nombre}</span>
                    <span className="shrink-0 flex items-center gap-4 bg-bg rounded-xl px-3 py-2">
                      <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {a.racha}</span>
                      <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {a.gemas}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
