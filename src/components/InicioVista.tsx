"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { ETAPA_1 } from "@/lib/data";
import { getReto } from "@/lib/retos";
import { InstagramIcon, TikTokIcon, YouTubeIcon } from "@/components/iconos-redes";
import { PopupBienvenida } from "@/components/PopupCelebracion";

type Metricas = Record<string, { followers?: number; username?: string }>;

type Props = {
  perfil: { nombre: string; avatarUrl: string | null; xp: number; gemas: number; racha: number; metricas: Metricas; redes: Record<string, string> };
  stats: { publicados: number; totalClases: number; nivelNombre: string; nivelNum: number; faltanXP: number; siguienteXP: number };
  ranking: { nombre: string; avatarUrl: string | null; xp: number; esTu: boolean }[];
  continuar: { id: string; titulo: string };
};

function fmt(n: number) { return n.toLocaleString("es-MX"); }

export function InicioVista({ perfil, stats, ranking, continuar }: Props) {
  const pctCurso = Math.min(100, Math.round((stats.publicados / stats.totalClases) * 100));
  const nivelPct = stats.siguienteXP > 0 ? Math.min(100, Math.round((perfil.xp / stats.siguienteXP) * 100)) : 100;

  // Retos sugeridos (primeros de la etapa).
  const retosSugeridos = ETAPA_1.flatMap((m) => m.clases).slice(0, 2).map((c) => getReto(c.id)).filter(Boolean).slice(0, 2) as NonNullable<ReturnType<typeof getReto>>[];

  const REDES = [
    { key: "instagram", nombre: "Instagram", icon: <InstagramIcon />, bg: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" },
    { key: "tiktok", nombre: "TikTok", icon: <TikTokIcon />, bg: "#111827" },
    { key: "youtube", nombre: "YouTube", icon: <YouTubeIcon />, bg: "#FF0000" },
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      <PopupBienvenida />
      <AppSidebar active="inicio" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          {/* Topbar */}
          <header className="flex items-center justify-end gap-4 mb-6 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold bg-surface border border-border rounded-full px-3 py-1.5">🔥 {perfil.racha} <span className="text-[11px] text-sub font-medium">racha</span></span>
            <button className="relative w-9 h-9 rounded-full bg-surface border border-border grid place-items-center" aria-label="Notificaciones">🔔<span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" /></button>
            <UserMenu avatarUrl={perfil.avatarUrl} nombre={perfil.nombre} />
          </header>

          {/* Saludo */}
          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">¡Hola, {perfil.nombre.split(" ")[0]}! 👋</h1>
          <p className="text-sub mt-1 mb-6">Sigue aprendiendo, creando y creciendo.</p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon="⭐" tono="#F59E0B" label="Puntos acumulados" valor={fmt(perfil.xp)} extra="XP total" />
            <StatCard icon="🎓" tono="#7C3AED" label="Retos completados" valor={String(stats.publicados)} extra={`de ${stats.totalClases}`} />
            <StatCard icon="🔥" tono="#EF4444" label="Racha actual" valor={`${perfil.racha} días`} extra="¡Sigue así!" />
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1"><span>📅</span><span className="text-[12px] text-sub font-medium">Próxima clase en vivo</span></div>
              <div className="font-display font-extrabold text-[15px] leading-tight">Próximamente</div>
              <div className="text-[12px] text-sub mt-0.5">Te avisaremos aquí</div>
            </div>
          </div>

          {/* Continuar + En vivo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
              <h2 className="font-display font-extrabold mb-4">Continuar aprendiendo</h2>
              <div className="flex gap-4">
                <Link href={`/app/clase/${continuar.id}`} className="w-32 h-24 rounded-2xl bg-gradient-to-br from-[#E9D8FD] to-[#F3E8FF] grid place-items-center shrink-0 hover:brightness-95 transition">
                  <span className="w-11 h-11 rounded-full bg-white/90 grid place-items-center text-accent text-lg shadow">▶</span>
                </Link>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5">En progreso</span>
                  <h3 className="font-display font-extrabold text-[15px] mt-1.5 leading-tight">{continuar.titulo}</h3>
                  <div className="mt-3 h-2 rounded-full bg-[#EEEBF6] overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${pctCurso}%` }} /></div>
                  <div className="text-[12px] text-sub mt-1">{pctCurso}% del programa</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Link href={`/app/clase/${continuar.id}`} className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13px] font-bold hover:brightness-110 transition">Continuar clase</Link>
                <Link href="/app/ruta" className="text-[13px] text-accent font-semibold">Ir a todas las clases →</Link>
              </div>
            </section>

            <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-extrabold">Clases en vivo próximas</h2>
              </div>
              <div className="grid place-items-center py-8 text-center text-sub">
                <div className="text-3xl mb-2">📡</div>
                <p className="text-[13.5px]">Aún no hay clases en vivo programadas.<br />Te avisaremos cuando haya una nueva.</p>
              </div>
            </section>
          </div>

          {/* Actividad / Retos / Foros */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
              <h2 className="font-display font-extrabold mb-4">Retos que te pueden interesar</h2>
              <div className="space-y-3">
                {retosSugeridos.map((r) => (
                  <Link key={r.claseId} href={`/app/reto/${r.claseId}`} className="flex items-center gap-3 group">
                    <span className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center text-lg shrink-0">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13.5px] truncate group-hover:text-accent transition">{r.titulo}</div>
                      <div className="text-[12px] text-sub">+{r.xp} XP</div>
                    </div>
                    <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-lg px-2.5 py-1 shrink-0">Unirme</span>
                  </Link>
                ))}
              </div>
              <Link href="/app/retos" className="text-[13px] text-accent font-semibold mt-4 inline-block">Ver todos →</Link>
            </section>

            <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
              <h2 className="font-display font-extrabold mb-4">Comunidad</h2>
              <div className="grid place-items-center py-6 text-center text-sub">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-[13px]">Mira los avances de otros creadores y comenta.</p>
                <Link href="/app/comunidad" className="text-accent font-semibold text-[13px] mt-2">Ir a la comunidad →</Link>
              </div>
            </section>

            <section className="rounded-3xl p-5 shadow-sm border border-accent/10" style={{ background: "linear-gradient(160deg,#F3F0FF,#FBFAFF)" }}>
              <h2 className="font-display font-extrabold mb-1">Invita a un amigo</h2>
              <p className="text-[13px] text-sub mb-4">Comparte Melsprout y crezcan juntos 💜</p>
              <div className="text-4xl text-center my-2">🎓</div>
              <button className="w-full bg-accent text-white rounded-xl py-2.5 text-[13px] font-bold hover:brightness-110 transition">Invitar ahora</button>
            </section>
          </div>

          {/* Progreso del curso */}
          <section className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
            <h2 className="font-display font-extrabold mb-4">Tu progreso</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Anillo pct={pctCurso} />
              <div className="flex-1 min-w-0 w-full">
                <div className="font-display font-extrabold text-lg">Nivel {stats.nivelNum} · {stats.nivelNombre}</div>
                <div className="text-[13px] text-sub mt-0.5">{fmt(perfil.xp)} XP {stats.faltanXP > 0 ? `· te faltan ${fmt(stats.faltanXP)} para el siguiente nivel` : "· nivel máximo"}</div>
                <div className="mt-3 h-2.5 rounded-full bg-[#EEEBF6] overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${nivelPct}%` }} /></div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <div><div className="font-display font-extrabold text-lg">{stats.publicados}</div><div className="text-[11px] text-sub">Retos publicados</div></div>
                  <div><div className="font-display font-extrabold text-lg">{perfil.racha}</div><div className="text-[11px] text-sub">Días de racha</div></div>
                  <div><div className="font-display font-extrabold text-lg">{fmt(perfil.gemas)}</div><div className="text-[11px] text-sub">Gemas 💎</div></div>
                </div>
              </div>
            </div>
          </section>

          {/* Redes + Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-extrabold">Redes conectadas</h2>
                <Link href="/app/perfil" className="text-[12px] text-accent font-semibold">Gestionar</Link>
              </div>
              <div className="space-y-3">
                {REDES.map((r) => {
                  const conectada = perfil.metricas?.[r.key]?.username || perfil.redes?.[r.key];
                  return (
                    <div key={r.key} className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl grid place-items-center text-white shrink-0" style={{ background: r.bg }}>{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13.5px]">{r.nombre}</div>
                        <div className="text-[12px] text-sub truncate">{conectada ? `@${conectada}` : "Sin conectar"}</div>
                      </div>
                      <span className={`text-[12px] font-bold ${conectada ? "text-green" : "text-sub"}`}>{conectada ? "Conectada" : "Conectar"}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-extrabold">Tu tabla de aprendizaje 🏆</h2>
                <Link href="/app/ruta" className="text-[12px] text-accent font-semibold">Ver ranking</Link>
              </div>
              <div className="space-y-1.5">
                {ranking.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 ${c.esTu ? "bg-accent-soft" : ""}`}>
                    <span className="w-6 text-center text-[13px] font-extrabold shrink-0">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatarUrl} alt={c.nombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold shrink-0">{c.nombre.slice(0, 2).toUpperCase()}</span>
                    )}
                    <span className="flex-1 min-w-0 text-[13px] font-semibold truncate">{c.nombre}{c.esTu && <span className="text-accent"> (Tú)</span>}</span>
                    <span className="text-[12px] font-bold text-accent shrink-0">{fmt(c.xp)} XP</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Banner nivel */}
          <section className="rounded-3xl p-5 sm:p-6 shadow-sm flex items-center gap-5" style={{ background: "linear-gradient(120deg,#EDE7FB,#F6F3FF)" }}>
            <div className="text-5xl shrink-0">🧑‍🎓</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-extrabold text-[15px]">¡Sigue así! Estás construyendo tu futuro como creador.</div>
              <p className="text-[13px] text-sub mt-0.5">Cada clase te acerca más a tus metas.</p>
              <Link href="/app/ruta" className="inline-block mt-3 bg-accent text-white rounded-xl px-4 py-2.5 text-[13px] font-bold hover:brightness-110 transition">Explorar clases</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, tono, label, valor, extra }: { icon: string; tono: string; label: string; valor: string; extra: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-8 h-8 rounded-xl grid place-items-center text-white text-[15px]" style={{ background: tono }}>{icon}</span>
        <span className="text-[12px] text-sub font-medium">{label}</span>
      </div>
      <div className="font-display text-2xl font-extrabold tracking-tight mt-1">{valor}</div>
      <div className="text-[12px] text-sub">{extra}</div>
    </div>
  );
}

function Anillo({ pct }: { pct: number }) {
  const r = 42, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EEEBF6" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#7C3AED" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center"><div className="font-display font-extrabold text-xl">{pct}%</div><div className="text-[10px] text-sub">completado</div></div>
      </div>
    </div>
  );
}
