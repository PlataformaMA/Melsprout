"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Perfil, guardarNicho } from "@/lib/perfil-actions";
import { NICHOS, banderaUrl } from "@/lib/catalogos";
import { nivelPorXP, TOTAL_CLASES } from "@/lib/data";
import { AvatarUploader } from "@/components/AvatarUploader";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useConectarInsightIQ, type InsightIQConfig } from "@/components/ConectarInsightIQ";

export type InsightIQProps = InsightIQConfig;

// ————————————— Helpers —————————————
function calcularEdad(fecha: string | null): number | null {
  if (!fecha) return null;
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - y;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e > 0 && e < 120 ? e : null;
}
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function mesAnio(iso: string | null): string {
  const dt = iso ? new Date(iso) : new Date();
  if (isNaN(dt.getTime())) return "Julio del 2026";
  return `${MESES[dt.getMonth()]} del ${dt.getFullYear()}`;
}
function handleDe(username: string | null, nombre: string | null): string {
  if (username) return `@${username}`;
  const base = (nombre ?? "creador").trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  return `@${base || "creador"}`;
}
function formatN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

// Redes conectables vía InsightIQ (workPlatformId = id de la plataforma en InsightIQ).
const REDES = [
  { key: "tiktok", nombre: "TikTok", color: "#111827", icon: <TikTokIcon />, wp: "de55aeec-0dc8-4119-bf90-16b3d1f0c987" },
  { key: "instagram", nombre: "Instagram", color: "grad-ig", icon: <InstagramIcon />, wp: "9bb8913b-ddd9-430b-a66a-d74d846e6c66" },
  { key: "youtube", nombre: "YouTube", color: "#FF0000", icon: <YouTubeIcon />, wp: "14d9ddf5-51c6-415e-bde6-f8ed36ad7054" },
] as const;

