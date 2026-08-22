"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { createClient } from "@/lib/supabase/client";
import { crearPost, getForoPosts, toggleLike, type ForoPost } from "@/lib/foros-actions";
import { alternarMembresia, type Grupo } from "@/lib/grupos-actions";

type Actividad = { id: string; userId: string; nombre: string; avatar: string | null; texto: string; xp?: number; hace: string };

export function GrupoDetalle({
  grupo, postsIniciales, actividad = [], nombre, avatarUrl, gemas, racha,
}: {
  grupo: Grupo; postsIniciales: ForoPost[]; actividad?: Actividad[];
  nombre: string; avatarUrl: string | null; gemas: number; racha: number;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(postsIniciales);
  const [soyMiembro, setSoyMiembro] = useState(grupo.soyMiembro);
  const [miembros, setMiembros] = useState(grupo.miembros);
  const [texto, setTexto] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [enlaceUrl, setEnlaceUrl] = useState("");
  const [mostrarEnlace, setMostrarEnlace] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const imgRef = useRef<HTMLInputElement>(null);

  async function subirImagen(file: File) {
    setSubiendo(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const ruta = `comunidad/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("retos").upload(ruta, file, { upsert: true });
      if (!error) setImagenUrl(supabase.storage.from("retos").getPublicUrl(ruta).data.publicUrl);
    } finally { setSubiendo(false); }
  }

  async function publicar() {
    if (!texto.trim() && !imagenUrl && !enlaceUrl.trim()) return;
    setPublicando(true);
    const r = await crearPost("General", texto || "", {
      grupoId: grupo.id,
      imagenUrl: imagenUrl || undefined,
      enlaceUrl: enlaceUrl.trim() || undefined,
    });
    setPublicando(false);
    if ("error" in r) { alert(r.error); return; }
    setTexto(""); setImagenUrl(""); setEnlaceUrl(""); setMostrarEnlace(false);
    setPosts(await getForoPosts("General", grupo.id));
    router.refresh();
  }

  function unirse() {
    startTransition(async () => {
      const r = await alternarMembresia(grupo.id);
      if ("error" in r) { alert(r.error); return; }
      setSoyMiembro(r.soyMiembro); setMiembros(r.miembros);
      router.refresh();
    });
  }

  function invitar() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="comunidad" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {gemas}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <Link href="/app/comunidad"
            className="w-10 h-10 rounded-full bg-surface border border-border grid place-items-center text-lg hover:border-accent/40 transition mb-4"
            aria-label="Volver a la comunidad">←</Link>

          {/* Portada */}
          <div className="relative rounded-3xl overflow-hidden mb-5 aspect-[16/6] sm:aspect-[16/4.5] grid place-items-end"
            style={{ background: "linear-gradient(120deg,#7C3AED,#4F46E5 60%,#2563EB)" }}>
            {grupo.portada && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={grupo.portada} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="relative w-full p-4 sm:p-5 flex flex-wrap items-end gap-3">
              <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/90 grid place-items-center text-2xl shrink-0">{grupo.emoji}</span>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight truncate">{grupo.nombre}</h1>
                <p className="text-white/85 text-[13px] mt-0.5">
                  {miembros} miembro{miembros === 1 ? "" : "s"} · {grupo.publico ? "Público" : "Privado"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!soyMiembro && (
                  <button onClick={unirse} disabled={pendiente}
                    className="bg-white text-accent rounded-xl px-4 py-2 text-[13px] font-bold hover:brightness-95 disabled:opacity-60 transition">
                    Unirme
                  </button>
                )}
                <button onClick={invitar}
                  className="bg-accent text-white rounded-xl px-4 py-2 text-[13px] font-bold hover:brightness-110 transition">
                  {copiado ? "¡Link copiado! ✓" : "👥 Invitar"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0">
              {/* Compositor: solo para miembros */}
              {soyMiembro ? (
                <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm mb-5">
                  <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2}
                    placeholder={`Escribe algo en ${grupo.nombre}…`}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-accent resize-none" />
                  {mostrarEnlace && (
                    <input value={enlaceUrl} onChange={(e) => setEnlaceUrl(e.target.value)} placeholder="Pega un enlace…"
                      className="w-full mt-2 bg-bg border border-border rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-accent" />
                  )}
                  {imagenUrl && (
                    <div className="relative mt-2 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagenUrl} alt="" className="max-h-40 rounded-xl border border-border" />
                      <button onClick={() => setImagenUrl("")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs">✕</button>
                    </div>
                  )}
                  <input ref={imgRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagen(f); }} />
                  <div className="flex items-center gap-3 sm:gap-4 mt-3 flex-wrap">
                    <button onClick={() => imgRef.current?.click()} disabled={subiendo}
                      className="text-[13px] font-semibold text-sub hover:text-accent transition disabled:opacity-60">
                      📷 {subiendo ? "Subiendo…" : "Imagen"}
                    </button>
                    <button onClick={() => setMostrarEnlace((v) => !v)} className="text-[13px] font-semibold text-sub hover:text-accent transition">🔗 Enlace</button>
                    <button onClick={publicar} disabled={publicando || (!texto.trim() && !imagenUrl && !enlaceUrl.trim())}
                      className="ml-auto bg-accent text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-50 transition">
                      {publicando ? "Publicando…" : "Publicar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-surface border border-dashed border-border rounded-2xl p-6 text-center mb-5">
                  <p className="text-[13.5px] text-sub">Únete al grupo para publicar y participar.</p>
                </div>
              )}

              <h2 className="font-display font-extrabold text-lg mb-3">Publicaciones recientes</h2>
              {posts.length === 0 ? (
                <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub">
                  <div className="text-3xl mb-2">💬</div>
                  {soyMiembro ? "Sé la primera persona en publicar aquí." : "Todavía no hay publicaciones."}
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((p) => <PostGrupo key={p.id} post={p} />)}
                </div>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-5">
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold text-[15px] mb-2">Acerca de</h3>
                <p className="text-[13px] text-sub leading-relaxed">{grupo.descripcion}</p>
                <div className="mt-3 space-y-1.5 text-[13px] text-sub">
                  <div>👥 {miembros} miembro{miembros === 1 ? "" : "s"}</div>
                  <div>{grupo.publico ? "🌎 Público" : "🔒 Privado"}</div>
                  <div>📅 Creado el {new Date(grupo.creadoEn).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                {grupo.proponente && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    {grupo.proponente.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={grupo.proponente.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-accent-soft text-accent grid place-items-center text-[10px] font-bold">
                        {grupo.proponente.nombre.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="text-[12.5px] text-sub truncate">Creado por <b className="text-text">{grupo.proponente.nombre}</b></span>
                  </div>
                )}
              </section>

              {actividad.length > 0 && (
                <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="font-display font-extrabold text-[15px] mb-3">Actividad reciente</h3>
                  <div className="space-y-3">
                    {actividad.slice(0, 4).map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5">
                        {a.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center text-[10px] font-bold shrink-0">
                            {a.nombre.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-[12.5px] leading-snug"><b>{a.nombre}</b> {a.texto}</p>
                          <p className="text-[11.5px] text-hint mt-0.5">
                            {a.xp ? <span className="text-accent font-semibold">+{a.xp} XP · </span> : null}{a.hace}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function PostGrupo({ post }: { post: ForoPost }) {
  const [likes, setLikes] = useState(post.likes);
  const [meGusta, setMeGusta] = useState(post.meGusta);

  async function like() {
    setMeGusta((v) => !v); setLikes((n) => n + (meGusta ? -1 : 1));
    const r = await toggleLike(post.id);
    if ("error" in r) { setMeGusta(post.meGusta); setLikes(post.likes); }
  }

  return (
    <article className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/app/creador/${post.autorId}`} className="shrink-0">
          {post.autorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.autorAvatar} alt={post.autorNombre} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-accent/15 text-accent grid place-items-center text-[13px] font-bold">
              {post.autorNombre.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
        <div className="min-w-0">
          <div className="font-bold text-[14px] leading-tight">
            <Link href={`/app/creador/${post.autorId}`} className="hover:text-accent transition">{post.autorNombre}</Link>
            <span className="text-sub font-normal text-[12px]"> · Nivel {post.autorNivel}</span>
          </div>
          {post.esNuevo && <span className="text-[10.5px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5">Nuevo</span>}
        </div>
      </div>

      {post.texto && <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{post.texto}</p>}
      {post.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imagenUrl} alt="" className="mt-2 rounded-xl border border-border max-h-80 w-auto" />
      )}
      {post.enlaceUrl && (
        <a href={post.enlaceUrl} target="_blank" rel="noreferrer" className="text-accent text-[13px] font-semibold underline break-all mt-1 inline-block">
          {post.enlaceUrl}
        </a>
      )}

      <div className="flex items-center gap-5 mt-3 text-[13px]">
        <button onClick={like} className={`flex items-center gap-1.5 font-semibold transition ${meGusta ? "text-pink" : "text-sub hover:text-pink"}`}>
          ♥ {likes}
        </button>
      </div>
    </article>
  );
}
