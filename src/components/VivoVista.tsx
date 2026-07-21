"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { asistirClaseVivo, type ClaseVivo } from "@/lib/vivo-actions";
import { useRouter } from "next/navigation";

type Props = {
  clases: ClaseVivo[]; asistidas: string[]; nombre: string; avatarUrl: string | null; gemas: number; racha: number;
};

function estadoDe(c: ClaseVivo): "en_vivo" | "proxima" | "terminada" {
  const ini = new Date(c.inicia_at).getTime();
  const fin = ini + c.duracion_min * 60000;
  const now = Date.now();
  if (now >= ini && now <= fin) return "en_vivo";
  if (now < ini) return "proxima";
  return "terminada";
}
function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function dur(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function VivoVista({ clases, asistidas, nombre, avatarUrl, gemas, racha }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"clases" | "grabaciones">("clases");
  const [popup, setPopup] = useState(false);
  const [asist, setAsist] = useState<string[]>(asistidas);

  useEffect(() => {
    if (localStorage.getItem("melsprout_vivo_intro")) return;
    const id = requestAnimationFrame(() => setPopup(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const cerrarIntro = () => { localStorage.setItem("melsprout_vivo_intro", "1"); setPopup(false); };

  const proximas = clases.filter((c) => estadoDe(c) !== "terminada");
  const grabaciones = clases.filter((c) => c.grabacion_url);

  async function asistir(c: ClaseVivo) {
    const st = estadoDe(c);
    if (st === "en_vivo" && c.stream_url) window.open(c.stream_url, "_blank");
    const r = await asistirClaseVivo(c.id);
    if (!("error" in r)) { setAsist((a) => [...a, c.id]); if (r.xpDado) router.refresh(); }
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {popup && <ComoFuncionaPopup onClose={cerrarIntro} />}
      <AppSidebar active="vivo" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {gemas}</span>
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Clases en vivo</h1>

          {/* Banner Octi */}
          <div className="mt-4 rounded-3xl p-5 flex items-center gap-4 shadow-sm" style={{ background: "linear-gradient(120deg,#F3F0FF,#FBFAFF)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/octi.webp" alt="Octi" width={80} height={80} className="shrink-0 hidden sm:block" />
            <div>
              <p className="text-accent font-bold text-[15px]">Aprende en tiempo real con los mejores creadores.</p>
              <p className="text-[13.5px] text-sub mt-1">Asistir da <b className="text-accent">+50 XP</b> (mínimo 10 minutos dentro; entrar y salirse no cuenta). 💎</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
            <div>
              {/* Tabs */}
              <div className="flex gap-6 border-b border-border mb-5">
                {(["clases", "grabaciones"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 ${tab === t ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
                    {t === "clases" ? "Clases" : "Grabaciones"}
                  </button>
                ))}
              </div>

              {tab === "clases" ? (
                <>
                  <h2 className="font-display font-extrabold text-lg">Próximas clases</h2>
                  <p className="text-[12.5px] text-sub mb-4">Todas las horas son en tu hora local.</p>
                  {proximas.length === 0 ? (
                    <Vacio texto="Aún no hay clases en vivo programadas." />
                  ) : (
                    <div className="space-y-3">
                      {proximas.map((c) => <ClaseCard key={c.id} c={c} asistio={asist.includes(c.id)} onAsistir={() => asistir(c)} />)}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-display font-extrabold text-lg mb-4">Grabaciones</h2>
                  {grabaciones.length === 0 ? (
                    <Vacio texto="Aún no hay grabaciones disponibles." />
                  ) : (
                    <div className="space-y-3">
                      {grabaciones.map((c) => (
                        <a key={c.id} href={c.grabacion_url!} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-3.5 shadow-sm hover:border-accent/30 transition group">
                          <span className="w-20 h-14 rounded-xl bg-gradient-to-br from-[#4c1d95] to-[#7c3aed] grid place-items-center text-white shrink-0 overflow-hidden">
                            {c.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : "▶"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[14px] truncate group-hover:text-accent transition">{c.titulo}</div>
                            <div className="text-[12px] text-sub">{c.instructor} · {dur(c.duracion_min)}</div>
                          </div>
                          <span className="text-accent text-xl shrink-0">▶</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold text-[15px] mb-3">Beneficios por asistir</h3>
                <ul className="space-y-2.5 text-[13px] text-sub">
                  {["+50 XP por clase (mín. 10 min)", "Acceso a grabaciones 24h", "Participas en retos relacionados", "Conectas con la comunidad"].map((b) => (
                    <li key={b} className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span>{b}</li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaseCard({ c, asistio, onAsistir }: { c: ClaseVivo; asistio: boolean; onAsistir: () => void }) {
  const st = estadoDe(c);
  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-surface border border-border rounded-2xl p-3.5 shadow-sm">
      <div className="relative w-full sm:w-52 h-32 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-[#3b0764] to-[#7c3aed] grid place-items-center">
        {c.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : <span className="text-white/70 text-3xl">🎥</span>}
        <span className={`absolute top-2 left-2 text-[10px] font-extrabold rounded px-1.5 py-0.5 ${st === "en_vivo" ? "bg-red-500 text-white" : "bg-black/60 text-white"}`}>
          {st === "en_vivo" ? "EN VIVO" : fechaCorta(c.inicia_at)}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="font-display font-extrabold text-[15px] leading-tight">{c.titulo}</h3>
        {c.categoria && <span className="text-[11px] font-semibold text-accent bg-accent-soft rounded px-2 py-0.5 self-start mt-1.5">{c.categoria}</span>}
        <div className="flex items-center gap-2 text-[12px] text-sub mt-2">⏱ {dur(c.duracion_min)}{c.instructor ? ` · ${c.instructor}` : ""}</div>
        <div className="mt-auto pt-3">
          {st === "en_vivo" ? (
            <button onClick={onAsistir} className="bg-accent text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:brightness-110 transition">▶ Entrar</button>
          ) : (
            <button onClick={onAsistir} disabled={asistio}
              className={`rounded-xl px-5 py-2 text-[13px] font-bold border transition ${asistio ? "bg-green/10 border-green/30 text-green" : "bg-surface border-border text-accent hover:bg-accent-soft"}`}>
              {asistio ? "Asistiré ✓" : "Asistiré"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub"><div className="text-3xl mb-2">📡</div>{texto}</div>;
}

function ComoFuncionaPopup({ onClose }: { onClose: () => void }) {
  const items = [
    { icon: "📅", t: "Consulta la lista de próximas lives", s: "Título, quién lo da, fecha y hora en tu hora local." },
    { icon: "🔔", t: "Recibe recordatorios", s: "1 hora antes por correo y WhatsApp." },
    { icon: "📡", t: "Entra cuando esté en vivo", s: "Se abrirá la transmisión para que participes." },
    { icon: "⭐", t: "Asiste al live semanal fijo", s: "El live de la semana. Asistir da +50 XP." },
  ];
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-extrabold">Cómo funciona</h3>
          <button onClick={onClose} className="text-hint hover:text-sub text-xl">✕</button>
        </div>
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.t} className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent grid place-items-center text-lg shrink-0">{it.icon}</span>
              <div><div className="font-bold text-[14px]">{it.t}</div><p className="text-[13px] text-sub">{it.s}</p></div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full bg-accent text-white rounded-xl py-3 text-[14px] font-bold mt-5 hover:brightness-110 transition">Entendido</button>
      </div>
    </div>
  );
}
