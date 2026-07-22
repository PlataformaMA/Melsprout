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

// ——— Sincronización de calendario (.ics para Apple/Outlook + link de Google) ———
function fmtICS(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function icsDeClases(clases: ClaseVivo[]): string {
  const ev = clases.map((c) => {
    const s = new Date(c.inicia_at);
    const e = new Date(s.getTime() + c.duracion_min * 60000);
    return [
      "BEGIN:VEVENT", `UID:${c.id}@melsprout`, `DTSTAMP:${fmtICS(new Date())}`,
      `DTSTART:${fmtICS(s)}`, `DTEND:${fmtICS(e)}`,
      `SUMMARY:${(c.titulo || "Clase en vivo").replace(/[\r\n]+/g, " ")}`,
      `DESCRIPTION:Clase en vivo de Melsprout${c.instructor ? " con " + c.instructor : ""}`,
      c.stream_url ? `URL:${c.stream_url}` : "",
      "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Tu clase en vivo empieza pronto", "END:VALARM",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  }).join("\r\n");
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Melsprout//Clases en vivo//ES\r\nCALSCALE:GREGORIAN\r\n${ev}\r\nEND:VCALENDAR`;
}
function descargarICS(clases: ClaseVivo[]) {
  const blob = new Blob([icsDeClases(clases)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "melsprout-clases.ics"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function googleCalLink(c: ClaseVivo): string {
  const s = new Date(c.inicia_at), e = new Date(s.getTime() + c.duracion_min * 60000);
  const p = new URLSearchParams({
    action: "TEMPLATE", text: c.titulo || "Clase en vivo",
    dates: `${fmtICS(s)}/${fmtICS(e)}`,
    details: `Clase en vivo de Melsprout${c.instructor ? " con " + c.instructor : ""}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function VivoVista({ clases, asistidas, nombre, avatarUrl, gemas, racha }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"clases" | "grabaciones">("clases");
  const [popup, setPopup] = useState(false);
  const [calAbierto, setCalAbierto] = useState(false);
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
      {calAbierto && <CalendarioModal clases={proximas} asist={asist} onAsistir={asistir} onClose={() => setCalAbierto(false)} />}
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
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-display font-extrabold text-lg">Próximas clases</h2>
                      <p className="text-[12.5px] text-sub">Todas las horas son en tu hora local.</p>
                    </div>
                    <button onClick={() => setCalAbierto(true)}
                      className="shrink-0 flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2 text-[13px] font-semibold text-accent hover:bg-accent-soft transition">
                      <CalIcon /> Ver calendario
                    </button>
                  </div>
                  {proximas.length === 0 ? (
                    <Vacio texto="Aún no hay clases en vivo programadas." />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {proximas.map((c, i) => <ClaseCard key={c.id} c={c} n={i + 1} asistio={asist.includes(c.id)} onAsistir={() => asistir(c)} />)}
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
              {/* Grabaciones recientes */}
              {grabaciones.length > 0 && (
                <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-extrabold text-[15px]">Grabaciones recientes</h3>
                    <button onClick={() => setTab("grabaciones")} className="text-[12px] text-accent font-semibold">Ver todas</button>
                  </div>
                  <div className="space-y-3">
                    {grabaciones.slice(0, 3).map((c) => (
                      <a key={c.id} href={c.grabacion_url!} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 group">
                        <span className="w-12 h-9 rounded-lg bg-gradient-to-br from-[#4c1d95] to-[#7c3aed] grid place-items-center text-white text-[11px] shrink-0 overflow-hidden">
                          {c.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : "▶"}
                        </span>
                        <span className="flex-1 min-w-0 text-[13px] font-semibold truncate group-hover:text-accent transition">{c.titulo}</span>
                        <span className="text-[11px] text-hint shrink-0">{dur(c.duracion_min)}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-extrabold text-[15px]">Beneficios por asistir</h3>
                  <button onClick={() => setPopup(true)} className="text-[12px] text-accent font-semibold">¿Cómo funciona?</button>
                </div>
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

function ClaseCard({ c, n, asistio, onAsistir }: { c: ClaseVivo; n: number; asistio: boolean; onAsistir: () => void }) {
  const st = estadoDe(c);
  return (
    <div className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm flex flex-col">
      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#3b0764] to-[#7c3aed] grid place-items-center">
        {c.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : <span className="text-white/70 text-3xl">🎥</span>}
        <span className="absolute top-2 left-2 bg-white/90 text-[11px] font-extrabold rounded px-1.5 py-0.5">{String(n).padStart(2, "0")}</span>
        <span className={`absolute top-2 right-2 text-[10px] font-extrabold rounded px-1.5 py-0.5 ${st === "en_vivo" ? "bg-red-500 text-white" : "bg-black/60 text-white"}`}>
          {st === "en_vivo" ? "EN VIVO" : fechaCorta(c.inicia_at)}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col mt-2.5">
        <h3 className="font-display font-extrabold text-[14.5px] leading-tight">{c.titulo}</h3>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {c.categoria && <span className="text-[11px] font-semibold text-accent bg-accent-soft rounded px-2 py-0.5">{c.categoria}</span>}
          {c.instructor && <span className="text-[12px] text-sub">{c.instructor}</span>}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-sub mt-2">⏱ {dur(c.duracion_min)}</div>
        <div className="mt-auto pt-3 flex items-center gap-2">
          {st === "en_vivo" ? (
            <button onClick={onAsistir} className="bg-accent text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:brightness-110 transition">▶ Entrar</button>
          ) : (
            <>
              <button onClick={onAsistir} disabled={asistio}
                className={`rounded-xl px-4 py-2 text-[13px] font-bold border transition ${asistio ? "bg-green/10 border-green/30 text-green" : "bg-surface border-border text-accent hover:bg-accent-soft"}`}>
                {asistio ? "Asistiré ✓" : "Asistiré"}
              </button>
              <a href={googleCalLink(c)} target="_blank" rel="noreferrer" title="Recordarme (agregar a calendario)"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold border border-border text-sub hover:bg-bg transition">
                <BellMini /> Recordar
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub"><div className="text-3xl mb-2">📡</div>{texto}</div>;
}

// ——— Calendario mensual + sincronización ———
function CalendarioModal({ clases, asist, onAsistir, onClose }: {
  clases: ClaseVivo[]; asist: string[]; onAsistir: (c: ClaseVivo) => void; onClose: () => void;
}) {
  const hoy = new Date();
  const [ref, setRef] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() });
  const [sel, setSel] = useState<string | null>(null);
  const [host] = useState(() => (typeof window !== "undefined" ? window.location.host : ""));

  const claveDia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const clasesPorDia: Record<string, ClaseVivo[]> = {};
  for (const c of clases) { const d = new Date(c.inicia_at); (clasesPorDia[claveDia(d)] ??= []).push(c); }

  const primero = new Date(ref.y, ref.m, 1);
  const diasEnMes = new Date(ref.y, ref.m + 1, 0).getDate();
  const offset = primero.getDay(); // 0=Dom
  const celdas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  const nombreMes = primero.toLocaleString("es-MX", { month: "long", year: "numeric" });
  const mover = (delta: number) => { setSel(null); setRef((r) => { const d = new Date(r.y, r.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; }); };

  const selClases = sel ? clasesPorDia[sel] || [] : [];
  const selPartes = sel ? sel.split("-").map(Number) : null;
  const selFecha = selPartes ? new Date(selPartes[0], selPartes[1], selPartes[2]) : null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/45 grid place-items-center p-3" onClick={onClose}>
      <div className="bg-surface rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-full hover:bg-bg text-hint" aria-label="Cerrar">✕</button>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent grid place-items-center"><CalIcon /></span>
          <div>
            <h3 className="font-display text-lg font-extrabold">Calendario de clases en vivo</h3>
            <p className="text-[12px] text-sub">Todas las horas se muestran en tu zona horaria local.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-5 mt-4">
          {/* Calendario */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => mover(-1)} className="w-8 h-8 rounded-lg border border-border grid place-items-center hover:bg-bg">‹</button>
              <button onClick={() => { setSel(null); setRef({ y: hoy.getFullYear(), m: hoy.getMonth() }); }} className="text-[13px] font-semibold border border-border rounded-lg px-3 py-1.5 hover:bg-bg">Hoy</button>
              <span className="font-display font-extrabold capitalize flex-1 text-center">{nombreMes}</span>
              <button onClick={() => mover(1)} className="w-8 h-8 rounded-lg border border-border grid place-items-center hover:bg-bg">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"].map((d) => (
                <div key={d} className="text-[10px] font-bold text-hint py-1">{d}</div>
              ))}
              {celdas.map((n, i) => {
                if (n === null) return <div key={i} />;
                const d = new Date(ref.y, ref.m, n);
                const k = claveDia(d);
                const tiene = !!clasesPorDia[k];
                const esHoy = k === claveDia(hoy);
                const activo = k === sel;
                return (
                  <button key={i} onClick={() => setSel(k)}
                    className={`aspect-square rounded-full grid place-items-center text-[13px] relative transition hover:bg-bg ${
                      activo ? "bg-accent text-white font-bold" : tiene ? "bg-accent-soft text-accent font-bold" : "text-sub"
                    } ${esHoy && !activo ? "ring-1 ring-accent/40" : ""}`}>
                    {n}
                    {tiene && !activo && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel derecho */}
          <div className="space-y-4">
            <div>
              <h4 className="font-display font-extrabold text-[15px] mb-2">
                {selFecha ? `Clases del ${selFecha.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}` : "Elige un día"}
              </h4>
              {sel && selClases.length === 0 && <p className="text-[13px] text-sub">Sin clases ese día.</p>}
              {!sel && <p className="text-[13px] text-sub">Toca un día marcado para ver sus clases.</p>}
              <div className="space-y-2">
                {selClases.map((c) => (
                  <div key={c.id} className="border border-border rounded-xl p-3">
                    <div className="text-[12px] font-bold text-accent">{new Date(c.inicia_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="font-bold text-[13.5px] leading-tight">{c.titulo}</div>
                    {c.categoria && <div className="text-[11px] text-sub">{c.categoria}{c.instructor ? ` · ${c.instructor}` : ""}</div>}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => onAsistir(c)} disabled={asist.includes(c.id)}
                        className={`text-[12px] font-bold rounded-lg px-3 py-1.5 border ${asist.includes(c.id) ? "bg-green/10 border-green/30 text-green" : "border-accent/30 text-accent hover:bg-accent-soft"}`}>
                        {asist.includes(c.id) ? "Asistiré ✓" : "▶ Asistiré"}
                      </button>
                      <a href={googleCalLink(c)} target="_blank" rel="noreferrer" className="text-[12px] font-semibold rounded-lg px-3 py-1.5 border border-border text-sub hover:bg-bg">Google</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sincronizar */}
            <div className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(160deg,#F3F0FF,#FBFAFF)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/octi.webp" alt="Octi" width={70} height={70} className="mx-auto" />
              <div className="font-display font-extrabold text-accent mt-1">¡Octi quiere ayudarte!</div>
              <p className="text-[12.5px] text-sub mt-1">Suscríbete y tu calendario se actualiza solo cuando haya nuevas clases.</p>
              <div className="mt-3 space-y-2">
                <a href={host ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`https://${host}/api/calendario`)}` : "#"} target="_blank" rel="noreferrer"
                  className="w-full bg-accent text-white rounded-xl py-2.5 text-[13px] font-bold hover:brightness-110 transition flex items-center justify-center gap-2">
                  <CalIcon /> Google Calendar
                </a>
                <a href={host ? `webcal://${host}/api/calendario` : "#"}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 text-[13px] font-bold text-text hover:bg-bg transition flex items-center justify-center gap-2">
                  🍎 Apple Calendar
                </a>
                <button onClick={() => descargarICS(clases)} disabled={clases.length === 0}
                  className="w-full text-[12px] font-semibold text-sub hover:text-text disabled:opacity-50 transition">
                  o descargar archivo (.ics)
                </button>
              </div>
              <p className="text-[11px] text-hint mt-2">Se suscribe y se actualiza cada hora. Outlook: usa el .ics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
      <div className="bg-surface rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

function CalIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 3v3M16 3v3" /></svg>; }
function BellMini() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" /></svg>; }
