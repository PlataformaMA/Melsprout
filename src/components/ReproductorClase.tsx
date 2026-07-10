"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { type Clase, type ModuloCurso } from "@/lib/data";

function titleCase(s: string): string {
  return s.split(" ").map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}
function fmtTiempo(seg: number): string {
  const m = Math.floor(seg / 60), s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ReproductorClase({
  clase, modulo, avatarUrl, nombre, gemas, racha,
}: {
  clase: Clase; modulo: ModuloCurso; avatarUrl: string | null; nombre: string; gemas: number; racha: number;
}) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0); // 0–100 del video
  const [terminado, setTerminado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const idx = modulo.clases.findIndex((c) => c.id === clase.id);
  const siguiente = modulo.clases[idx + 1];
  const total = modulo.clases.length;
  const posicion = idx + 1;

  const totalSeg = clase.duracionMin * 60;
  const curSeg = (progreso / 100) * totalSeg;

  // Avance del video (simulado hasta conectar el video real).
  useEffect(() => {
    if (!reproduciendo || terminado) return;
    const t = setInterval(() => {
      setProgreso((p) => {
        const n = p + 1.5;
        if (n >= 100) { setReproduciendo(false); setTerminado(true); return 100; }
        return n;
      });
    }, 200);
    return () => clearInterval(t);
  }, [reproduciendo, terminado]);

  function togglePlay() {
    if (terminado) { setTerminado(false); setProgreso(0); setReproduciendo(true); return; }
    setReproduciendo((v) => !v);
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    setProgreso(f);
    if (f >= 99) { setTerminado(true); setReproduciendo(false); } else setTerminado(false);
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="clases" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-4 h-10">
            <Counter icon="🔥" valor={racha} />
            <Counter icon="💎" valor={gemas} />
            <button className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-surface transition" aria-label="Notificaciones">
              <BellIcon /><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <div className="flex items-center gap-3 mb-4">
            <Link href="/app/ruta" className="text-sub hover:text-text text-sm">← Ruta</Link>
            <h1 className="font-display text-2xl font-extrabold">{titleCase(clase.titulo)}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* ——— Reproductor ——— */}
            <div className="min-w-0">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-video"
                style={{ background: "linear-gradient(120deg,#7C3AED 0%,#4F46E5 45%,#2563EB 100%)" }}>
                {/* Portada / contenido */}
                <div className="absolute inset-0 grid place-items-center text-center px-8">
                  <div>
                    <span className="inline-block bg-white/20 text-white text-[12px] font-bold rounded-full px-3 py-1 mb-3 backdrop-blur">EN VIVO</span>
                    <h2 className="font-display text-white text-3xl sm:text-4xl font-extrabold leading-tight drop-shadow">{titleCase(clase.titulo)}</h2>
                    <p className="text-white/80 text-sm mt-2">con {clase.instructor} · {clase.duracionMin} min</p>
                  </div>
                </div>

                {/* Botón grande play/pausa central */}
                <button onClick={togglePlay}
                  className="absolute inset-0 grid place-items-center group" aria-label={reproduciendo ? "Pausar" : "Reproducir"}>
                  <span className="w-16 h-16 rounded-full bg-black/35 group-hover:bg-black/50 backdrop-blur grid place-items-center text-white transition">
                    {reproduciendo ? <PauseIcon big /> : <PlayIcon big />}
                  </span>
                </button>

                {/* Barra de controles */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/55 to-transparent">
                  <div className="h-1.5 rounded-full bg-white/30 mb-3 cursor-pointer" onClick={seek}>
                    <div className="h-full rounded-full bg-white relative" style={{ width: `${progreso}%` }}>
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                    <button onClick={togglePlay}>{reproduciendo ? <PauseIcon /> : <PlayIcon />}</button>
                    <button><PrevIcon /></button>
                    <button><NextIcon /></button>
                    <span className="text-[12px] ml-1">{fmtTiempo(curSeg)} / {fmtTiempo(totalSeg)}</span>
                    <div className="ml-auto flex items-center gap-4">
                      <button aria-label="Volumen"><VolIcon /></button>
                      <button aria-label="Chat"><ChatIcon /></button>
                      <button aria-label="Pantalla completa"><FullIcon /></button>
                      <button aria-label="Más">⋮</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructor + acciones */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A78BFA] to-accent grid place-items-center text-white font-bold shrink-0">
                    {clase.instructor.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-display font-extrabold">{clase.instructor}</div>
                    <div className="text-[12px] text-sub">Instructor</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/app/ruta" className="flex items-center gap-2 bg-accent text-white font-bold text-sm rounded-xl px-5 py-2.5 hover:brightness-110 transition shadow-sm shadow-accent/30">
                    <SparkleMini /> Continuar al reto
                  </Link>
                  {terminado && siguiente && (
                    <Link href={`/app/clase/${siguiente.id}`} className="flex items-center gap-2 border border-border rounded-xl px-4 py-2.5 font-bold text-sm text-sub hover:bg-surface transition">
                      Siguiente clase <NextIcon small />
                    </Link>
                  )}
                </div>
              </div>

              {/* Reto de esta clase */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm mt-5">
                <h3 className="font-display font-extrabold mb-1.5">🎯 Reto de la clase</h3>
                <p className="text-sub text-sm">{clase.reto}</p>
              </section>

            </div>

            {/* ——— Columna derecha ——— */}
            <aside className="space-y-5 lg:sticky lg:top-5">
              {/* Progreso */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold mb-3">Progreso</h3>
                <div className="text-accent font-display font-extrabold text-lg mb-2">{posicion}/{total}</div>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1 h-3 rounded-full bg-[#E7E3F3]">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8B5CF6] to-accent" style={{ width: `${(posicion / total) * 100}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${(posicion / total) * 100}% - 16px)` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/octi.webp" alt="Octi" width={32} className="select-none" draggable={false} />
                    </div>
                  </div>
                  <span className="text-xl">🏆</span>
                </div>
              </section>

              {/* Clases del módulo */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold mb-4">Clases Del Módulo</h3>
                <div className="space-y-3">
                  {modulo.clases.map((c, i) => {
                    const estado = i < idx ? "completada" : i === idx ? "actual" : "bloqueada";
                    return (
                      <Link key={c.id} href={estado === "bloqueada" ? "#" : `/app/clase/${c.id}`}
                        className={`flex items-center gap-3 ${estado === "bloqueada" ? "opacity-60 cursor-default" : "hover:bg-bg"} rounded-xl p-1.5 -m-1.5 transition`}>
                        <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 grid place-items-center text-white"
                          style={{ background: "linear-gradient(120deg,#7C3AED,#2563EB)" }}>
                          <span className="text-[7px] font-bold leading-none text-center px-1 opacity-90">EN VIVO</span>
                          {estado !== "completada" && (
                            <span className="absolute inset-0 grid place-items-center bg-black/25">
                              {estado === "actual" ? <PlayIcon /> : <MiniLock />}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold leading-tight ${estado === "actual" ? "text-accent" : "text-text"}`}>{titleCase(c.titulo)}</div>
                        </div>
                        {estado === "completada"
                          ? <span className="w-5 h-5 rounded-full bg-green text-white grid place-items-center text-[11px] shrink-0">✓</span>
                          : estado === "bloqueada" ? <MiniLock /> : null}
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Recursos */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold mb-4">Recursos</h3>
                <div className="flex items-center gap-3 bg-accent-soft/60 rounded-xl px-3.5 py-3">
                  <span className="text-accent"><DocIcon /></span>
                  <span className="flex-1 text-sm font-semibold">{titleCase(clase.titulo).split(" ")[0]}.Pdf</span>
                  <button className="text-accent" aria-label="Descargar"><DownloadIcon /></button>
                </div>
                {/* Subir recurso */}
                <button onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-accent/40 text-accent font-bold text-sm rounded-xl py-2.5 mt-3 hover:bg-accent-soft transition">
                  <UploadIcon /> Subir recurso
                </button>
                <input ref={fileRef} type="file" className="hidden" />
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Counter({ icon, valor }: { icon: string; valor: number }) {
  return <div className="flex items-center gap-1.5"><span className="text-lg">{icon}</span><span className="font-display font-extrabold text-[15px] text-text">{valor}</span></div>;
}

function PlayIcon({ big }: { big?: boolean }) { const s = big ? 30 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>; }
function PauseIcon({ big }: { big?: boolean }) { const s = big ? 30 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>; }
function PrevIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5.5v13l-10-6.5z" /></svg>; }
function NextIcon({ small }: { small?: boolean }) { const s = small ? 16 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5.5l10 6.5-10 6.5z" /></svg>; }
function VolIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>; }
function ChatIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" /></svg>; }
function FullIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" /></svg>; }
function BellIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>; }
function DocIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h6" /></svg>; }
function DownloadIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5M4 21h16" /></svg>; }
function UploadIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9M7 13l5-5 5 5M4 5h16" /></svg>; }
function SparkleMini() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>; }
function MiniLock() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>; }