// ————————————— Componente principal —————————————
export function PerfilVista({ perfil, creadoEn, insightiq }: { perfil: Perfil; creadoEn: string | null; insightiq?: InsightIQProps | null }) {
  const [tab, setTab] = useState<"Resumen" | "Métricas">("Resumen");
  const { abrir, cargando, disponible } = useConectarInsightIQ(insightiq ?? null);
  const nivel = nivelPorXP(perfil.xp);
  const edad = calcularEdad(perfil.fecha_nacimiento);

  const tieneRedes = REDES.some((r) => perfil.redes?.[r.key]);
  const items = [
    !!perfil.avatar_url, !!perfil.cover_url, !!perfil.headline, !!perfil.bio,
    !!perfil.ciudad, tieneRedes, !!perfil.nicho, !!perfil.objetivo, !!perfil.plataforma_principal,
  ];
  const pct = Math.round((items.filter(Boolean).length / items.length) * 100);
  const xpPct = nivel.siguiente ? Math.min(100, Math.max(6, Math.round((perfil.xp / nivel.siguiente.xp) * 100))) : 100;

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="perfil" />

      <div className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5">
          {/* ——— Barra superior ——— */}
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <Counter icon="🔥" valor={perfil.racha} />
            <Counter icon="💎" valor={perfil.gemas} />
            <button className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-surface transition" aria-label="Notificaciones">
              <BellIcon />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>
            <UserMenu avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? "Creador"} />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* ═══════ Columna principal ═══════ */}
            <div className="min-w-0">
              {/* Tarjeta de perfil */}
              <section className="rounded-3xl p-5 sm:p-6 shadow-sm border border-border"
                style={{ background: "linear-gradient(135deg,#F3F0FF 0%,#FFFFFF 55%)" }}>
                <div className="flex items-start gap-5">
                  <div className="shrink-0">
                    <div className="rounded-full p-[3px] bg-gradient-to-br from-[#C084FC] to-[#7C3AED]">
                      <div className="bg-white rounded-full p-[2px]">
                        <AvatarUploader avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? ""} size={92} />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h1 className="font-display text-2xl font-extrabold leading-tight truncate">{perfil.full_name ?? "Creador"}</h1>
                        <p className="text-sub text-sm">{handleDe(perfil.username, perfil.full_name)}</p>
                        {edad
                          ? <p className="text-sub text-sm mt-0.5">{edad} Años</p>
                          : <Link href="/app/perfil/completar" className="text-accent text-sm mt-0.5 font-medium hover:underline inline-block">+ Agrega tu edad</Link>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-sub text-sm">
                        <span className="truncate max-w-[130px]">{perfil.ciudad || perfil.estado || perfil.pais || ""}</span>
                        <BanderaCirculo pais={perfil.pais} />
                      </div>
                    </div>

                    <NichoChip nicho={perfil.nicho} />
                  </div>
                </div>

                {/* Barra de XP con Octi montado encima */}
                <div className="relative mt-5 flex items-center gap-4">
                  <div className="relative flex-1 h-3 rounded-full bg-[#E7E3F3]">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${xpPct}%` }} />
                    <div className="absolute z-10" style={{ left: `calc(${xpPct}% - 25px)`, top: "50%", transform: "translateY(-50%)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/octi.webp" alt="Octi" width={50} className="select-none drop-shadow-[0_3px_4px_rgba(124,58,237,0.25)]" draggable={false} />
                    </div>
                  </div>
                  <span className="text-[13px] text-sub shrink-0">
                    {nivel.siguiente ? `Te faltan ${nivel.faltan}XP para ${nivel.siguiente.nombre.toLowerCase()}` : `¡Nivel máximo!`}
                  </span>
                </div>
              </section>

              {/* Sobre mí */}
              <div className="mt-6">
                <h2 className="font-display text-lg font-extrabold mb-2">Sobre mi</h2>
                <p className="text-sub text-sm leading-relaxed whitespace-pre-line">
                  {perfil.bio || "Cuéntale al mundo quién eres y qué creas. ✍️"}
                </p>
                <p className="text-hint text-[13px] mt-4">Se unió en {mesAnio(creadoEn)}</p>
              </div>

              {/* Tabs */}
              <div className="mt-5 border-b border-border flex gap-8">
                {(["Resumen", "Métricas"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-3 text-[15px] font-bold -mb-px border-b-2 transition ${
                      tab === t ? "border-accent text-accent" : "border-transparent text-sub hover:text-text"
                    }`}>{t}</button>
                ))}
              </div>

              {tab === "Métricas" ? <TabMetricas metricas={perfil.metricas} /> : <TabResumen perfil={perfil} nivel={nivel} />}
            </div>

            {/* ═══════ Columna derecha ═══════ */}
            <aside className="space-y-6 lg:sticky lg:top-5">
              {/* Redes sociales — cuentas REALES del usuario */}
              <section className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-extrabold">Redes sociales</h2>
                  <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 text-sub bg-bg">
                    {tieneRedes ? "Conectadas" : "Conecta"}
                  </span>
                </div>
                <div className="space-y-4">
                  {REDES.map((r) => {
                    const handle = perfil.metricas?.[r.key as string]?.username || perfil.redes?.[r.key as string];
                    return (
                      <div key={r.key} className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl grid place-items-center text-white shrink-0"
                          style={r.color === "grad-ig" ? { background: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" } : { background: r.color }}>
                          {r.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[14px] leading-tight">{r.nombre}</div>
                          <div className="text-[13px] text-sub truncate">{handle ? `@${handle}` : "Sin conectar"}</div>
                        </div>
                        {handle ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="w-6 h-6 rounded-full bg-green text-white grid place-items-center text-[12px]">✓</span>
                            <a
                              href={`/api/insightiq/disconnect?provider=${r.key}`}
                              onClick={(e) => { if (!confirm(`¿Desconectar ${r.nombre}? Dejarás de ver sus métricas.`)) e.preventDefault(); }}
                              className="text-[11px] font-semibold text-sub hover:text-red-500 transition"
                            >
                              Desconectar
                            </a>
                          </div>
                        ) : disponible ? (
                          <button
                            type="button"
                            disabled={cargando}
                            onClick={() => abrir(r.wp)}
                            className="text-[12px] font-bold text-accent bg-accent-soft rounded-lg px-3 py-1.5 shrink-0 hover:brightness-105 transition disabled:opacity-60"
                          >
                            {cargando ? "Abriendo…" : "Conectar"}
                          </button>
                        ) : (
                          <a href={`/api/${r.key}/connect`} className="text-[12px] font-bold text-accent bg-accent-soft rounded-lg px-3 py-1.5 shrink-0 hover:brightness-105 transition">
                            Conectar
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Completa tu perfil (anillo) */}
              <section className="rounded-3xl p-6 shadow-sm border border-accent/10" style={{ background: "linear-gradient(160deg,#F3F0FF,#FBFAFF)" }}>
                <Anillo pct={pct} />
                <h3 className="font-display font-extrabold text-lg text-center mt-4">¡Completa tu perfil!</h3>
                <p className="text-[13px] text-sub text-center mt-1.5 leading-relaxed">
                  Te falta <span className="text-accent font-medium">conectar tus redes</span> para llegar al 100% <span className="text-accent font-medium">y obtener tu</span> insignia azul.
                </p>
                <Link href="/app/perfil/completar" className="flex items-center gap-3 bg-white/70 hover:bg-white rounded-2xl px-4 py-3 mt-4 transition">
                  <span className="text-xl">💎</span>
                  <span className="text-[13px] font-bold text-accent leading-tight">Premio: +15<br />gemas</span>
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

// ————————————— Chip de nicho editable —————————————
function NichoChip({ nicho }: { nicho: string | null }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function cambiar(nuevo: string | null) {
    setGuardando(true);
    await guardarNicho(nuevo);
    setGuardando(false);
    setAbierto(false);
    router.refresh();
  }

  if (!nicho && !abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="inline-block mt-2.5 text-[13px] font-semibold text-accent border border-dashed border-accent/40 rounded-full px-4 py-1.5 hover:bg-accent-soft transition">
        + Agregar nicho
      </button>
    );
  }

  return (
    <div className="relative inline-block mt-2.5">
      <button onClick={() => setAbierto((v) => !v)} disabled={guardando}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent bg-accent-soft rounded-full pl-4 pr-2.5 py-1.5 hover:brightness-95 transition">
        {nicho || "Elige tu nicho"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setAbierto(false)} />
          <div className="absolute left-0 top-full mt-2 z-30 w-52 bg-surface border border-border rounded-2xl shadow-lg p-1.5">
            {NICHOS.map((n) => (
              <button key={n.id} onClick={() => cambiar(n.id)}
                className={`w-full flex items-center gap-2 text-left text-sm rounded-xl px-3 py-2 hover:bg-bg transition ${nicho === n.id ? "text-accent font-semibold" : "text-text"}`}>
                <span>{n.emoji}</span>{n.id}
              </button>
            ))}
            <div className="h-px bg-border my-1" />
            <button onClick={() => cambiar(null)} className="w-full flex items-center gap-2 text-left text-sm rounded-xl px-3 py-2 text-pink hover:bg-pink-soft transition">
              🗑️ Quitar nicho
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ————————————— Bandera circular (imagen real con escudo) —————————————
function BanderaCirculo({ pais }: { pais: string | null }) {
  const url = banderaUrl(pais);
  if (!url) {
    return <span className="w-6 h-6 rounded-full grid place-items-center text-[13px] bg-blue-soft text-blue border border-border shrink-0">🌎</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={pais ?? "país"}
      className="w-6 h-6 rounded-full object-cover ring-1 ring-black/10 shrink-0" />
  );
}

// ————————————— Tab Métricas (datos REALES de InsightIQ) —————————————
const RED_INFO: Record<string, { label: string; bg: string; icon: React.ReactNode }> = {
  instagram: { label: "Instagram", bg: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)", icon: <InstagramIcon /> },
  tiktok: { label: "TikTok", bg: "#111827", icon: <TikTokIcon /> },
  youtube: { label: "YouTube", bg: "#FF0000", icon: <YouTubeIcon /> },
  facebook: { label: "Facebook", bg: "#1877F2", icon: <FacebookIcon /> },
};

function fechaCorta(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function TabMetricas({ metricas }: { metricas: Perfil["metricas"] }) {
  // Redes realmente conectadas (con datos de InsightIQ).
  const conectadas = Object.keys(RED_INFO).filter((k) => {
    const m = metricas?.[k];
    return m && (m.followers != null || m.username);
  });

  const opciones = conectadas.length > 1 ? ["General", ...conectadas] : conectadas;
  const [red, setRed] = useState<string>(opciones[0] || "General");
  const [abierto, setAbierto] = useState(false);
  const activa = opciones.includes(red) ? red : opciones[0];

  if (conectadas.length === 0) {
    return (
      <div className="mt-6 bg-surface border border-border rounded-3xl p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="font-display text-lg font-extrabold">Aún no hay métricas</h3>
        <p className="text-sub text-[14px] mt-1.5">
          Conecta una red social en <span className="text-accent font-semibold">Redes sociales</span> para ver aquí tus datos reales.
        </p>
      </div>
    );
  }

  const campo = (c: "followers" | "following" | "posts" | "likes"): number | null => {
    if (activa === "General") {
      const vals = conectadas.map((k) => metricas[k]?.[c]).filter((v): v is number => typeof v === "number");
      return vals.length ? vals.reduce((s, v) => s + v, 0) : null;
    }
    const v = metricas[activa]?.[c];
    return typeof v === "number" ? v : null;
  };

  const muestra = (n: number | null) => (n == null ? "—" : formatN(n));

  const cards = [
    { label: "Seguidores", valor: muestra(campo("followers")), icon: <UsersIcon />, tono: "text-accent" },
    { label: "Me gusta", valor: muestra(campo("likes")), icon: <HeartIcon />, tono: "text-pink" },
    { label: "Publicaciones", valor: muestra(campo("posts")), icon: <ChatIcon />, tono: "text-blue" },
    { label: "Siguiendo", valor: muestra(campo("following")), icon: <UsersIcon />, tono: "text-accent" },
  ];

  const actualizado = activa !== "General" ? fechaCorta(metricas[activa]?.updated_at) : null;
  // Audiencia: de la red activa, o de la primera conectada que tenga datos (en General).
  const aud =
    activa === "General"
      ? conectadas.map((k) => metricas[k]?.audiencia).find((a) => a) ?? null
      : metricas[activa]?.audiencia ?? null;

  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-extrabold mb-4">Métricas principales</h3>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {opciones.length > 1 && (
          <div className="relative">
            <button onClick={() => setAbierto((v) => !v)}
              className="flex items-center justify-between gap-6 bg-surface border border-border rounded-2xl px-5 py-3.5 shadow-sm min-w-[240px]">
              <span className="font-display font-extrabold">{activa === "General" ? "General" : RED_INFO[activa]?.label}</span>
              <ChevronDown />
            </button>
            {abierto && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setAbierto(false)} />
                <div className="absolute left-0 top-full mt-2 z-30 w-[240px] bg-surface border border-border rounded-2xl shadow-lg p-1.5">
                  {opciones.map((k) => (
                    <button key={k} onClick={() => { setRed(k); setAbierto(false); }}
                      className={`w-full text-left text-sm rounded-xl px-3 py-2.5 hover:bg-bg transition ${activa === k ? "text-accent font-bold bg-accent-soft" : "text-text"}`}>
                      {k === "General" ? "General" : RED_INFO[k]?.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {conectadas.map((k) => (
            <button key={k} onClick={() => setRed(k)}
              className={`w-9 h-9 rounded-xl grid place-items-center text-white transition ${activa === k ? "ring-2 ring-accent ring-offset-2" : "opacity-90 hover:opacity-100"}`}
              style={{ background: RED_INFO[k]?.bg }} title={RED_INFO[k]?.label}>
              {RED_INFO[k]?.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <span className={c.tono}>{c.icon}</span>
              <span className="text-sub font-medium text-[15px]">{c.label}</span>
            </div>
            <div className="font-display text-4xl font-extrabold tracking-tight">{c.valor}</div>
          </div>
        ))}
      </div>

      <p className="text-[12px] text-sub mt-4">
        {actualizado ? `Actualizado ${actualizado} · ` : ""}
        Datos reales conectados con tu cuenta.
      </p>

      {aud && (
        <>
          <h3 className="font-display text-lg font-extrabold mt-8 mb-4">Público</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aud.paises.length > 0 && <Breakdown titulo="Países" icon={<PinIcon />} filas={aud.paises} />}
            {aud.ciudades.length > 0 && <Breakdown titulo="Ciudades" icon={<BuildingIcon />} filas={aud.ciudades} />}
            {aud.genero.length > 0 && <Breakdown titulo="Género" icon={<UsersIcon />} filas={aud.genero} />}
            {aud.edad.length > 0 && <Breakdown titulo="Edad" icon={<BarsIcon />} filas={aud.edad} />}
          </div>
        </>
      )}
    </div>
  );
}

// Reparto de audiencia (valores en %) con barras.
function Breakdown({ titulo, icon, filas }: { titulo: string; icon: React.ReactNode; filas: { k: string; pct: number }[] }) {
  const max = Math.max(...filas.map((f) => f.pct), 1);
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent">{icon}</span>
        <h4 className="font-display font-extrabold">{titulo}</h4>
      </div>
      <div className="space-y-3">
        {filas.map((f) => (
          <div key={f.k} className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-text w-28 shrink-0 truncate">{f.k}</span>
            <div className="flex-1 h-2.5 rounded-full bg-[#EEEBF6] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#A78BFA] to-accent" style={{ width: `${Math.max(6, Math.round((f.pct / max) * 92))}%` }} />
            </div>
            <span className="text-[12px] text-sub w-11 text-right shrink-0">{f.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ————————————— Tab Resumen —————————————
function TabResumen({ perfil, nivel }: { perfil: Perfil; nivel: ReturnType<typeof nivelPorXP> }) {
  const badges = [
    { emoji: "🔥", bg: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
    { emoji: "🎬", bg: "linear-gradient(135deg,#60a5fa,#2563eb)" },
    { emoji: "📸", bg: "linear-gradient(135deg,#34d399,#059669)" },
    { emoji: "❤️", bg: "linear-gradient(135deg,#f472b6,#db2777)" },
    { emoji: "👑", bg: "linear-gradient(135deg,#fbbf24,#d97706)" },
  ];
  const habilidades = [
    { nombre: "Creación De Contenido", nivel: 42 }, { nombre: "Grabación Y Edición", nivel: 30 },
    { nombre: "Estrategia De Redes", nivel: 26 }, { nombre: "Copywriting", nivel: 22 },
  ];
  return (
    <div className="mt-6 space-y-8">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MiniStat top={<StatBars />} valor={`Nivel ${nivel.actual.nivel}`} label="Nivel actual" />
        <MiniStat top={<span className="text-amber text-lg">⭐</span>} valor={perfil.xp.toLocaleString()} label="Puntos" sub="+120 esta semana" />
        <MiniStat top={<span className="text-pink text-lg">📖</span>} valor={`0 / ${TOTAL_CLASES}`} label="Clases completadas" />
        <MiniStat top={<span className="text-accent text-lg">💥</span>} valor={`0 / ${TOTAL_CLASES}`} label="Retos Completados" />
        <MiniStat top={<span className="text-lg">🔥</span>} valor={`${perfil.racha}`} label="Días de racha" />
      </div>

      {/* Badgeds */}
      <div>
        <h3 className="font-display text-lg font-extrabold mb-3">Badgeds</h3>
        <div className="flex flex-wrap gap-3">
          {badges.map((b, i) => (
            <div key={i} className="w-14 h-14 grid place-items-center text-white text-xl"
              style={{ background: b.bg, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>{b.emoji}</div>
          ))}
        </div>
      </div>

      {/* Habilidades */}
      <div>
        <h3 className="font-display text-lg font-extrabold mb-3">Habilidades</h3>
        <section className="bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-5">
          {habilidades.map((h) => (
            <div key={h.nombre}>
              <p className="font-bold text-[15px] mb-2">{h.nombre}</p>
              <div className="h-2.5 rounded-full bg-[#E7E4EC] overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${h.nivel}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

// ————————————— Piezas —————————————
function Counter({ icon, valor }: { icon: string; valor: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg">{icon}</span>
      <span className="font-display font-extrabold text-[15px] text-text">{valor}</span>
    </div>
  );
}
function MiniStat({ top, valor, label, sub }: { top: React.ReactNode; valor: string; label: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 text-center shadow-sm">
      <div className="grid place-items-center h-6 mb-1">{top}</div>
      <div className="font-display text-lg font-extrabold leading-tight">{valor}</div>
      <div className="text-[11px] text-sub mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-green font-semibold mt-0.5">{sub}</div>}
    </div>
  );
}
function Anillo({ pct }: { pct: number }) {
  const r = 46, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#E4DCF7" strokeWidth="9" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="#7c3aed" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center"><span className="font-display text-2xl font-extrabold text-accent">{pct}%</span></div>
    </div>
  );
}

// ————————————— Iconos —————————————
function BellIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>; }
function ChevronDown() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>; }
function UsersIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-4-5.6" /></svg>; }
function HeartIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>; }
function ChatIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10h8M8 14h5" /><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" /></svg>; }
function StatBars() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round"><path d="M6 20v-6M12 20V8M18 20v-9" /></svg>; }
function PinIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function BuildingIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="12" height="18" rx="1.5" /><path d="M16 8h4v13M8 7h1M12 7h1M8 11h1M12 11h1M8 15h1M12 15h1" /></svg>; }
function BarsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20v-5M10 20V8M15 20v-9M20 20V5" /></svg>; }
function InstagramIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>; }
function FacebookIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V7c0-1 .3-1.5 1.6-1.5H17V2.2C16.6 2.1 15.5 2 14.4 2 11.8 2 10 3.6 10 6.5V9H7.5v3.5H10V22h4v-9.5h2.7l.4-3.5z" /></svg>; }
function TikTokIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 1.9 4 4 4.3v3c-1.5 0-2.9-.4-4-1.1V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.8V3z" /></svg>; }
function YouTubeIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.8 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1c.2-1.2.2-2.5.2-3.8s0-2.6-.2-3.8zM10 15V9l5.2 3z" /></svg>; }
