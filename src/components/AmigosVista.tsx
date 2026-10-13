"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import type { Amigo } from "@/lib/chat-actions";
import type { ActividadAmigo, PersonaLista, Encontrada } from "@/lib/amigos-actions";
import { buscarPersonas, felicitar, getSugeridos } from "@/lib/amigos-actions";
import { toggleSeguir } from "@/lib/seguidores-actions";
import type { Solicitud } from "@/lib/seguidores-actions";
import { ProSeccionModal } from "@/components/ProSeccionModal";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { InvitarCard } from "@/components/InvitarCard";
import { SolicitudesLista } from "@/components/SolicitudesLista";

export function AmigosVista({
  yo, amigos, solicitudes, actividad, seguidores, seguidos, bloqueado = false,
}: {
  yo: { id: string; nombre: string; avatar: string | null; racha: number; xp: number };
  amigos: Amigo[];
  solicitudes: Solicitud[];
  actividad: ActividadAmigo[];
  seguidores: PersonaLista[];
  seguidos: PersonaLista[];
  // Sin Boost Pro no hay chat (ver lib/pro.ts). El resto de la pantalla es
  // libre: buscar, seguir y felicitar no cuestan.
  bloqueado?: boolean;
}) {
  const [verTodos, setVerTodos] = useState(false);
  const [tab, setTab] = useState<"Seguidores" | "Seguidos">("Seguidores");
  const lista = tab === "Seguidores" ? seguidores : seguidos;
  // La pantalla es de todas: buscar gente, seguirla y felicitarla es gratis.
  // Lo único que pide Boost Pro es el chat, así que el aviso solo sale cuando
  // alguien intenta abrir una conversación.
  const [proAbierto, setProAbierto] = useState(false);
  const alPro = bloqueado
    ? (e: React.MouseEvent) => { e.preventDefault(); setProAbierto(true); }
    : undefined;

  return (
    <div className="min-h-screen bg-bg flex">
      {proAbierto && <ProSeccionModal onClose={() => setProAbierto(false)} />}
      <AppSidebar active="amigos" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          {/* Barra superior */}
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {yo.racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {yo.xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={yo.avatar} nombre={yo.nombre} />
          </header>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 className="font-display text-2xl font-extrabold">Amigos</h1>
            <BuscarPersonas />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0">
              {/* Fila de amigos + botón para verlos todos */}
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                {amigos.slice(0, 8).map((a) => (
                  <Link key={a.id} href={`/app/amigos/${a.id}`} onClick={alPro} className="shrink-0 w-[74px] text-center group">
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
                  <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" />
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
                        <BotonFelicitar userId={a.userId} porQue={a.texto} />
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

              <Sugeridos />

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
                  <Link key={a.id} href={`/app/amigos/${a.id}`} onClick={alPro}
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

// Buscador de personas: antes solo se podía seguir a alguien si te lo topabas
// en la comunidad o te llegaba su enlace. Aquí se busca por nombre y se le
// manda la solicitud desde la misma lista.
function BuscarPersonas() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [gente, setGente] = useState<Encontrada[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Se busca sola mientras escribe, con una pausa para no pedir en cada tecla.
  useEffect(() => {
    if (!abierto) return;
    const q = texto.trim();
    if (q.length < 2) { setGente([]); return; }
    let vivo = true;
    setBuscando(true);
    const t = setTimeout(async () => {
      const r = await buscarPersonas(q);
      if (vivo) { setGente(r); setBuscando(false); }
    }, 350);
    return () => { vivo = false; clearTimeout(t); };
  }, [texto, abierto]);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)}
        className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-[13px] font-bold text-sub hover:border-accent/40 transition">
        <Lupa /> Buscar personas
      </button>
    );
  }

  return (
    <div className="relative w-full sm:w-[340px]">
      <div className="flex items-center gap-2 bg-surface border border-accent/40 rounded-full px-4 py-2">
        <Lupa />
        <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Busca por nombre…"
          className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        <button type="button" onClick={() => { setAbierto(false); setTexto(""); setGente([]); }}
          aria-label="Cerrar búsqueda" className="text-hint hover:text-sub shrink-0">✕</button>
      </div>

      {texto.trim().length >= 2 && (
        <div className="absolute z-30 left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-xl max-h-[380px] overflow-y-auto">
          {buscando ? (
            <p className="text-[13px] text-sub px-4 py-3">Buscando…</p>
          ) : gente.length === 0 ? (
            <p className="text-[13px] text-sub px-4 py-3">Nadie con ese nombre.</p>
          ) : (
            gente.map((p) => <FilaPersona key={p.id} persona={p} />)
          )}
        </div>
      )}
    </div>
  );
}

function FilaPersona({ persona }: { persona: Encontrada }) {
  const [loSigo, setLoSigo] = useState(persona.loSigo);
  const [solicitada, setSolicitada] = useState(persona.solicitada);
  const [pendiente, startTransition] = useTransition();

  function seguir() {
    startTransition(async () => {
      const r = await toggleSeguir(persona.id);
      if ("error" in r) return;
      setLoSigo(r.loSigo);
      setSolicitada(r.solicitada);
    });
  }

  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-bg transition">
      <Link href={`/app/creador/${persona.id}`} className="shrink-0">
        {persona.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={persona.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold">
            {persona.nombre.slice(0, 2).toUpperCase()}
          </span>
        )}
      </Link>
      <Link href={`/app/creador/${persona.id}`} className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold truncate hover:text-accent transition">{persona.nombre}</div>
        {persona.esBoost && (
          <span className="inline-block text-[10px] font-extrabold text-white bg-accent rounded-full px-2 py-0.5 mt-0.5">
            BOOST ACADEMY
          </span>
        )}
      </Link>
      <button type="button" onClick={seguir} disabled={pendiente}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition disabled:opacity-60 ${
          loSigo || solicitada
            ? "bg-bg border border-border text-sub hover:border-accent/40"
            : "bg-accent text-white hover:brightness-110"
        }`}>
        {loSigo ? "Siguiendo" : solicitada ? "Enviada" : "Seguir"}
      </button>
    </div>
  );
}

function Lupa() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-hint" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// Felicitar: gratis y sin abrir un chat. Le llega como notificación.
function BotonFelicitar({ userId, porQue }: { userId: string; porQue: string }) {
  const [enviado, setEnviado] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function mandar() {
    startTransition(async () => {
      const r = await felicitar(userId, porQue);
      if (!("error" in r)) setEnviado(true);
    });
  }

  return (
    <button type="button" onClick={mandar} disabled={pendiente || enviado}
      className={`ml-auto shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition disabled:opacity-100 ${
        enviado ? "bg-accent-soft text-accent" : "bg-accent text-white hover:brightness-110"
      }`}>
      {enviado ? "¡Enviado! 🎉" : "Felicitar"}
    </button>
  );
}

// Gente que quizá quieras seguir. Se carga al abrir la pantalla.
function Sugeridos() {
  const [lista, setLista] = useState<Encontrada[] | null>(null);

  useEffect(() => {
    let vivo = true;
    getSugeridos().then((r) => { if (vivo) setLista(r); }).catch(() => { if (vivo) setLista([]); });
    return () => { vivo = false; };
  }, []);

  if (!lista || lista.length === 0) return null;

  return (
    <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
      <h3 className="font-display font-extrabold text-[15px] mb-1">Quizá quieras seguir</h3>
      <p className="text-[12px] text-sub leading-snug mb-3">
        Creadores de Melsprout que todavía no sigues.
      </p>
      <div className="divide-y divide-border -mx-1.5">
        {lista.map((p) => <FilaPersona key={p.id} persona={p} />)}
      </div>
    </section>
  );
}
