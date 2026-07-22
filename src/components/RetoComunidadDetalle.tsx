"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { inscribirseReto, publicarDiaReto, toggleLikeReto, type RetoComunidadDetalle as Detalle, type PostReto } from "@/lib/comunidad-retos-actions";

export function RetoComunidadDetalle({
  detalle, nombre, avatarUrl, gemas, racha,
}: {
  detalle: Detalle; nombre: string; avatarUrl: string | null; gemas: number; racha: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"pub" | "part">("pub");
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [mostrarLink, setMostrarLink] = useState(false);
  const [pub, setPub] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<PostReto[]>(detalle.publicaciones);
  const [misDias, setMisDias] = useState(detalle.misDias);
  const [inscrito, setInscrito] = useState(detalle.miInscrito);

  const pct = detalle.dias ? Math.round((misDias / detalle.dias) * 100) : 0;
  const diaSiguiente = Math.min(misDias + 1, detalle.dias);
  const completo = misDias >= detalle.dias;

  async function inscribir() {
    setInscrito(true);
    await inscribirseReto(detalle.id);
    router.refresh();
  }
  async function publicar() {
    setError("");
    setPub(true);
    const r = await publicarDiaReto(detalle.id, texto, link.trim() || null);
    setPub(false);
    if ("error" in r) { setError(r.error); return; }
    setTexto(""); setLink(""); setMostrarLink(false); setMisDias((d) => d + 1); setInscrito(true);
    router.refresh();
  }
  async function like(id: string) {
    setPosts((ps) => ps.map((p) => p.id === id ? { ...p, yoDiLike: !p.yoDiLike, likes: p.likes + (p.yoDiLike ? -1 : 1) } : p));
    await toggleLikeReto(id);
  }

  const top = detalle.participantes.slice(0, 5);

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="comunidad" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-4 h-10">
            <Link href="/app/racha" className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</Link>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {gemas}</span>
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <div className="flex items-center gap-2 text-[13px] mb-3">
            <Link href="/app/comunidad" className="text-accent font-semibold hover:underline">Comunidad</Link>
            <span className="text-hint">›</span>
            <span className="text-sub truncate">{detalle.titulo}</span>
          </div>

          {/* Banner del reto */}
          <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg" style={{ background: "linear-gradient(120deg,#2b1055,#7c1fa0 60%,#c026d3)" }}>
            <span className="absolute right-5 top-5 text-6xl opacity-30 select-none">{detalle.emoji}</span>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 text-[11px] font-bold rounded px-2 py-0.5">01</span>
                <span className="bg-white/20 text-[11px] font-bold rounded-full px-2.5 py-0.5">Reto grupal</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{detalle.titulo}</h1>
              <p className="text-white/85 text-[13.5px] mt-1 max-w-md">{detalle.descripcion}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 text-[12.5px] font-semibold">
                <span>👥 {detalle.inscritos} inscritos</span>
                <span>🗓️ {detalle.dias} días</span>
                <span>⭐ +{detalle.xp_dia} XP/día</span>
                <span>💎 +{detalle.xp_bonus} bonus</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-border mt-5 mb-5">
            {([["pub", "Publicaciones"], ["part", `Participantes (${detalle.inscritos})`]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 ${tab === k ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === "pub" ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
              <div className="min-w-0 order-2 lg:order-1">
                {/* Composer / publicar mi día */}
                {inscrito && !completo ? (
                  <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm mb-5">
                    <div className="text-[13px] font-bold text-accent mb-2">Publica tu día {diaSiguiente} de {detalle.dias}</div>
                    <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder="Cuenta tu avance de hoy…"
                      className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-accent resize-none" />
                    {mostrarLink && (
                      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://… (link de tu contenido)"
                        className="w-full mt-2 bg-bg border border-border rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-accent" />
                    )}
                    {error && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-2">{error}</p>}
                    <div className="flex items-center gap-4 mt-3">
                      <button onClick={() => setMostrarLink((v) => !v)} className="text-[13px] font-semibold text-sub hover:text-accent transition">🔗 Enlace</button>
                      <button onClick={publicar} disabled={pub || (!texto.trim() && !link.trim())}
                        className="ml-auto bg-accent text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-50 transition">
                        {pub ? "Publicando…" : `Publicar mi día ${diaSiguiente}`}
                      </button>
                    </div>
                  </div>
                ) : !inscrito ? (
                  <button onClick={inscribir} className="w-full bg-accent text-white rounded-2xl py-3.5 text-[14px] font-bold hover:brightness-110 transition mb-5 shadow-lg shadow-accent/25">
                    Inscribirme a este reto 🚀
                  </button>
                ) : (
                  <div className="bg-green-soft border border-green/30 text-green rounded-2xl p-4 text-center text-[14px] font-bold mb-5">🎉 ¡Completaste los {detalle.dias} días! Increíble.</div>
                )}

                {/* Publicaciones recientes */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-extrabold text-lg">Publicaciones recientes</h2>
                </div>
                {posts.length === 0 ? (
                  <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub">Sé la primera en publicar. ✨</div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((p) => (
                      <div key={p.id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-2">
                          {p.autorAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.autorAvatar} alt={p.autorNombre} className="w-9 h-9 rounded-full object-cover" />
                          ) : <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold">{p.autorNombre.slice(0, 2).toUpperCase()}</span>}
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-bold leading-tight truncate">{p.autorNombre} <span className="text-sub font-normal text-[12px]">· Nivel {p.autorNivel}</span></div>
                          </div>
                          <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-0.5 shrink-0">Día {p.dia} de {detalle.dias}</span>
                        </div>
                        {p.texto && <p className="text-[13.5px] text-text leading-relaxed whitespace-pre-wrap">{p.texto}</p>}
                        {p.media_url && <a href={p.media_url} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[13px] text-accent font-semibold hover:underline">Ver contenido ↗</a>}
                        <div className="flex items-center gap-4 mt-3 text-[13px] text-sub">
                          <button onClick={() => like(p.id)} className={`flex items-center gap-1.5 ${p.yoDiLike ? "text-pink" : "hover:text-pink"} transition`}>
                            {p.yoDiLike ? "❤️" : "🤍"} {p.likes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar: info + progreso */}
              <aside className="space-y-5 order-1 lg:order-2">
                <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="font-display font-extrabold text-[15px] mb-1.5">Información del reto</h3>
                  <p className="text-[13px] text-sub leading-relaxed">{detalle.info}</p>
                </section>

                <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-extrabold text-[15px]">Tu progreso</h3>
                    <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${completo ? "bg-green-soft text-green" : "bg-accent-soft text-accent"}`}>{completo ? "Completado" : inscrito ? "En curso" : "No inscrito"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Anillo pct={pct} texto={`${misDias}/${detalle.dias}`} />
                    <div className="text-[13px] text-sub">
                      <div className="font-bold text-text">Días completados</div>
                      <p className="mt-0.5">{completo ? "¡Racha completa! 🔥" : inscrito ? "Publica hoy para mantener tu racha 🔥" : "Inscríbete para empezar"}</p>
                      {inscrito && <div className="mt-1 text-[12px]">Racha en el reto: <b className="text-accent">{misDias} día{misDias === 1 ? "" : "s"}</b></div>}
                    </div>
                  </div>
                  {/* checkmarks por día */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {Array.from({ length: detalle.dias }, (_, i) => (
                      <span key={i} className={`w-6 h-6 rounded-full grid place-items-center text-[11px] ${i < misDias ? "bg-accent text-white" : "bg-bg border border-border text-hint"}`}>{i < misDias ? "✓" : i + 1}</span>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          ) : (
            /* ——— Participantes ——— */
            <div className="max-w-lg">
              <h2 className="font-display font-extrabold text-lg mb-3">Top participantes</h2>
              <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-1.5 mb-6">
                {top.length === 0 ? <p className="text-sub text-[13px] text-center py-4">Aún no hay participantes.</p> : top.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
                    <span className="w-5 text-center text-[13px] font-extrabold text-hint">{i + 1}</span>
                    {p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar} alt={p.nombre} className="w-9 h-9 rounded-full object-cover" />
                    ) : <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold">{p.nombre.slice(0, 2).toUpperCase()}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold truncate leading-tight">{p.nombre}</div>
                      <div className="text-[11px] text-sub">Nivel {p.nivel}</div>
                    </div>
                    <span className="text-[12px] font-bold text-accent">{p.xp.toLocaleString("es-MX")} XP</span>
                    {i < 3 && <span className="text-[15px]">👑</span>}
                  </div>
                ))}
              </div>

              <h2 className="font-display font-extrabold text-lg mb-3">Todos los participantes</h2>
              <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-1">
                {detalle.participantes.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2.5 py-1.5">
                    <span className="w-5 text-center text-[13px] font-extrabold text-hint">{i + 1}</span>
                    {p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar} alt={p.nombre} className="w-8 h-8 rounded-full object-cover" />
                    ) : <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold">{p.nombre.slice(0, 2).toUpperCase()}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate leading-tight">{p.nombre}</div>
                      <div className="text-[11px] text-sub">Nivel {p.nivel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Anillo de progreso circular.
function Anillo({ pct, texto }: { pct: number; texto: string }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#EEE9FB" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="#22C55E" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} transform="rotate(-90 36 36)" />
      <text x="36" y="40" textAnchor="middle" className="fill-text font-display" fontSize="15" fontWeight="800">{texto}</text>
    </svg>
  );
}
