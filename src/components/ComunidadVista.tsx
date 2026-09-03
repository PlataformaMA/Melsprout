"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIAS_FORO } from "@/lib/data";
import {
  getForoPosts, crearPost,
  type ForoPost,
} from "@/lib/foros-actions";
import { inscribirseReto, type RetoComunidad } from "@/lib/comunidad-retos-actions";
import { GruposVista } from "@/components/GruposVista";
import { PostCard, haceRato } from "@/components/PostCard";
import type { Grupo } from "@/lib/grupos-actions";

type Actividad = { id: string; userId: string; nombre: string; avatar: string | null; texto: string; xp?: number; hace: string };
type Props = {
  postsIniciales: ForoPost[];
  topColaboradores: { id: string; nombre: string; avatar: string | null; xp: number }[];
  retosComunidad: RetoComunidad[];
  grupos?: { propuestas: Grupo[]; mios: Grupo[]; otros: Grupo[] };
  actividad?: Actividad[];
  nombre: string; avatarUrl: string | null; gemas: number; racha: number;
};


export function ComunidadVista({ postsIniciales, topColaboradores, retosComunidad, grupos, actividad = [], nombre, avatarUrl, gemas, racha }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"foros" | "grupos" | "retos">("foros");
  const [cat, setCat] = useState("General");
  const [posts, setPosts] = useState<ForoPost[]>(postsIniciales);
  const [titulo, setTitulo] = useState("");
  const [verTodas, setVerTodas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const [imagenUrl, setImagenUrl] = useState("");
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [enlaceUrl, setEnlaceUrl] = useState("");
  const [mostrarEnlace, setMostrarEnlace] = useState(false);
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
    setVerTodas(false);
    setPosts(await getForoPosts(c));
    setCargando(false);
  }
  async function publicar() {
    if (!texto.trim() && !imagenUrl && !videoUrl.trim() && !enlaceUrl.trim()) return;
    setPublicando(true);
    const r = await crearPost(cat, texto || "", {
      imagenUrl: imagenUrl || undefined,
      videoUrl: videoUrl.trim() || undefined,
      enlaceUrl: enlaceUrl.trim() || undefined,
      titulo: titulo.trim() || undefined,
    });
    setPublicando(false);
    if ("error" in r) { alert(r.error); return; }
    setTexto(""); setTitulo(""); setVideoUrl(""); setImagenUrl(""); setEnlaceUrl("");
    setMostrarVideo(false); setMostrarEnlace(false);
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
                  <p className="text-accent font-extrabold text-lg sm:text-2xl leading-snug">
                    {tab === "grupos" ? "¡Busca a tu gente!"
                      : tab === "retos" ? "¡Los retos se disfrutan en bola!"
                      : "¡Se aprende mejor en comunidad!"}
                  </p>
                  <p className="text-sub text-[14px] sm:text-[15px] mt-1.5">
                    {tab === "grupos" ? <>Únete a un grupo o propón el tuyo. Los grupos nacen con <b className="text-accent">10 apoyos</b> 💜</>
                      : tab === "retos" ? <>Participa cada día y suma <b className="text-accent">XP</b> con tu constancia 🔥</>
                      : <>Comparte, conecta y crece. Publica y gana <b className="text-accent">+10 XP</b> 💎</>}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-5 sm:gap-6 border-b border-border mb-5 overflow-x-auto">
                {(["foros", "grupos", "retos"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-2.5 text-[13.5px] sm:text-[14px] font-bold transition -mb-px border-b-2 whitespace-nowrap ${tab === t ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
                    {t === "foros" ? "Foro" : t === "grupos" ? "Grupos" : "Retos en comunidad"}
                  </button>
                ))}
              </div>

              {tab === "foros" ? (
                <>
                  {/* Categorías */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
                    {CATEGORIAS_FORO.map((c) => (
                      <button key={c} onClick={() => cambiarCat(c)}
                        className={`shrink-0 text-[12.5px] font-semibold rounded-full px-3.5 py-1.5 transition ${cat === c ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Composer */}
                  <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm mb-5">
                    <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120}
                      placeholder="Ponle un título (opcional)"
                      className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-[14px] font-bold outline-none focus:border-accent mb-2" />
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
                    {mostrarEnlace && (
                      <input value={enlaceUrl} onChange={(e) => setEnlaceUrl(e.target.value)} placeholder="Pega un enlace…"
                        className="w-full mt-2 bg-bg border border-border rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-accent" />
                    )}
                    <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagen(f); }} />
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 flex-wrap">
                      <button onClick={() => imgRef.current?.click()} disabled={subiendoImg} className="text-[13px] font-semibold text-sub hover:text-accent transition disabled:opacity-60">📷 {subiendoImg ? "Subiendo…" : "Imagen"}</button>
                      <button onClick={() => setMostrarVideo((v) => !v)} className="text-[13px] font-semibold text-sub hover:text-accent transition">🎬 Video</button>
                      <button onClick={() => setMostrarEnlace((v) => !v)} className="text-[13px] font-semibold text-sub hover:text-accent transition">🔗 Enlace</button>
                      <button onClick={publicar} disabled={publicando || (!texto.trim() && !imagenUrl && !videoUrl.trim() && !enlaceUrl.trim())} className="ml-auto bg-accent text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-50 transition">
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
                    <>
                      <div className="space-y-3">
                        {(verTodas ? posts : posts.slice(0, 8)).map((p) => <PostCard key={p.id} post={p} />)}
                      </div>
                      {!verTodas && posts.length > 8 && (
                        <button onClick={() => setVerTodas(true)}
                          className="w-full mt-4 bg-surface border border-border rounded-2xl py-3 text-[13.5px] font-bold text-accent hover:border-accent/40 transition">
                          Cargar más publicaciones ⌄
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : tab === "grupos" ? (
                <GruposVista
                  propuestas={grupos?.propuestas ?? []}
                  mios={grupos?.mios ?? []}
                  otros={grupos?.otros ?? []}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {retosComunidad.length === 0 ? (
                    <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center text-sub">
                      <div className="text-4xl mb-2">🔥</div>
                      <p className="text-[14px]">Aún no hay retos en comunidad. ¡Pronto habrá!</p>
                    </div>
                  ) : retosComunidad.map((r, i) => (
                    <RetoCard key={r.id} reto={r} indice={i} />
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
                    <Link key={i} href={`/app/creador/${c.id}`} className="flex items-center gap-2.5 rounded-lg -mx-1 px-1 py-0.5 hover:bg-bg transition">
                      <span className="text-[13px] font-extrabold w-4">{i + 1}</span>
                      {c.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatar} alt={c.nombre} className="w-8 h-8 rounded-full object-cover" />
                      ) : <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold">{c.nombre.slice(0, 2).toUpperCase()}</span>}
                      <span className="flex-1 min-w-0 text-[13px] font-semibold truncate hover:text-accent transition">{c.nombre}</span>
                      <span className="text-[12px] font-bold text-accent">{c.xp.toLocaleString("es-MX")} XP</span>
                      <span>{i === 0 ? "👑" : ""}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Actividad reciente (datos reales) */}
              {actividad.length > 0 && (
                <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="font-display font-extrabold text-[15px] mb-3">Actividad reciente</h3>
                  <div className="space-y-3.5">
                    {actividad.map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5">
                        <Link href={`/app/creador/${a.userId}`} className="shrink-0">
                          {a.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.avatar} alt={a.nombre} className="w-8 h-8 rounded-full object-cover" />
                          ) : <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold">{a.nombre.slice(0, 2).toUpperCase()}</span>}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-snug">
                            <Link href={`/app/creador/${a.userId}`} className="font-bold hover:text-accent transition">{a.nombre}</Link> {a.texto}
                          </p>
                          <p className="text-[12px] text-sub mt-0.5">
                            {a.xp ? <b className="text-accent">+{a.xp} XP</b> : null}{a.xp ? " · " : ""}{a.hace}
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
      </div>
    </div>
  );
}

// ————— Tarjeta de reto en comunidad —————
function RetoCard({ reto, indice }: { reto: RetoComunidad; indice: number }) {
  const router = useRouter();
  const [faltan, setFaltan] = useState<string | null>(null);
  const [inscrito, setInscrito] = useState(reto.miInscrito);
  const [inscribiendo, setInscribiendo] = useState(false);

  // El botón inscribe aquí mismo: antes solo parecía botón y llevaba al detalle.
  async function participar(e: React.MouseEvent) {
    e.preventDefault();
    if (inscrito) { router.push(`/app/comunidad/reto/${reto.id}`); return; }
    setInscribiendo(true);
    const r = await inscribirseReto(reto.id);
    setInscribiendo(false);
    if ("error" in r) { alert(r.error); return; }
    setInscrito(true);
    router.refresh();
  }

  // La cuenta regresiva se calcula ya en el navegador: si se hiciera durante el
  // render, el HTML del servidor y el del cliente no coincidirían.
  useEffect(() => {
    if (!reto.iniciaAt || reto.disponible) return;
    const tic = () => {
      const ms = new Date(reto.iniciaAt as string).getTime() - Date.now();
      if (ms <= 0) { setFaltan(null); return; }
      const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
      setFaltan(`${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}min`);
    };
    tic();
    const id = setInterval(tic, 60000);
    return () => clearInterval(id);
  }, [reto.iniciaAt, reto.disponible]);

  const pct = reto.dias ? Math.min(100, Math.round((reto.misDias / reto.dias) * 100)) : 0;
  const cuerpo = (
    <>
      <div className="relative aspect-[16/7] grid place-items-center overflow-hidden"
        style={{ background: "linear-gradient(120deg,#2b1055,#7c1fa0 60%,#c026d3)" }}>
        {reto.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reto.portada} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <span className="absolute right-4 top-3 text-5xl opacity-30">{reto.emoji}</span>
            <h3 className="relative font-display text-white text-xl font-extrabold leading-tight px-4 text-center drop-shadow">
              {reto.titulo}
            </h3>
          </>
        )}
        <span className="absolute left-3 top-3 bg-black/45 text-white text-[11px] font-bold rounded px-2 py-0.5 backdrop-blur">
          {String(indice + 1).padStart(2, "0")}
        </span>
        <span className={`absolute right-3 top-3 text-[11px] font-bold rounded-full px-2.5 py-1 ${
          reto.disponible ? "bg-green text-white" : "bg-white/90 text-sub"
        }`}>
          {reto.disponible ? "Disponible" : "Próximamente"}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display font-extrabold text-[15px] leading-tight">{reto.titulo}</h3>
        <p className="text-[13px] text-sub mt-1 line-clamp-2">{reto.descripcion}</p>

        {reto.disponible ? (
          <p className="text-[12.5px] text-green font-semibold mt-2.5">✅ ¡Ya disponible! Participa ahora.</p>
        ) : faltan ? (
          <p className="text-[12.5px] text-sub mt-2.5">⏱ Empieza en <b className="text-text">{faltan}</b></p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12px] font-semibold text-sub">
          <span>👥 {reto.inscritos} inscritos</span>
          <span>🗓️ {reto.dias} días</span>
          <span className="text-accent">⭐ +{reto.xp_dia} XP</span>
        </div>

        {inscrito && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-accent">Tu progreso</span>
              <span className="text-sub">{reto.misDias}/{reto.dias} días</span>
            </div>
            <div className="h-2 rounded-full bg-[#EEEBF6] overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {reto.disponible ? (
          <button onClick={participar} disabled={inscribiendo}
            className={`mt-4 w-full rounded-xl py-2.5 text-[13px] font-bold transition disabled:opacity-60 ${
              inscrito ? "bg-accent-soft text-accent hover:brightness-95" : "bg-accent text-white hover:brightness-110"
            }`}>
            {inscribiendo ? "Inscribiendo…" : inscrito ? "Seguir el reto →" : "🏆 Unirme al reto"}
          </button>
        ) : (
          <span className="mt-4 block text-center rounded-xl py-2.5 text-[13px] font-bold bg-bg text-sub border border-border">
            Ver el reto
          </span>
        )}
      </div>
    </>
  );

  return (
    <Link href={`/app/comunidad/reto/${reto.id}`}
      className="group block bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:border-accent/30 hover:shadow-md transition">
      {cuerpo}
    </Link>
  );
}
