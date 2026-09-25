"use client";

import { useState } from "react";
import Link from "next/link";
import { Icono } from "@/components/IconosApp";
import {
  toggleLike, getRespuestas, crearRespuesta, toggleLikeRespuesta,
  editarPost, borrarPost, editarRespuesta, borrarRespuesta,
  type ForoPost, type ForoRespuesta,
} from "@/lib/foros-actions";

// "hace 3 h", "hace 2 d"… en el idioma de la plataforma.
// Un enlace guardado antes del filtro podría ser `javascript:…`; al pintarlo
// se vuelve a comprobar que sea http(s).
export function enlaceSeguro(v: string | null | undefined): string | null {
  return v && /^https?:\/\//i.test(v.trim()) ? v.trim() : null;
}

export function haceRato(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora"; if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60); if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export function PostCard({ post, compacto = false }: { post: ForoPost; compacto?: boolean }) {
  // Editar / borrar lo propio (solo lo ve quien lo escribió).
  const [textoPost, setTextoPost] = useState(post.texto);
  const [tituloPost, setTituloPost] = useState(post.titulo);
  const [editado, setEditado] = useState(post.editado);
  const [editando, setEditando] = useState(false);
  const [borrado, setBorrado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [borrador, setBorrador] = useState(post.texto);

  const [likes, setLikes] = useState(post.likes);
  const [meGusta, setMeGusta] = useState(post.meGusta);
  const [abierto, setAbierto] = useState(false);
  const [resp, setResp] = useState<ForoRespuesta[] | null>(null);

  // Like a una respuesta: se pinta al instante y luego se confirma en el servidor.
  async function likeResp(id: string) {
    setResp((rs) => rs?.map((r) => r.id === id
      ? { ...r, meGusta: !r.meGusta, likes: r.likes + (r.meGusta ? -1 : 1) }
      : r) ?? rs);
    await toggleLikeRespuesta(id);
  }
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
  async function guardarPost() {
    if (!borrador.trim()) return;
    setGuardando(true);
    const r = await editarPost(post.id, borrador, tituloPost ?? undefined);
    setGuardando(false);
    if ("error" in r) { alert(r.error); return; }
    setTextoPost(borrador.trim()); setEditado(true); setEditando(false);
  }
  async function borrarEstePost() {
    if (!confirm("¿Borrar esta publicación? No se puede deshacer.")) return;
    const r = await borrarPost(post.id);
    if ("error" in r) { alert(r.error); return; }
    setBorrado(true);
  }
  async function editarEstaRespuesta(id: string, actual: string) {
    const nuevo = prompt("Edita tu respuesta:", actual);
    if (nuevo === null || !nuevo.trim() || nuevo === actual) return;
    const r = await editarRespuesta(id, nuevo);
    if ("error" in r) { alert(r.error); return; }
    setResp((rs) => rs?.map((x) => x.id === id ? { ...x, texto: nuevo.trim(), editado: true } : x) ?? rs);
  }
  async function borrarEstaRespuesta(id: string) {
    if (!confirm("¿Borrar tu respuesta?")) return;
    const r = await borrarRespuesta(id);
    if ("error" in r) { alert(r.error); return; }
    setResp((rs) => rs?.filter((x) => x.id !== id) ?? rs);
    setNum((n) => Math.max(0, n - 1));
  }

  async function responder() {
    if (!texto.trim()) return;
    const r = await crearRespuesta(post.id, texto);
    if ("error" in r) { alert(r.error); return; }
    setTexto(""); setResp(await getRespuestas(post.id)); setNum((n) => n + 1);
  }

  if (borrado) return null;

  return (
    <article className={compacto ? "bg-bg border border-border rounded-2xl p-4" : "bg-surface border border-border rounded-2xl p-5 shadow-sm"}>
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/app/creador/${post.autorId}`} className="shrink-0">
          {post.autorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.autorAvatar} alt={post.autorNombre} className="w-10 h-10 rounded-full object-cover" />
          ) : <span className="w-10 h-10 rounded-full bg-accent/15 text-accent grid place-items-center text-[13px] font-bold">{post.autorNombre.slice(0, 2).toUpperCase()}</span>}
        </Link>
        <div className="min-w-0">
          <div className="font-bold text-[14px] leading-tight">
            <Link href={`/app/creador/${post.autorId}`} className="hover:text-accent transition">{post.autorNombre}</Link>
            <span className="text-sub font-normal text-[12px]"> · Nivel {post.autorNivel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-hint">{haceRato(post.fecha)}{editado ? " · editado" : ""}</span>
            {post.esNuevo && (
              <span className="text-[10.5px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5">Nuevo</span>
            )}
          </div>
        </div>
        {post.esMio && !editando && (
          <MenuAutor
            onEditar={() => { setBorrador(textoPost); setEditando(true); }}
            onBorrar={borrarEstePost}
          />
        )}
      </div>
      {tituloPost && !editando && (
        <h3 className="font-display font-extrabold text-[15.5px] leading-snug mb-1">{tituloPost}</h3>
      )}
      {editando ? (
        <div>
          {tituloPost !== null && (
            <input value={tituloPost} onChange={(e) => setTituloPost(e.target.value)} maxLength={120}
              placeholder="Título"
              className="w-full mb-2 bg-bg border border-border rounded-xl px-3 py-2 text-[14px] font-bold outline-none focus:border-accent" />
          )}
          <textarea value={borrador} onChange={(e) => setBorrador(e.target.value)} rows={4} maxLength={5000} autoFocus
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-[14px] outline-none focus:border-accent resize-none" />
          <div className="flex items-center gap-2 mt-2">
            <button onClick={guardarPost} disabled={guardando || !borrador.trim()}
              className="bg-accent text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-60 transition">
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button onClick={() => setEditando(false)} disabled={guardando}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-sub hover:bg-bg transition">Cancelar</button>
          </div>
        </div>
      ) : (
        textoPost && <p className="text-[14px] text-text leading-relaxed whitespace-pre-wrap">{textoPost}</p>
      )}
      {post.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imagenUrl} alt="" className="mt-2 rounded-xl border border-border max-h-80 w-auto" />
      )}
      {post.videoUrl && (
        (() => {
          const seguro = enlaceSeguro(post.videoUrl);
          if (!seguro) return null;
          const yt = seguro.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
          return yt
            ? <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-border"><iframe src={`https://www.youtube.com/embed/${yt[1]}`} className="w-full h-full" allowFullScreen title="video" /></div>
            : <a href={seguro} target="_blank" rel="noreferrer" className="text-accent text-[13px] font-semibold underline break-all mt-1 inline-block">🎬 Ver video</a>;
        })()
      )}
      {enlaceSeguro(post.enlaceUrl) && <a href={enlaceSeguro(post.enlaceUrl)!} target="_blank" rel="noreferrer" className="text-accent text-[13px] font-semibold underline break-all mt-1 inline-block">{post.enlaceUrl}</a>}

      <div className="flex items-center gap-5 mt-3 text-[13px]">
        <button onClick={like} className={`flex items-center gap-1.5 font-semibold transition ${meGusta ? "text-pink" : "text-sub hover:text-pink"}`}>
          <Icono nombre={meGusta ? "corazon-lleno" : "corazon"} size={16} /> {likes}
        </button>
        <button onClick={abrir} className="flex items-center gap-1.5 font-semibold text-sub hover:text-accent transition">
          <Icono nombre="comentario-linea" size={16} /> {num} {num === 1 ? "respuesta" : "respuestas"}
        </button>
        {!compacto && <span className="ml-auto text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-0.5 truncate max-w-[45%]">{post.categoria}</span>}
      </div>

      {abierto && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {resp === null ? <p className="text-[13px] text-hint">Cargando…</p> : resp.length === 0 ? <p className="text-[13px] text-hint">Sé el primero en responder.</p> : resp.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Link href={`/app/creador/${c.autorId}`} className="shrink-0">
                {c.autorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.autorAvatar} alt={c.autorNombre} className="w-8 h-8 rounded-full object-cover" />
                ) : <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold">{c.autorNombre.slice(0, 2).toUpperCase()}</span>}
              </Link>
              <div className="flex-1 min-w-0">
                <div className={compacto ? "bg-surface rounded-2xl px-3 py-2" : "bg-bg rounded-2xl px-3 py-2"}>
                  <Link href={`/app/creador/${c.autorId}`} className="font-bold text-[12.5px] hover:text-accent transition">{c.autorNombre}</Link>
                  {c.editado && <span className="text-[11px] text-hint"> · editado</span>}
                  <p className="text-[13.5px] text-text whitespace-pre-wrap">{c.texto}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-1 text-[12px]">
                  <button onClick={() => likeResp(c.id)}
                    className={`flex items-center gap-1 font-semibold transition ${c.meGusta ? "text-pink" : "text-sub hover:text-pink"}`}>
                    <Icono nombre={c.meGusta ? "corazon-lleno" : "corazon"} size={14} /> {c.likes || ""}
                  </button>
                  <button onClick={() => setTexto(`@${c.autorNombre.split(" ")[0]} `)}
                    className="font-semibold text-sub hover:text-accent transition">Responder</button>
                  {c.esMio && (
                    <>
                      <button onClick={() => editarEstaRespuesta(c.id, c.texto)}
                        className="font-semibold text-sub hover:text-accent transition">Editar</button>
                      <button onClick={() => borrarEstaRespuesta(c.id)}
                        className="font-semibold text-sub hover:text-pink transition">Eliminar</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") responder(); }} placeholder="Escribe una respuesta…" maxLength={500}
              className={`flex-1 ${compacto ? "bg-surface" : "bg-bg"} border border-border rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-accent`} />
            <button onClick={responder} disabled={!texto.trim()} className="bg-accent text-white rounded-full px-4 py-2.5 text-[13px] font-bold disabled:opacity-50 hover:brightness-110 transition shrink-0">Enviar</button>
          </div>
        </div>
      )}
    </article>
  );
}

// Menú "⋯" de la autora de la publicación: editar o eliminar lo suyo.
function MenuAutor({ onEditar, onBorrar }: { onEditar: () => void; onBorrar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="relative ml-auto shrink-0">
      <button onClick={() => setAbierto((v) => !v)} aria-label="Opciones de mi publicación"
        className="w-8 h-8 grid place-items-center rounded-full text-hint hover:bg-bg hover:text-text transition">⋯</button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-9 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 w-40 text-[13px]">
            <button onClick={() => { setAbierto(false); onEditar(); }}
              className="w-full text-left px-3 py-2 hover:bg-bg transition font-semibold">✏️ Editar</button>
            <button onClick={() => { setAbierto(false); onBorrar(); }}
              className="w-full text-left px-3 py-2 hover:bg-bg transition font-semibold text-pink">🗑️ Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
}
