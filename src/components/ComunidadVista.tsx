"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { getComentarios, crearComentario, type Post, type Comentario } from "@/lib/comunidad-actions";

export function ComunidadVista({ feed, nombre, avatarUrl, gemas, racha }: {
  feed: Post[]; nombre: string; avatarUrl: string | null; gemas: number; racha: number;
}) {
  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="comunidad" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {gemas}</span>
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <h1 className="font-display text-2xl sm:text-[26px] font-extrabold">Comunidad 💜</h1>
          <p className="text-sub text-[14px] mt-1 mb-6">Mira los avances de otros creadores, apóyalos y comparte los tuyos.</p>

          {feed.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center text-sub">
              <div className="text-4xl mb-2">🌱</div>
              Aún no hay publicaciones. ¡Sé el primero! Completa un reto y publícalo en la comunidad.
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((p) => <PostCard key={`${p.userId}-${p.retoId}`} post={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const [abierto, setAbierto] = useState(false);
  const [coments, setComents] = useState<Comentario[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [num, setNum] = useState(post.numComentarios);

  const esVideo = post.archivoUrl && /\.(mp4|mov|webm|quicktime)(\?|$)/i.test(post.archivoUrl);
  const esImagen = post.archivoUrl && /\.(png|jpe?g|webp)(\?|$)/i.test(post.archivoUrl);
  const textos = Object.values(post.respuestas).filter((v) => v && !/^https?:\/\//.test(v));

  async function toggleComentarios() {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo && coments === null) {
      setComents(await getComentarios(post.userId, post.retoId));
    }
  }

  async function comentar() {
    if (!texto.trim()) return;
    setEnviando(true);
    const r = await crearComentario(post.userId, post.retoId, texto);
    setEnviando(false);
    if ("error" in r) { alert(r.error); return; }
    setTexto("");
    setComents(await getComentarios(post.userId, post.retoId));
    setNum((n) => n + 1);
  }

  return (
    <article className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
      {/* Autor */}
      <div className="flex items-center gap-3 mb-3">
        {post.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.avatar} alt={post.nombre} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-accent/15 text-accent grid place-items-center text-[13px] font-bold">{post.nombre.slice(0, 2).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <div className="font-bold text-[14px] truncate">{post.nombre}</div>
          <div className="text-[12px] text-sub truncate">{post.retoEmoji} {post.retoTitulo}</div>
        </div>
      </div>

      {/* Contenido */}
      {textos.map((t, i) => (
        <p key={i} className="text-[14px] text-text leading-relaxed whitespace-pre-wrap mb-2">{t}</p>
      ))}
      {esImagen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.archivoUrl!} alt="publicación" className="rounded-2xl border border-border mt-1 max-h-96 w-full object-cover" />
      )}
      {esVideo && (
        <video src={post.archivoUrl!} controls className="rounded-2xl border border-border mt-1 w-full max-h-96" />
      )}

      {/* Barra de comentarios */}
      <button onClick={toggleComentarios} className="flex items-center gap-2 text-[13px] text-sub font-semibold mt-3 hover:text-accent transition">
        💬 {num} {num === 1 ? "comentario" : "comentarios"}
      </button>

      {abierto && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {coments === null ? (
            <p className="text-[13px] text-hint">Cargando…</p>
          ) : coments.length === 0 ? (
            <p className="text-[13px] text-hint">Sé el primero en comentar.</p>
          ) : (
            coments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                {c.autorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.autorAvatar} alt={c.autorNombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold shrink-0">{c.autorNombre.slice(0, 2).toUpperCase()}</span>
                )}
                <div className="bg-bg rounded-2xl px-3 py-2 flex-1 min-w-0">
                  <div className="font-bold text-[12.5px]">{c.autorNombre}</div>
                  <p className="text-[13.5px] text-text whitespace-pre-wrap">{c.texto}</p>
                </div>
              </div>
            ))
          )}

          {/* Nuevo comentario */}
          <div className="flex items-center gap-2 pt-1">
            <input value={texto} onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") comentar(); }}
              placeholder="Escribe un comentario…" maxLength={500}
              className="flex-1 bg-bg border border-border rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-accent" />
            <button onClick={comentar} disabled={enviando || !texto.trim()}
              className="bg-accent text-white rounded-full px-4 py-2.5 text-[13px] font-bold disabled:opacity-50 hover:brightness-110 transition shrink-0">
              {enviando ? "…" : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
