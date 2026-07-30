"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIAS_FORO } from "@/lib/data";
import {
  getForoPosts, crearPost, toggleLike, getRespuestas, crearRespuesta,
  type ForoPost, type ForoRespuesta,
} from "@/lib/foros-actions";
import { type RetoComunidad } from "@/lib/comunidad-retos-actions";

type Props = {
  postsIniciales: ForoPost[];
  topColaboradores: { nombre: string; avatar: string | null; xp: number }[];
  retosComunidad: RetoComunidad[];
  nombre: string; avatarUrl: string | null; gemas: number; racha: number;
};

function haceRato(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora"; if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60); if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export function ComunidadVista({ postsIniciales, topColaboradores, retosComunidad, nombre, avatarUrl, gemas, racha }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"foros" | "retos">("foros");
  const [cat, setCat] = useState("General");
  const [posts, setPosts] = useState<ForoPost[]>(postsIniciales);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const [imagenUrl, setImagenUrl] = useState("");
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [avisoEncuesta, setAvisoEncuesta] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  async function subirImagen(file: File) {
    setSubiendoImg(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `comunidad/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("retos").upload(path, file, { upsert: true });
      if (!error) { const { data } = supabase.storage.from("retos").getPublicUrl(path); setImagenUrl(data.publicUrl); }
    } finally { setSubiendoImg(false); }
  }

  async function cambiarCat(c: string) {
    setCat(c); setCargando(true);
    setPosts(await getForoPosts(c));
    setCargando(false);
  }
  async function publicar() {
    if (!texto.trim() && !imagenUrl && !videoUrl.trim()) return;
    setPublicando(true);
    const r = await crearPost(cat, texto || "", { imagenUrl: imagenUrl || undefined, videoUrl: videoUrl.trim() || undefined });
    setPublicando(false);
    if ("error" in r) { alert(r.error); return; }
    setTexto(""); setVideoUrl(""); setImagenUrl(""); setMostrarVideo(false); setAvisoEncuesta(false);
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

          {/* Liderboard + avatares */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 bg-accent text-white text-[13px] font-bold rounded-full px-3.5 py-1.5 shadow-sm">✦ Liderboard</span>
            <div className="flex -space-x-2">
              {topColaboradores.slice(0, 4).map((c, i) => (
                c.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-bg" />
                ) : <span key={i} className="w-8 h-8 rounded-full bg-accent/20 text-accent grid place-items-center text-[10px] font-bold border-2 border-bg">{c.nombre.slice(0, 2).toUpperCase()}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div>
              {/* Banner Octi */}
              <div className="rounded-3xl p-6 sm:p-8 flex items-center gap-5 sm:gap-7 shadow-sm mb-5" style={{ background: "linear-gradient(120deg,#F3F0FF,#FBFAFF)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/octi.png" alt="Octi" className="shrink-0 w-24 sm:w-36 drop-shadow-lg" draggable={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-accent font-extrabold text-lg sm:text-2xl leading-snug">¡Se aprende mejor en comunidad!</p>
                  <p className="text-sub text-[14px] sm:text-[15px] mt-1.5">Comparte, conecta y crece. Publica y gana <b className="text-accent">+10 XP</b> 💎</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-border mb-5">
                {(["foros", "retos"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 ${tab === t ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
                    {t === "foros" ? "Grupos" : "Retos en comunidad"}
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
                    {mostrarVideo && (
                      <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Link de YouTube o video…" className="w-full mt-2 bg-bg border border-border rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-accent" />
                    )}
                    {imagenUrl && (
                      <div className="relative mt-2 inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagenUrl} alt="" className="max-h-40 rounded-xl border border-border" />
                        <button onClick={() => setImagenUrl("")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs">✕</button>
                      </div>
                    )}
                    {avisoEncuesta && <p className="text-[12px] text-sub mt-2">📊 Las encuestas llegan muy pronto ✨</p>}
                    <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagen(f); }} />
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 flex-wrap">
                      <button onClick={() => imgRef.current?.click()} disabled={subiendoImg} className="text-[13px] font-semibold text-sub hover:text-accent transition disabled:opacity-60">📷 {subiendoImg ? "Subiendo…" : "Imagen"}</button>
                      <button onClick={() => setMostrarVideo((v) => !v)} className="text-[13px] font-semibold text-sub hover:text-accent transition">🎬 Video</button>
                      <button onClick={() => setAvisoEncuesta((v) => !v)} className="text-[13px] font-semibold text-sub hover:text-accent transition">📊 Encuesta</button>
                      <button onClick={publicar} disabled={publicando || (!texto.trim() && !imagenUrl && !videoUrl.trim())} className="ml-auto bg-accent text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-50 transition">
                        {publicando ? "Publicando…" : "Publicar"}
                      </button>
                    </div>
                  </div>

                  {/* Publicaciones */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-extrabold text-lg">Publicaciones recientes</h2>
                    <span className="text-[13px] font-semibold text-sub flex items-center gap-1.5">⚙ Filtrar</span>
                  </div>
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
                <div className="space-y-4">
                  {retosComunidad.length === 0 ? (
                    <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center text-sub">
                      <div className="text-4xl mb-2">🔥</div>
                      <p className="text-[14px]">Aún no hay retos en comunidad. ¡Pronto habrá!</p>
                    </div>
                  ) : retosComunidad.map((r, i) => (
                    <Link key={r.id} href={`/app/comunidad/reto/${r.id}`}
                      className="block bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:border-accent/30 hover:shadow-md transition group">
                      <div className="relative h-28 p-4 flex items-end text-white" style={{ background: "linear-gradient(120deg,#2b1055,#7c1fa0 60%,#c026d3)" }}>
                        <span className="absolute right-4 top-3 text-5xl opacity-30">{r.emoji}</span>
                        <span className="absolute left-4 top-3 bg-white/20 text-[11px] font-bold rounded px-2 py-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <h3 className="relative font-display text-xl font-extrabold leading-tight">{r.titulo}</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-[13px] text-sub">{r.descripcion}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12px] font-semibold text-sub">
                          <span>👥 {r.inscritos} inscritos</span>
                          <span>🗓️ {r.dias} días</span>
                          <span className="text-accent">⭐ +{r.xp_dia} XP/día</span>
                        </div>
                        {r.miInscrito && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                              <span className="text-accent">Tu progreso</span>
                              <span className="text-sub">{r.misDias}/{r.dias} días</span>
                            </div>
                            <div className="h-2 rounded-full bg-bg overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${r.dias ? (r.misDias / r.dias) * 100 : 0}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="mt-3 text-[13px] font-bold text-accent group-hover:underline">{r.miInscrito ? "Continuar reto →" : "Ver reto →"}</div>
                      </div>
                    </Link>
                  ))}
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
      {post.texto && <p className="text-[14px] text-text leading-relaxed whitespace-pre-wrap">{post.texto}</p>}
      {post.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imagenUrl} alt="" className="mt-2 rounded-xl border border-border max-h-80 w-auto" />
      )}
      {post.videoUrl && (
        (() => {
          const yt = post.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
          return yt
            ? <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-border"><iframe src={`https://www.youtube.com/embed/${yt[1]}`} className="w-full h-full" allowFullScreen title="video" /></div>
            : <a href={post.videoUrl} target="_blank" rel="noreferrer" className="text-accent text-[13px] font-semibold underline break-all mt-1 inline-block">🎬 Ver video</a>;
        })()
      )}
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
