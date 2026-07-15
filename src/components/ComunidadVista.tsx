"use client";

import { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useRouter } from "next/navigation";
import { CATEGORIAS_FORO } from "@/lib/data";
import {
  getForoPosts, crearPost, toggleLike, getRespuestas, crearRespuesta,
  type ForoPost, type ForoRespuesta,
} from "@/lib/foros-actions";

type Props = {
  postsIniciales: ForoPost[];
  topColaboradores: { nombre: string; avatar: string | null; xp: number }[];
  nombre: string; avatarUrl: string | null; gemas: number; racha: number;
};

function haceRato(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora"; if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60); if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export function ComunidadVista({ postsIniciales, topColaboradores, nombre, avatarUrl, gemas, racha }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"foros" | "retos">("foros");
  const [cat, setCat] = useState("General");
  const [posts, setPosts] = useState<ForoPost[]>(postsIniciales);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enlace, setEnlace] = useState("");
  const [mostrarEnlace, setMostrarEnlace] = useState(false);
  const [publicando, setPublicando] = useState(false);

  async function cambiarCat(c: string) {
    setCat(c); setCargando(true);
    setPosts(await getForoPosts(c));
    setCargando(false);
  }
  async function publicar() {
    if (!texto.trim()) return;
    setPublicando(true);
    const r = await crearPost(cat, texto, { enlaceUrl: enlace || undefined });
    setPublicando(false);
    if ("error" in r) { alert(r.error); return; }
    setTexto(""); setEnlace(""); setMostrarEnlace(false);
    setPosts(await getForoPosts(cat));
    router.refresh(); // XP +10
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="comunidad" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {gemas}</span>
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Comunidad</h1>
          <p className="text-sub mt-1">Conecta, aprende y crece junto a otros creadores.</p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-5">
            <div>
              {/* Banner Octi */}
              <div className="rounded-3xl p-5 flex items-center gap-4 shadow-sm mb-5" style={{ background: "linear-gradient(120deg,#F3F0FF,#FBFAFF)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/octi.webp" alt="Octi" width={72} height={72} className="shrink-0 hidden sm:block" />
                <div>
                  <p className="text-accent font-bold text-[15px]">Se aprende mejor en comunidad. ¡Comparte tu aporte!</p>
                  <p className="text-[13.5px] text-sub mt-1">Publica y gana <b className="text-accent">+10 XP</b> 💎</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-border mb-5">
                {(["foros", "retos"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 ${tab === t ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
                    {t === "foros" ? "Foros" : "Retos en comunidad"}
                  </button>
                ))}
              </div>

              {tab === "foros" ? (
                <>
                  {/* Categorías */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIAS_FORO.map((c) => (
                      <button key={c} onClick={() => cambiarCat(c)}
                        className={`text-[12.5px] font-semibold rounded-full px-3 py-1.5 transition ${cat === c ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Composer */}
                  <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm mb-5">
                    <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2}
                      placeholder={`Escribe algo en ${cat === "General" ? "el foro general" : cat}…`}
                      className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-accent resize-none" />
                    {mostrarEnlace && (
                      <input value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…" className="w-full mt-2 bg-bg border border-border rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-accent" />
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <button onClick={() => setMostrarEnlace((v) => !v)} className="text-[13px] font-semibold text-sub hover:text-accent transition">🔗 Enlace</button>
                      <button onClick={publicar} disabled={publicando || !texto.trim()} className="ml-auto bg-accent text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-50 transition">
                        {publicando ? "Publicando…" : "Publicar"}
                      </button>
                    </div>
                  </div>

                  {/* Publicaciones */}
                  <h2 className="font-display font-extrabold text-lg mb-3">Publicaciones recientes</h2>
                  {cargando ? (
                    <p className="text-sub text-[14px]">Cargando…</p>
                  ) : posts.length === 0 ? (
                    <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub"><div className="text-3xl mb-2">💬</div>Sé el primero en publicar en {cat}.</div>
                  ) : (
                    <div className="space-y-3">
                      {posts.map((p) => <PostCard key={p.id} post={p} />)}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center text-sub">
                  <div className="text-4xl mb-2">🔥</div>
                  <h3 className="font-display font-extrabold text-lg text-text">Retos en comunidad</h3>
                  <p className="text-[14px] mt-1">Muy pronto: inscríbete a retos grupales, sigue tu progreso diario y compite en el tablero.</p>
                  <Link href="/app/retos" className="inline-block mt-4 text-accent font-semibold text-[14px]">Mientras tanto, ve tus retos →</Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold text-[15px] mb-3">Top colaboradores 🏆</h3>
                <div className="space-y-2.5">
                  {topColaboradores.map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="text-[13px] font-extrabold w-4">{i + 1}</span>
                      {c.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatar} alt={c.nombre} className="w-8 h-8 rounded-full object-cover" />
                      ) : <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold">{c.nombre.slice(0, 2).toUpperCase()}</span>}
                      <span className="flex-1 min-w-0 text-[13px] font-semibold truncate">{c.nombre}</span>
                      <span className="text-[12px] font-bold text-accent">{c.xp.toLocaleString("es-MX")} XP</span>
                      <span>{i === 0 ? "👑" : ""}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: ForoPost }) {
  const [likes, setLikes] = useState(post.likes);
  const [meGusta, setMeGusta] = useState(post.meGusta);
  const [abierto, setAbierto] = useState(false);
  const [resp, setResp] = useState<ForoRespuesta[] | null>(null);
  const [texto, setTexto] = useState("");
  const [num, setNum] = useState(post.respuestas);

  async function like() {
    setMeGusta((v) => !v); setLikes((n) => n + (meGusta ? -1 : 1));
    const r = await toggleLike(post.id);
    if ("error" in r) { setMeGusta(post.meGusta); setLikes(post.likes); }
  }
  async function abrir() {
    const nuevo = !abierto; setAbierto(nuevo);
    if (nuevo && resp === null) setResp(await getRespuestas(post.id));
  }
  async function responder() {
    if (!texto.trim()) return;
    const r = await crearRespuesta(post.id, texto);
    if ("error" in r) { alert(r.error); return; }
    setTexto(""); setResp(await getRespuestas(post.id)); setNum((n) => n + 1);
  }

  return (
    <article className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        {post.autorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.autorAvatar} alt={post.autorNombre} className="w-10 h-10 rounded-full object-cover" />
        ) : <span className="w-10 h-10 rounded-full bg-accent/15 text-accent grid place-items-center text-[13px] font-bold">{post.autorNombre.slice(0, 2).toUpperCase()}</span>}
        <div className="min-w-0">
          <div className="font-bold text-[14px] leading-tight">{post.autorNombre} <span className="text-sub font-normal text-[12px]">· Nivel {post.autorNivel}</span></div>
          <div className="text-[12px] text-hint">{haceRato(post.fecha)}</div>
        </div>
      </div>
      <p className="text-[14px] text-text leading-relaxed whitespace-pre-wrap">{post.texto}</p>
      {post.enlaceUrl && <a href={post.enlaceUrl} target="_blank" rel="noreferrer" className="text-accent text-[13px] font-semibold underline break-all mt-1 inline-block">{post.enlaceUrl}</a>}

      <div className="flex items-center gap-5 mt-3 text-[13px]">
        <button onClick={like} className={`flex items-center gap-1.5 font-semibold transition ${meGusta ? "text-pink" : "text-sub hover:text-pink"}`}>♥ {likes}</button>
        <button onClick={abrir} className="flex items-center gap-1.5 font-semibold text-sub hover:text-accent transition">💬 {num} {num === 1 ? "respuesta" : "respuestas"}</button>
        {post.categoria !== "General" && <span className="ml-auto text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-0.5">{post.categoria}</span>}
      </div>

      {abierto && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {resp === null ? <p className="text-[13px] text-hint">Cargando…</p> : resp.length === 0 ? <p className="text-[13px] text-hint">Sé el primero en responder.</p> : resp.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              {c.autorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.autorAvatar} alt={c.autorNombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold shrink-0">{c.autorNombre.slice(0, 2).toUpperCase()}</span>}
              <div className="bg-bg rounded-2xl px-3 py-2 flex-1 min-w-0"><div className="font-bold text-[12.5px]">{c.autorNombre}</div><p className="text-[13.5px] text-text whitespace-pre-wrap">{c.texto}</p></div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") responder(); }} placeholder="Escribe una respuesta…" maxLength={500}
              className="flex-1 bg-bg border border-border rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-accent" />
            <button onClick={responder} disabled={!texto.trim()} className="bg-accent text-white rounded-full px-4 py-2.5 text-[13px] font-bold disabled:opacity-50 hover:brightness-110 transition shrink-0">Enviar</button>
          </div>
        </div>
      )}
    </article>
  );
}
