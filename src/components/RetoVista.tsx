"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import type { RetoDef, PasoReto } from "@/lib/retos";
import { guardarReto, subirImagenReto, type RetoGuardado } from "@/lib/retos-actions";

type Perfil = { full_name: string | null; avatar_url: string | null; racha: number; gemas: number };

// Convierte un archivo de imagen a dataURL (sin recortar).
function imagenADataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

export function RetoVista({
  reto,
  perfil,
  guardado,
}: {
  reto: RetoDef;
  perfil: Perfil;
  guardado: RetoGuardado;
}) {
  const router = useRouter();
  const [resp, setResp] = useState<Record<string, string>>(guardado?.respuestas || {});
  const [archivoUrl, setArchivoUrl] = useState<string | null>(guardado?.archivo_url ?? null);
  const [videoNombre, setVideoNombre] = useState<string>("");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState<"borrador" | "publicado" | null>(null);
  const [modal, setModal] = useState<"borrador" | "publicado" | null>(null);
  const [error, setError] = useState("");

  const set = (id: string, v: string) => setResp((p) => ({ ...p, [id]: v }));

  async function subirArchivo(paso: PasoReto, file: File) {
    setError("");
    if (paso.archivoImagen) {
      setSubiendo(true);
      try {
        const dataUrl = await imagenADataUrl(file);
        const r = await subirImagenReto(reto.claseId, dataUrl);
        if ("error" in r) setError(r.error);
        else setArchivoUrl(r.url);
      } catch {
        setError("No se pudo procesar la imagen.");
      }
      setSubiendo(false);
    } else {
      // Video: por ahora se registra el nombre (hosting de video pesado es un paso aparte).
      setVideoNombre(`${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      set(paso.id, file.name);
    }
  }

  async function guardar(estado: "borrador" | "publicado") {
    setError("");
    setGuardando(estado);
    const r = await guardarReto(reto.claseId, resp, estado, archivoUrl, reto.xp);
    setGuardando(null);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    setModal(estado);
    router.refresh();
  }

  const nombre = perfil.full_name || "Creador";

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="retos" />

      <div className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5">
          {/* Barra superior */}
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <Counter icon="🔥" valor={perfil.racha} />
            <Counter icon="💎" valor={perfil.gemas} />
            <button className="relative w-9 h-9 rounded-full bg-surface border border-border grid place-items-center" aria-label="Notificaciones">
              <BellIcon />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            </button>
            <UserMenu avatarUrl={perfil.avatar_url} nombre={nombre} />
          </header>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] mb-4">
            <Link href="/app/retos" className="text-accent font-semibold hover:underline">{reto.modulo}</Link>
            <span className="text-hint">›</span>
            <span className="text-sub">Reto</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* ——— Columna principal ——— */}
            <div>
              <h1 className="font-display text-2xl sm:text-[28px] font-extrabold leading-tight">
                Reto: {reto.titulo} <span>{reto.emoji}</span>
              </h1>
              <p className="text-sub mt-1.5">{reto.descripcion}</p>

              {/* Banner intro */}
              <div className="mt-5 rounded-2xl p-4 flex items-center gap-4" style={{ background: "linear-gradient(120deg,#F3F0FF,#FBFAFF)", border: "1px solid var(--color-accent-soft, #ECE6FB)" }}>
                <div className="w-11 h-11 rounded-xl bg-accent grid place-items-center text-white shrink-0">
                  <Sparkle />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-sub leading-snug">{reto.intro}</p>
                  <p className="text-[14px] text-accent font-bold mt-1">Al completarlo y {reto.accion} en la comunidad ganarás +{reto.xp} XP.</p>
                </div>
                <span className="bg-accent text-white text-[13px] font-extrabold rounded-lg px-3 py-1.5 shrink-0">+{reto.xp} XP</span>
              </div>

              {/* Pasos */}
              <div className="mt-5 space-y-4">
                {reto.pasos.map((paso, i) => (
                  <div key={paso.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-accent text-white grid place-items-center text-[13px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <div>
                          <h3 className="font-display font-extrabold">{paso.titulo}</h3>
                          {paso.subtitulo && <p className="text-[13px] text-sub mt-0.5">{paso.subtitulo}</p>}
                        </div>
                      </div>
                      <span className="text-accent shrink-0">{i === 0 ? <HeartOutline /> : <Target />}</span>
                    </div>

                    <div className="mt-4">
                      {paso.tipo === "archivo" ? (
                        <FileField paso={paso} archivoUrl={archivoUrl} videoNombre={videoNombre} subiendo={subiendo} onFile={(f) => subirArchivo(paso, f)} />
                      ) : paso.tipo === "texto" ? (
                        <div>
                          <input
                            type="text"
                            maxLength={paso.max}
                            value={resp[paso.id] || ""}
                            onChange={(e) => set(paso.id, e.target.value)}
                            placeholder={paso.placeholder}
                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-accent"
                          />
                          {paso.max && <div className="text-right text-[12px] text-hint mt-1">{(resp[paso.id] || "").length}/{paso.max}</div>}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            maxLength={paso.max}
                            rows={4}
                            value={resp[paso.id] || ""}
                            onChange={(e) => set(paso.id, e.target.value)}
                            placeholder={paso.placeholder}
                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-accent resize-none"
                          />
                          {paso.max && <div className="text-right text-[12px] text-hint mt-1">{(resp[paso.id] || "").length}/{paso.max}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Tips */}
                <div className="rounded-2xl p-4" style={{ background: "linear-gradient(120deg,#F6F3FF,#FBFAFF)" }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-accent">💡</span>
                    <span className="text-[13px] font-bold text-accent">{reto.tips.titulo}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {reto.tips.items.map((t) => (
                      <span key={t} className="flex items-center gap-1.5 text-[13px] text-sub">
                        <CheckCircle /> {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-4">{error}</p>}

              {/* Acciones */}
              <div className="flex items-center justify-between gap-3 mt-6">
                <button
                  onClick={() => guardar("borrador")}
                  disabled={guardando !== null}
                  className="flex items-center gap-2 bg-surface border border-border rounded-xl px-5 py-3 text-[14px] font-semibold hover:bg-bg disabled:opacity-60 transition"
                >
                  <BookmarkIcon /> {guardando === "borrador" ? "Guardando…" : "Guardar borrador"}
                </button>
                <button
                  onClick={() => guardar("publicado")}
                  disabled={guardando !== null}
                  className="flex items-center gap-2 bg-accent text-white rounded-xl px-6 py-3 text-[14px] font-bold hover:brightness-110 disabled:opacity-60 transition shadow-sm"
                >
                  <UploadIcon /> {guardando === "publicado" ? "Publicando…" : "Publicar en la comunidad"}
                </button>
              </div>
            </div>

            {/* ——— Columna derecha ——— */}
            <aside className="space-y-5 lg:sticky lg:top-5 self-start">
              {/* Sobre este reto */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FlagIcon />
                  <h2 className="font-display font-extrabold">Sobre este reto</h2>
                </div>
                <div className="space-y-3">
                  {reto.sobre.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13px] text-sub">
                      <span className="text-hint shrink-0 mt-0.5"><MiniDot /></span>
                      <span>{b}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[13px] text-accent font-bold pt-1">
                    <GemIcon /> Recompensa: +{reto.xp} XP
                  </div>
                </div>
              </section>

              {/* Ejemplo de publicación */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h2 className="font-display font-extrabold mb-4">{reto.ejemplo.tituloCard}</h2>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[13px] font-bold">VL</span>
                  <div>
                    <div className="font-bold text-[14px] leading-tight">{reto.ejemplo.autor}</div>
                    <div className="text-[12px] text-sub">{reto.ejemplo.rol}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {reto.ejemplo.bloques.map((bl, i) => (
                    <div key={i}>
                      <div className="text-accent font-bold text-[14px]">{bl.titulo}</div>
                      {bl.texto && <p className="text-[13px] text-sub mt-0.5 leading-relaxed">{bl.texto}</p>}
                      {bl.video && (
                        <div className="mt-2 rounded-xl overflow-hidden bg-gradient-to-br from-[#E9D8FD] to-[#F3E8FF] aspect-video grid place-items-center relative">
                          <span className="w-12 h-12 rounded-full bg-white/90 grid place-items-center text-accent text-xl shadow">▶</span>
                          <span className="absolute top-2 right-2 bg-black/60 text-white text-[11px] rounded px-1.5 py-0.5">0:26</span>
                        </div>
                      )}
                      {bl.imagen && (
                        <div className="mt-2 rounded-xl bg-[#1f2937] text-white/90 p-3 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-white/20" />
                            <div className="flex gap-3 text-center">
                              <div><div className="font-bold">342</div><div className="opacity-70">Publicaciones</div></div>
                              <div><div className="font-bold">12.8K</div><div className="opacity-70">Seguidores</div></div>
                              <div><div className="font-bold">1,024</div><div className="opacity-70">Seguidos</div></div>
                            </div>
                          </div>
                          <div className="mt-2 font-semibold">Melissa Arria | Marketing para Creadores</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border text-[13px] text-sub">
                  <span className="flex items-center gap-1.5"><HeartOutline /> 128</span>
                  <span className="flex items-center gap-1.5"><ChatIcon /> 32</span>
                  <span className="flex items-center gap-1.5 ml-auto"><BookmarkIcon /> Guardar</span>
                </div>
              </section>

              {/* Consejo de hoy */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-accent">💡</span>
                  <h2 className="font-display font-extrabold">Consejo de hoy</h2>
                </div>
                <p className="text-[13px] text-sub leading-relaxed">{reto.consejo}</p>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Modal Octi */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/octi.webp" alt="Octi" width={130} height={130} className="mx-auto" />
            <h3 className="font-display text-2xl font-extrabold mt-2">
              {modal === "publicado" ? "¡Reto publicado! 🎉" : "¡Reto guardado! 🎉"}
            </h3>
            <p className="text-sub text-[14px] mt-1.5">
              {modal === "publicado"
                ? `Ganaste +${reto.xp} XP. Tu avance se compartió con la comunidad.`
                : "Tu avance se guardó como borrador."}
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/app/ruta" className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 text-[14px] font-semibold hover:bg-bg transition">
                <MapMini /> Volver al camino
              </Link>
              <Link href="/app/retos" className="flex items-center gap-2 bg-accent text-white rounded-xl px-4 py-3 text-[14px] font-bold hover:brightness-110 transition">
                Ver más retos ›
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ————————————— Subcomponentes —————————————
function FileField({ paso, archivoUrl, videoNombre, subiendo, onFile }: {
  paso: PasoReto; archivoUrl: string | null; videoNombre: string; subiendo: boolean; onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tieneImagen = paso.archivoImagen && archivoUrl;
  const tieneVideo = !paso.archivoImagen && videoNombre;

  return (
    <div>
      <input ref={inputRef} type="file" accept={paso.acepta} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {tieneImagen ? (
        <div className="flex items-center gap-3 border border-border rounded-xl p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={archivoUrl!} alt="captura" className="w-20 h-20 rounded-lg object-cover" />
          <div className="flex-1 text-[13px] text-sub">Captura subida ✓</div>
          <button onClick={() => inputRef.current?.click()} className="text-[13px] text-accent font-semibold">Cambiar</button>
        </div>
      ) : tieneVideo ? (
        <div className="flex items-center gap-3 border border-border rounded-xl p-3">
          <span className="w-12 h-12 rounded-lg bg-accent/10 text-accent grid place-items-center">🎬</span>
          <div className="flex-1 text-[13px] text-sub truncate">{videoNombre}</div>
          <button onClick={() => inputRef.current?.click()} className="text-[13px] text-accent font-semibold">Cambiar</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={subiendo}
          className="w-full border border-dashed border-accent/40 bg-accent-soft/40 rounded-xl p-5 flex items-center gap-3 hover:bg-accent-soft transition disabled:opacity-60">
          <span className="w-11 h-11 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0"><UploadIcon /></span>
          <div className="text-left">
            <div className="font-bold text-[14px]">{subiendo ? "Subiendo…" : "Sube tu archivo aquí"}</div>
            {paso.ayudaArchivo && <div className="text-[12px] text-sub">{paso.ayudaArchivo}</div>}
          </div>
        </button>
      )}
    </div>
  );
}

function Counter({ icon, valor }: { icon: string; valor: number }) {
  return (
    <span className="flex items-center gap-1.5 text-[14px] font-bold">
      <span>{icon}</span>
      <span>{valor}</span>
    </span>
  );
}

// ————————————— Iconos —————————————
function Sparkle() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>; }
function BellIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" /></svg>; }
function HeartOutline() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>; }
function Target() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>; }
function CheckCircle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>; }
function FlagIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4M4 4h13l-2 4 2 4H4" /></svg>; }
function MiniDot() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" strokeLinecap="round" /></svg>; }
function GemIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="#7c3aed"><path d="M6 3h12l3 5-9 13L3 8z" /></svg>; }
function ChatIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" /></svg>; }
function BookmarkIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4z" /></svg>; }
function UploadIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>; }
function MapMini() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>; }
