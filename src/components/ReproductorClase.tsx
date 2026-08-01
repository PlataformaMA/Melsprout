"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { PopupClaseCompletada } from "@/components/PopupCelebracion";
import { completarClase, guardarPosicion } from "@/lib/progreso-actions";
import { type Clase, type ModuloCurso } from "@/lib/data";

type YtPlayer = { getCurrentTime: () => number; getDuration: () => number; getPlayerState: () => number; seekTo: (s: number, allow: boolean) => void; destroy: () => void };
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YtPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Detecta el tipo de video por su URL (YouTube, Vimeo o archivo directo).
function parseVideo(url: string): { tipo: "youtube" | "vimeo" | "file"; id?: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { tipo: "youtube", id: yt[1] };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { tipo: "vimeo", id: vm[1] };
  return { tipo: "file" };
}

function titleCase(s: string): string {
  return s.split(" ").map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}
function fmtTiempo(seg: number): string {
  const m = Math.floor(seg / 60), s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ReproductorClase({
  clase, modulo, avatarUrl, nombre, gemas, racha, yaCompletada = false, vistoInicial = 0, completadasIds = [], videoUrl = null, siguienteHref = null,
}: {
  clase: Clase; modulo: ModuloCurso; avatarUrl: string | null; nombre: string; gemas: number; racha: number; yaCompletada?: boolean; vistoInicial?: number; completadasIds?: string[]; videoUrl?: string | null; siguienteHref?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const vistoRef = useRef(vistoInicial);   // segundos REALMENTE vistos (arranca de lo ya guardado)
  const lastTimeRef = useRef(0);

  // Mide el 85% por tiempo reproducido real (adelantar la barrita no cuenta).
  function onTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const v = e.currentTarget;
    const delta = v.currentTime - lastTimeRef.current;
    if (delta > 0 && delta < 1.5) vistoRef.current += delta; // solo reproducción normal
    lastTimeRef.current = v.currentTime;
    if (v.duration > 0) setProgreso(Math.min(100, (vistoRef.current / v.duration) * 100));
  }
  const router = useRouter();
  const [reproduciendo, setReproduciendo] = useState(false);
  // La barra se restaura con la duración REAL del video (al cargar), no con el
  // estimado (duracionMin), para no inflar el % y marcar "ya visto" de más.
  const [progreso, setProgreso] = useState(yaCompletada ? 100 : 0);
  const [terminado, setTerminado] = useState(false);
  const [velocidad, setVelocidad] = useState(1); // velocidad de reproducción visible
  const [popup, setPopup] = useState(false);
  const [tabRep, setTabRep] = useState<"recursos" | "clases">("clases");
  const completadoRef = useRef(yaCompletada); // ya alcanzó el 85% (guarda anti-repetición)

  const idx = modulo.clases.findIndex((c) => c.id === clase.id);
  const siguiente = idx >= 0 ? modulo.clases[idx + 1] : undefined;
  const total = modulo.clases.length;
  const posicion = idx + 1;

  // Completación REAL del módulo (para checks + desbloqueo en vivo).
  const [completadas, setCompletadas] = useState<Set<string>>(() => new Set(completadasIds));
  function estadoClase(i: number): "completada" | "actual" | "bloqueada" {
    const c = modulo.clases[i];
    if (completadas.has(c.id)) return "completada";
    if (i === 0 || completadas.has(modulo.clases[i - 1].id)) return "actual"; // desbloqueada (la que sigue)
    return "bloqueada";
  }

  const totalSeg = clase.duracionMin * 60;
  const curSeg = (progreso / 100) * totalSeg;
  const video = videoUrl ? parseVideo(videoUrl) : null;

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

  // Guarda el avance (segundos vistos) cada 15s y al salir, para que NO se pierda.
  useEffect(() => {
    const guardar = () => { if (vistoRef.current > 0) guardarPosicion(clase.id, vistoRef.current); };
    const t = setInterval(guardar, 15000);
    return () => { clearInterval(t); guardar(); };
  }, [clase.id]);

  // Al llegar al 85% real: clase completada (+100 XP una sola vez) y desbloquea la siguiente.
  useEffect(() => {
    if (progreso < 85 || completadoRef.current) return;
    completadoRef.current = true;
    (async () => {
      setTerminado(true);
      const r = await completarClase(clase.id);
      if (!("error" in r)) {
        // Marca la clase como completada (check) y desbloquea la siguiente en vivo.
        setCompletadas((prev) => new Set(prev).add(clase.id));
        if (r.xpDado) { setPopup(true); router.refresh(); } // +100 XP solo la primera vez
      }
    })();
  }, [progreso, clase.id, router]);

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
      {popup && (
        <PopupClaseCompletada
          completadas={posicion}
          total={total}
          onContinuar={() => { setPopup(false); router.push(siguienteHref ?? "/app/ruta"); }}
          onClose={() => setPopup(false)}
        />
      )}
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
              {video && videoUrl ? (
                <div className="relative">
                  {video.tipo === "youtube" && video.id ? (
                    <YouTubePlayer videoId={video.id} vistoInicial={vistoInicial}
                      onProgress={(pct, seg) => { setProgreso(pct); vistoRef.current = seg; }} />
                  ) : video.tipo === "vimeo" && video.id ? (
                    <iframe src={`https://player.vimeo.com/video/${video.id}`} allow="autoplay; fullscreen; picture-in-picture"
                      className="w-full aspect-video rounded-2xl bg-black shadow-lg" title={clase.titulo} />
                  ) : (
                    <video ref={videoRef} src={videoUrl} controls playsInline
                      onTimeUpdate={onTimeUpdate}
                      onEnded={() => setTerminado(true)}
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        if (v.duration > 0 && vistoInicial > 0) {
                          if (vistoInicial < v.duration) { v.currentTime = vistoInicial; lastTimeRef.current = vistoInicial; }
                          setProgreso(Math.min(100, (vistoInicial / v.duration) * 100)); // % con duración REAL
                        }
                      }}
                      className="w-full rounded-2xl aspect-video bg-black shadow-lg" />
                  )}
                  {/* Selector de velocidad — DENTRO del reproductor (esquina sup. der.), solo video propio MP4 */}
                  {video.tipo !== "youtube" && video.tipo !== "vimeo" && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5 bg-black/60 backdrop-blur rounded-full px-1 py-1 shadow-lg">
                      {[1, 1.25, 1.5, 2].map((v) => (
                        <button key={v} type="button"
                          onClick={() => { setVelocidad(v); if (videoRef.current) videoRef.current.playbackRate = v; }}
                          className={`text-[11px] sm:text-[12px] font-bold rounded-full px-2 sm:px-2.5 py-0.5 transition ${velocidad === v ? "bg-white text-accent" : "text-white/90 hover:bg-white/25"}`}>
                          {v}x
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 h-1.5 rounded-full bg-[#EEEBF6] overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.round(progreso)}%` }} />
                  </div>
                  {video.tipo === "vimeo" ? (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[12px] text-sub">{progreso >= 85 ? "✅ completada" : "Marca la clase cuando la termines"}</span>
                      {progreso < 85 && <button onClick={() => setProgreso(100)} className="text-[12px] font-bold text-accent hover:underline">Marcar como vista ✓</button>}
                    </div>
                  ) : (
                    <div className="text-[12px] text-sub mt-1">{Math.round(progreso)}% visto {progreso >= 85 ? "· ✅ completada" : "· la clase se completa al 85%"}</div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-video"
                  style={{ background: "linear-gradient(120deg,#7C3AED 0%,#4F46E5 45%,#2563EB 100%)" }}>
                  <div className="absolute inset-0 grid place-items-center text-center px-8">
                    <div>
                      <span className="inline-block bg-white/20 text-white text-[12px] font-bold rounded-full px-3 py-1 mb-3 backdrop-blur">DEMO</span>
                      <h2 className="font-display text-white text-3xl sm:text-4xl font-extrabold leading-tight drop-shadow">{titleCase(clase.titulo)}</h2>
                      <p className="text-white/80 text-sm mt-2">con {clase.instructor} · {clase.duracionMin} min</p>
                      <p className="text-white/70 text-[12px] mt-3">Sin video aún — el admin puede subirlo. Simula el avance con play.</p>
                    </div>
                  </div>
                  <button onClick={togglePlay} className="absolute inset-0 grid place-items-center group" aria-label={reproduciendo ? "Pausar" : "Reproducir"}>
                    <span className="w-16 h-16 rounded-full bg-black/35 group-hover:bg-black/50 backdrop-blur grid place-items-center text-white transition">
                      {reproduciendo ? <PauseIcon big /> : <PlayIcon big />}
                    </span>
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/55 to-transparent">
                    <div className="h-1.5 rounded-full bg-white/30 mb-3 cursor-pointer" onClick={seek}>
                      <div className="h-full rounded-full bg-white relative" style={{ width: `${progreso}%` }}>
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                      <button onClick={togglePlay}>{reproduciendo ? <PauseIcon /> : <PlayIcon />}</button>
                      <span className="text-[12px] ml-1">{fmtTiempo(curSeg)} / {fmtTiempo(totalSeg)}</span>
                    </div>
                  </div>
                </div>
              )}

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
                  <Link href={`/app/reto/${clase.id}`} className="flex items-center gap-2 bg-accent text-white font-bold text-sm rounded-xl px-5 py-2.5 hover:brightness-110 transition shadow-sm shadow-accent/30">
                    <SparkleMini /> Continuar al reto
                  </Link>
                  {(terminado || completadas.has(clase.id)) && siguienteHref && (
                    <Link href={siguienteHref} className="flex items-center gap-2 bg-green text-white border border-green rounded-xl px-4 py-2.5 font-bold text-sm hover:brightness-110 transition shadow-sm">
                      Siguiente clase <NextIcon small />
                    </Link>
                  )}
                </div>
              </div>

              {/* ——— Bloque MÓVIL: progreso + tabs (Recursos | Clases) ——— */}
              <div className="lg:hidden mt-5">
                {/* Progreso */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-extrabold">Progreso</h3>
                  <span className="text-accent font-display font-extrabold">{posicion}/{total}</span>
                </div>
                <div className="relative flex items-center gap-2 mb-5">
                  <div className="relative flex-1 h-3 rounded-full bg-[#E7E3F3]">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8B5CF6] to-accent" style={{ width: `${(posicion / total) * 100}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${(posicion / total) * 100}% - 16px)` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/octi.png" alt="Octi" width={32} className="select-none" draggable={false} />
                    </div>
                  </div>
                  <span className="text-xl">🏆</span>
                </div>
                {/* Tabs */}
                <div className="flex gap-6 border-b border-border mb-4">
                  {(["recursos", "clases"] as const).map((t) => (
                    <button key={t} onClick={() => setTabRep(t)}
                      className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 ${tabRep === t ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
                      {t === "recursos" ? "Recursos" : "Clases"}
                    </button>
                  ))}
                </div>
                {tabRep === "clases" ? (
                  <div className="space-y-3">
                    {modulo.clases.map((c, i) => {
                      const estado = estadoClase(i);
                      return (
                        <Link key={c.id} href={estado === "bloqueada" ? "#" : `/app/clase/${c.id}`}
                          className={`flex items-center gap-3 ${estado === "bloqueada" ? "opacity-60 cursor-default" : "hover:bg-bg"} rounded-xl p-1.5 -m-1.5 transition`}>
                          <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 grid place-items-center text-white" style={{ background: "linear-gradient(120deg,#7C3AED,#2563EB)" }}>
                            <span className="text-[7px] font-bold leading-none text-center px-1 opacity-90">EN VIVO</span>
                            {estado !== "completada" && (
                              <span className="absolute inset-0 grid place-items-center bg-black/25">{estado === "actual" ? <PlayIcon /> : <MiniLock />}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold leading-tight ${estado === "actual" ? "text-accent" : "text-text"}`}>{titleCase(c.titulo)}</div>
                          </div>
                          {estado === "completada" ? <span className="w-5 h-5 rounded-full bg-green text-white grid place-items-center text-[11px] shrink-0">✓</span> : estado === "bloqueada" ? <MiniLock /> : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 bg-accent-soft/60 rounded-xl px-3.5 py-3">
                      <span className="text-accent"><DocIcon /></span>
                      <span className="flex-1 text-sm font-semibold">{titleCase(clase.titulo).split(" ")[0]}.Pdf</span>
                      <button className="text-accent" aria-label="Descargar"><DownloadIcon /></button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reto de esta clase */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm mt-5">
                <h3 className="font-display font-extrabold mb-1.5">🎯 Reto de la clase</h3>
                <p className="text-sub text-sm">{clase.reto}</p>
              </section>

            </div>

            {/* ——— Columna derecha (desktop) ——— */}
            <aside className="hidden lg:block space-y-5 lg:sticky lg:top-5">
              {/* Progreso */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold mb-3">Progreso</h3>
                <div className="text-accent font-display font-extrabold text-lg mb-2">{posicion}/{total}</div>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1 h-3 rounded-full bg-[#E7E3F3]">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8B5CF6] to-accent" style={{ width: `${(posicion / total) * 100}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${(posicion / total) * 100}% - 16px)` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/octi.png" alt="Octi" width={32} className="select-none" draggable={false} />
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
                    const estado = estadoClase(i);
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
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reproductor de YouTube con medición de tiempo REALMENTE visto (adelantar no cuenta) → 85%.
function YouTubePlayer({ videoId, vistoInicial = 0, onProgress }: { videoId: string; vistoInicial?: number; onProgress: (p: number, seg: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const vistoRef = useRef(vistoInicial);
  const lastRef = useRef(0);

  useEffect(() => {
    let player: YtPlayer | undefined;
    let intervalo: ReturnType<typeof setInterval> | undefined;
    let cancelado = false;

    function iniciar() {
      if (cancelado || !ref.current || !window.YT) return;
      player = new window.YT.Player(ref.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            // Reanuda donde se quedó.
            if (vistoInicial > 0) { try { player?.seekTo(vistoInicial, true); } catch { /* noop */ } }
            intervalo = setInterval(() => {
              if (!player) return;
              const t = player.getCurrentTime();
              const d = player.getDuration();
              if (player.getPlayerState() === 1) {
                const delta = t - lastRef.current;
                if (delta > 0 && delta < 1.5) vistoRef.current += delta; // solo reproducción normal
              }
              lastRef.current = t;
              if (d > 0) onProgress(Math.min(100, (vistoRef.current / d) * 100), vistoRef.current);
            }, 1000);
          },
        },
      });
    }

    if (window.YT?.Player) {
      iniciar();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); iniciar(); };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelado = true;
      if (intervalo) clearInterval(intervalo);
      try { player?.destroy(); } catch { /* noop */ }
    };
  }, [videoId, vistoInicial, onProgress]);

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
      <div ref={ref} className="w-full h-full" />
    </div>
  );
}

function Counter({ icon, valor }: { icon: string; valor: number }) {
  return <div className="flex items-center gap-1.5"><span className="text-lg">{icon}</span><span className="font-display font-extrabold text-[15px] text-text">{valor}</span></div>;
}

function PlayIcon({ big }: { big?: boolean }) { const s = big ? 30 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>; }
function PauseIcon({ big }: { big?: boolean }) { const s = big ? 30 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>; }
function NextIcon({ small }: { small?: boolean }) { const s = small ? 16 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5.5l10 6.5-10 6.5z" /></svg>; }
function BellIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>; }
function DocIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h6" /></svg>; }
function DownloadIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5M4 21h16" /></svg>; }
function UploadIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9M7 13l5-5 5 5M4 5h16" /></svg>; }
function SparkleMini() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>; }
function MiniLock() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>; }
