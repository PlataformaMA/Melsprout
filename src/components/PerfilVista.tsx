"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Perfil, subirCover } from "@/lib/perfil-actions";
import { banderaPais } from "@/lib/catalogos";
import { nivelPorXP, TOTAL_CLASES } from "@/lib/data";
import { AvatarUploader } from "@/components/AvatarUploader";

// ————————————— Helpers —————————————
function calcularEdad(fecha: string | null): number | null {
  if (!fecha) return null;
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - y;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e > 0 && e < 120 ? e : null;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function miembroDesde(iso: string | null): { etiqueta: string; hace: string } {
  const dt = iso ? new Date(iso) : new Date();
  if (isNaN(dt.getTime())) return { etiqueta: "—", hace: "" };
  const etiqueta = `${MESES[dt.getMonth()]} ${dt.getFullYear()}`;
  const hoy = new Date();
  let meses = (hoy.getFullYear() - dt.getFullYear()) * 12 + (hoy.getMonth() - dt.getMonth());
  if (meses < 0) meses = 0;
  const hace = meses < 1 ? "este mes" : meses === 1 ? "1 mes" : meses < 12 ? `${meses} meses` : `${Math.floor(meses / 12)} año(s)`;
  return { etiqueta, hace };
}

// ————————————— Datos demo (a conectar con Supabase después) —————————————
const HABILIDADES = [
  { nombre: "Creación de contenido", nivel: 90 },
  { nombre: "Edición de video", nivel: 85 },
  { nombre: "Copywriting", nivel: 75 },
  { nombre: "Estrategia de redes", nivel: 80 },
  { nombre: "Fotografía", nivel: 70 },
];

const LOGROS = [
  { emoji: "🔥", titulo: "Constancia", desc: "14 días de racha", bg: "#FEE2D5", ring: "#FB923C" },
  { emoji: "⭐", titulo: "Primeros pasos", desc: "Completaste tu primera clase", bg: "#FEF3C7", ring: "#F59E0B" },
  { emoji: "🛡️", titulo: "Creador activo", desc: "Completaste 10 clases", bg: "#EDE9FE", ring: "#7C3AED" },
  { emoji: "💬", titulo: "Comunidad", desc: "Participaste en 5 foros", bg: "#FCE7F3", ring: "#DB2777" },
  { emoji: "📈", titulo: "En crecimiento", desc: "Subiste de nivel 3 veces", bg: "#D1FAE5", ring: "#059669" },
];

const CAMPANAS = [
  { campana: "Lanzamiento colección verano", tipo: "UGC + Reels", marca: "Natura", entrega: "Entregado", entregaFecha: "10 May 2024", pago: "Pagado", pagoFecha: "12 May 2024", estado: "Completada" },
  { campana: "Nueva línea de skincare", tipo: "UGC + Stories", marca: "L'Oréal", entrega: "En revisión", entregaFecha: "20 May 2024", pago: "Pendiente", pagoFecha: "—", estado: "En revisión" },
  { campana: "Campaña always on", tipo: "Reels + TikTok", marca: "Rappi", entrega: "Pendiente", entregaFecha: "Fecha límite: 28 May", pago: "Pendiente", pagoFecha: "—", estado: "En curso" },
  { campana: "Back to school", tipo: "UGC + Fotos", marca: "Falabella", entrega: "Entregado", entregaFecha: "02 May 2024", pago: "Pagado", pagoFecha: "05 May 2024", estado: "Completada" },
  { campana: "Tech review: nuevo producto", tipo: "Reels + YouTube", marca: "Samsung", entrega: "Pendiente", entregaFecha: "Fecha límite: 02 Jun", pago: "Pendiente", pagoFecha: "—", estado: "En curso" },
];

const ACTIVIDAD = [
  { icon: "✅", tono: "green", titulo: "Completaste la clase", sub: "“Guiones que venden”", hace: "Hace 2 horas", xp: "+50 XP" },
  { icon: "💬", tono: "blue", titulo: "Participaste en el foro", sub: "“Tips para crecer en TikTok”", hace: "Hace 5 horas", xp: "+10 XP" },
  { icon: "🚀", tono: "pink", titulo: "Entregaste la campaña", sub: "“Lanzamiento colección verano”", hace: "Hace 1 día", xp: "+100 XP" },
  { icon: "⬆️", tono: "accent", titulo: "Subiste de nivel", sub: "¡Ahora eres Nivel 7 - Creadora!", hace: "Hace 2 días", xp: "+200 XP" },
];

const RECOMENDACIONES = [
  { icon: "🎬", titulo: "Cómo construir tu media kit", sub: "Nivel Intermedio · 45 min" },
  { icon: "⭐", titulo: "Reto: 7 días de creatividad", sub: "Quedan 3 días" },
  { icon: "💬", titulo: "Colaboraciones y networking", sub: "98 nuevas respuestas" },
  { icon: "📅", titulo: "Estrategias virales para Reels", sub: "Hoy, 7:00 PM" },
];

const VISITAS = [
  { nombre: "Mariana G.", rol: "Mentora de Contenido", hace: "Hace 1 día" },
  { nombre: "Andrés M.", rol: "Marca: Rappi", hace: "Hace 2 días" },
  { nombre: "Camila P.", rol: "Creadora de contenido", hace: "Hace 3 días" },
  { nombre: "Diego L.", rol: "Marca: Natura", hace: "Hace 5 días" },
];

const REDES = [
  { key: "instagram", nombre: "Instagram", color: "#E1306C", icon: InstagramIcon, sub: "Perfil de Instagram" },
  { key: "tiktok", nombre: "TikTok", color: "#111827", icon: TikTokIcon, sub: "Perfil de TikTok" },
  { key: "youtube", nombre: "YouTube", color: "#FF0000", icon: YouTubeIcon, sub: "Canal de YouTube" },
  { key: "linkedin", nombre: "LinkedIn", color: "#0A66C2", icon: LinkedInIcon, sub: "Perfil de LinkedIn" },
];

const TABS = ["Resumen", "Actividad", "Logros", "Redes y enlaces", "Reseñas"] as const;
type Tab = (typeof TABS)[number];

// ————————————— Componente principal —————————————
export function PerfilVista({
  perfil, email, creadoEn,
}: {
  perfil: Perfil; email: string; creadoEn: string | null;
}) {
  const [tab, setTab] = useState<Tab>("Resumen");
  const nivel = nivelPorXP(perfil.xp);
  const edad = calcularEdad(perfil.fecha_nacimiento);
  const miembro = miembroDesde(creadoEn);

  const tieneRedes = REDES.some((r) => perfil.redes?.[r.key]);
  const items = [
    !!perfil.avatar_url, !!perfil.cover_url, !!perfil.headline, !!perfil.bio,
    !!perfil.ciudad, tieneRedes, !!perfil.nicho, !!perfil.objetivo, !!perfil.plataforma_principal,
  ];
  const pct = Math.round((items.filter(Boolean).length / items.length) * 100);
  const xpPct = nivel.siguiente ? Math.min(100, Math.max(5, Math.round((perfil.xp / nivel.siguiente.xp) * 100))) : 100;

  const tags = (perfil.especialidades && perfil.especialidades.length > 0
    ? perfil.especialidades
    : [perfil.nicho, "Marketing de contenidos", "Redes sociales", "Storytelling"].filter(Boolean)) as string[];

  return (
    <div className="min-h-screen bg-bg flex">
      {/* ═══════════ Sidebar ═══════════ */}
      <Sidebar pct={pct} />

      {/* ═══════════ Contenido ═══════════ */}
      <div className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-5 space-y-5">
          {/* Barra superior móvil */}
          <div className="lg:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center text-white font-display font-extrabold text-sm">M</div>
              <span className="font-display font-extrabold">Mel<span className="text-accent">sprout</span></span>
            </div>
            <Link href="/app/ruta" className="text-[13px] font-medium text-sub">← Inicio</Link>
          </div>

          {/* ——— Encabezado con portada ——— */}
          <Encabezado perfil={perfil} edad={edad} tags={tags} xpPct={xpPct} nivel={nivel} />

          {/* ——— Fila de estadísticas ——— */}
          <section className="bg-surface border border-border rounded-2xl px-2 py-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <StatCol label="Nivel actual">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent-soft grid place-items-center shrink-0">🛡️</div>
                  <div>
                    <div className="font-display text-lg font-extrabold leading-tight">Nivel {nivel.actual.nivel}</div>
                    <div className="text-[11px] text-sub">{nivel.actual.nombre}</div>
                    <div className="h-1.5 w-24 rounded-full bg-bg mt-1 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${xpPct}%` }} />
                    </div>
                  </div>
                </div>
              </StatCol>
              <StatCol label="Puntos acumulados">
                <div className="font-display text-2xl font-extrabold leading-tight">{perfil.xp.toLocaleString()}</div>
                <div className="text-[12px] font-semibold text-green">+120 esta semana</div>
              </StatCol>
              <StatCol label="Clases completadas">
                <div className="font-display text-2xl font-extrabold leading-tight">0</div>
                <div className="text-[12px] text-sub">de {TOTAL_CLASES} clases</div>
              </StatCol>
              <StatCol label="Racha actual">
                <div className="font-display text-2xl font-extrabold leading-tight">{perfil.racha} días</div>
                <div className="text-[12px] text-sub">¡Sigue así!</div>
              </StatCol>
              <StatCol label="Miembro desde">
                <div className="font-display text-2xl font-extrabold leading-tight">{miembro.etiqueta}</div>
                <div className="text-[12px] text-sub">{miembro.hace}</div>
              </StatCol>
            </div>
          </section>

          {/* ——— Tabs ——— */}
          <div className="border-b border-border flex gap-6 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
                  tab === t ? "border-accent text-accent" : "border-transparent text-sub hover:text-text"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* ——— Contenido de cada tab ——— */}
          {tab === "Resumen" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
              <div className="space-y-5 min-w-0">
                <ProgresoCurso />
                <LogrosDestacados />
                <CampanasMarcas />
              </div>
              <div className="space-y-5">
                <SobreMi perfil={perfil} email={email} edad={edad} />
                <Habilidades />
                <RedesConectadas perfil={perfil} />
              </div>
            </div>
          )}

          {tab === "Actividad" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ActividadReciente />
              <Recomendaciones />
              <QuienVio />
            </div>
          )}

          {tab === "Logros" && <LogrosDestacados />}
          {tab === "Redes y enlaces" && <div className="max-w-md"><RedesConectadas perfil={perfil} /></div>}
          {tab === "Reseñas" && (
            <div className="bg-surface border border-border rounded-2xl p-10 text-center text-sub">
              <div className="text-4xl mb-2">⭐</div>
              <p className="font-semibold text-text">Aún no tienes reseñas</p>
              <p className="text-sm mt-1">Cuando colabores con marcas, sus reseñas aparecerán aquí.</p>
            </div>
          )}

          {/* Actividad reciente también en Resumen (parte baja) */}
          {tab === "Resumen" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ActividadReciente />
              <Recomendaciones />
              <QuienVio />
            </div>
          )}

          {/* ——— Banner ——— */}
          <section className="bg-gradient-to-r from-accent to-[#A78BFA] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between text-white shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🤝</div>
              <div>
                <h3 className="font-display font-extrabold text-lg">Haz crecer tu red</h3>
                <p className="text-white/85 text-sm">Conecta con otros creadores, marcas y mentores para crear oportunidades juntos.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <button className="bg-white text-accent font-bold text-sm rounded-xl px-5 py-2.5 hover:brightness-95 transition">Explorar comunidad</button>
              <div className="hidden sm:block text-right">
                <div className="font-bold">+128</div>
                <div className="text-white/80 text-[12px]">nuevos creadores esta semana</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ————————————— Encabezado —————————————
function Encabezado({ perfil, edad, tags, xpPct, nivel }: {
  perfil: Perfil; edad: number | null; tags: string[];
  xpPct: number; nivel: ReturnType<typeof nivelPorXP>;
}) {
  void xpPct; void nivel;
  return (
    <section className="relative rounded-2xl overflow-hidden border border-border shadow-sm">
      {/* Fondo */}
      <div className="absolute inset-0" style={
        perfil.cover_url
          ? { backgroundImage: `url(${perfil.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(115deg,#6D28D9 0%,#7C3AED 45%,#A78BFA 100%)" }
      } />
      {perfil.cover_url && <div className="absolute inset-0 bg-gradient-to-r from-[#5B21B6]/95 via-[#7C3AED]/80 to-transparent" />}
      <PortadaCam coverUrl={perfil.cover_url} />

      <div className="relative p-5 sm:p-7 flex flex-col sm:flex-row gap-5">
        <div className="shrink-0">
          <div className="rounded-full ring-4 ring-white/60 w-fit">
            <AvatarUploader avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? ""} size={104} />
          </div>
        </div>

        <div className="flex-1 min-w-0 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
                <span className="truncate">{perfil.full_name ?? "Creador"}</span>
                <VerifiedBadge />
              </h1>
              <p className="text-white/90 text-sm mt-0.5 font-medium">{perfil.headline || "Creador de contenido"}</p>
              <p className="text-white/75 text-[13px] mt-0.5">
                {[perfil.ciudad, perfil.pais].filter(Boolean).join(", ") || perfil.pais || "—"} {banderaPais(perfil.pais)}
                {edad ? ` · ${edad} años` : ""}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link href="/app/perfil/completar" className="bg-white text-accent font-bold text-[13px] rounded-xl px-4 py-2.5 hover:brightness-95 transition">Editar perfil</Link>
              <Link href="/app/config" aria-label="Configuración" className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 grid place-items-center transition"><GearIcon /></Link>
            </div>
          </div>

          {perfil.bio && <p className="text-white/90 text-[13px] mt-3 max-w-xl leading-relaxed line-clamp-2">{perfil.bio}</p>}

          <div className="flex flex-wrap gap-2 mt-3">
            {tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[12px] font-semibold bg-white/20 text-white rounded-full px-3 py-1 backdrop-blur">{t}</span>
            ))}
            <Link href="/app/perfil/completar" className="text-[12px] font-bold bg-white/20 text-white rounded-full w-7 h-7 grid place-items-center hover:bg-white/30 transition">+</Link>
          </div>

          <div className="sm:hidden flex items-center gap-2 mt-4">
            <Link href="/app/perfil/completar" className="flex-1 text-center bg-white text-accent font-bold text-[13px] rounded-xl px-4 py-2.5">Editar perfil</Link>
            <Link href="/app/config" aria-label="Configuración" className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center"><GearIcon /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortadaCam({ coverUrl }: { coverUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function procesar(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const W = 1200, H = 400;
          const canvas = document.createElement("canvas");
          canvas.width = W; canvas.height = H;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("no ctx"));
          const scale = Math.max(W / img.width, H / img.height);
          const dw = img.width * scale, dh = img.height * scale;
          ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("img"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const dataUrl = await procesar(file);
      const r = await subirCover(dataUrl);
      if (!("error" in r)) router.refresh();
    } catch { /* ignore */ } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  void coverUrl;
  return (
    <>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={subiendo}
        aria-label="Cambiar portada"
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-lg bg-black/30 hover:bg-black/45 text-white grid place-items-center backdrop-blur transition disabled:opacity-60">
        {subiendo ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CameraIcon />}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
    </>
  );
}

// ————————————— Sidebar —————————————
function Sidebar({ pct }: { pct: number }) {
  const nav = [
    { label: "Inicio", href: "/app/ruta", icon: <HomeIcon /> },
    { label: "Todas las clases", href: "/app/ruta", icon: <BookIcon /> },
    { label: "Clases en vivo", href: "/app/ruta", icon: <LiveIcon /> },
    { label: "Comunidad", href: "/app/ruta", icon: <PeopleIcon /> },
    { label: "Mi perfil", href: "/app/perfil", icon: <UserIcon />, active: true },
  ];
  const atajos = [
    { label: "Mi progreso", href: "/app/ruta" },
    { label: "Mis certificados", href: "/app/perfil" },
    { label: "Mis retos", href: "/app/ruta" },
    { label: "Mis campañas", href: "/app/perfil" },
    { label: "Mis favoritos", href: "/app/perfil" },
    { label: "Configuración", href: "/app/config" },
  ];
  return (
    <aside className="hidden lg:flex flex-col w-[248px] shrink-0 bg-surface border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="px-6 py-6">
        <span className="font-display text-2xl font-extrabold">Crea<span className="text-accent">+</span></span>
      </div>
      <nav className="px-3 space-y-1">
        {nav.map((n) => (
          <Link key={n.label} href={n.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              n.active ? "bg-accent-soft text-accent" : "text-sub hover:bg-bg hover:text-text"
            }`}>
            <span className={n.active ? "text-accent" : "text-hint"}>{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>

      <div className="px-6 mt-6 mb-2 text-[11px] font-bold uppercase tracking-wide text-hint">Atajos</div>
      <nav className="px-3 space-y-0.5">
        {atajos.map((a) => (
          <Link key={a.label} href={a.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-sub hover:bg-bg hover:text-text transition">
            <span className="w-4 h-4 rounded-full border-2 border-current opacity-40" />{a.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 mt-6">
        <div className="bg-accent-soft/70 border border-accent/15 rounded-2xl p-4 text-center">
          <p className="font-display font-extrabold text-sm">¡Completa tu perfil!</p>
          <p className="text-[11px] text-[#5B21B6] mt-1 leading-snug">Tener tu perfil completo te ayudará a conectar con más oportunidades.</p>
          <div className="my-3"><AnilloMini pct={pct} /></div>
          <Link href="/app/perfil/completar" className="block bg-accent text-white text-[13px] font-bold rounded-xl py-2.5 hover:brightness-110 transition">Completar ahora</Link>
        </div>
      </div>

      <div className="px-4 mt-4 mb-6">
        <div className="border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-soft grid place-items-center">💎</div>
            <div>
              <div className="text-[11px] text-sub">Tu plan</div>
              <div className="font-bold text-sm">Creador Pro</div>
            </div>
          </div>
          <p className="text-[11px] text-hint mt-2">Activo hasta 12/12/2024</p>
          <button className="w-full border border-border rounded-lg py-2 text-[12px] font-semibold text-sub mt-3 hover:bg-bg transition">Ver beneficios</button>
        </div>
      </div>
    </aside>
  );
}

// ————————————— Secciones —————————————
function ProgresoCurso() {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold">Mi progreso en el curso</h2>
        <Link href="/app/ruta" className="text-[13px] font-semibold text-accent">Ver detalle</Link>
      </div>
      <div className="flex gap-4">
        <div className="w-28 h-20 rounded-xl bg-gradient-to-br from-accent to-[#A78BFA] shrink-0 grid place-items-center text-2xl">🎬</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">Crea contenido que conecta</h3>
          <p className="text-[12px] text-sub">Nivel: Intermedio · 12 lecciones</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: "60%" }} />
            </div>
            <span className="text-[12px] font-bold text-sub">60%</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
        <MiniDato label="Lecciones completadas" valor="7 / 12" />
        <MiniDato label="Tiempo invertido" valor="6h 30m" />
        <MiniDato label="Próxima lección" valor="Estructura de un guion viral" chico />
      </div>
    </section>
  );
}

function LogrosDestacados() {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold">Logros destacados</h2>
        <span className="text-[13px] font-semibold text-accent cursor-default">Ver todos</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {LOGROS.map((l) => (
          <div key={l.titulo} className="text-center">
            <div className="w-16 h-16 mx-auto grid place-items-center text-2xl"
              style={{ background: l.bg, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
              {l.emoji}
            </div>
            <p className="font-bold text-[12px] mt-2 leading-tight">{l.titulo}</p>
            <p className="text-[10px] text-sub leading-tight mt-0.5">{l.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CampanasMarcas() {
  const estadoTono: Record<string, string> = {
    "Completada": "text-green bg-green-soft", "En revisión": "text-amber bg-amber-soft", "En curso": "text-accent bg-accent-soft",
  };
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold">Campañas con marcas</h2>
        <span className="text-[13px] font-semibold text-accent cursor-default">Ver todas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-hint">
              <th className="pb-2 font-semibold">Campaña</th><th className="pb-2 font-semibold">Marca</th>
              <th className="pb-2 font-semibold">Entrega</th><th className="pb-2 font-semibold">Pago</th><th className="pb-2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CAMPANAS.map((c) => (
              <tr key={c.campana}>
                <td className="py-3 pr-3">
                  <div className="font-semibold text-[13px] leading-tight">{c.campana}</div>
                  <div className="text-[11px] text-sub">{c.tipo}</div>
                </td>
                <td className="py-3 pr-3 text-[13px] font-medium">{c.marca}</td>
                <td className="py-3 pr-3">
                  <div className={`text-[12px] font-semibold ${c.entrega === "Entregado" ? "text-green" : c.entrega === "En revisión" ? "text-amber" : "text-sub"}`}>{c.entrega}</div>
                  <div className="text-[10px] text-hint">{c.entregaFecha}</div>
                </td>
                <td className="py-3 pr-3">
                  <div className={`text-[12px] font-semibold ${c.pago === "Pagado" ? "text-green" : "text-sub"}`}>{c.pago}</div>
                  <div className="text-[10px] text-hint">{c.pagoFecha}</div>
                </td>
                <td className="py-3"><span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${estadoTono[c.estado]}`}>{c.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SobreMi({ perfil, email, edad }: { perfil: Perfil; email: string; edad: number | null }) {
  void edad;
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-extrabold">Sobre mí</h2>
        <Link href="/app/perfil/completar?paso=bio" aria-label="Editar" className="text-sub hover:text-accent"><PencilIcon /></Link>
      </div>
      <p className="text-sub text-sm leading-relaxed whitespace-pre-line">
        {perfil.bio || "Cuéntale al mundo quién eres y qué creas. ✍️"}
      </p>
      <div className="space-y-3 mt-5">
        <InfoRow icon={<MailIcon />} label="Correo" valor={email} />
        <InfoRow icon={<PinIcon />} label="Ubicación" valor={[perfil.ciudad, perfil.pais].filter(Boolean).join(", ") || "—"} />
        <InfoRow icon={<GlobeIcon />} label="Idioma" valor="Español (nativo)" />
        <InfoRow icon={<ClockIcon />} label="Disponibilidad" valor={perfil.abierto_colab ? "Abierta a colaboraciones" : "No disponible"} />
        <InfoRow icon={<HeartIcon />} label="Intereses" valor={perfil.nicho || "—"} />
      </div>
      <button className="w-full flex items-center justify-center gap-2 border border-accent/30 text-accent font-bold text-sm rounded-xl py-2.5 mt-5 hover:bg-accent-soft transition">
        <ShareIcon /> Compartir perfil
      </button>
    </section>
  );
}

function Habilidades() {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold">Habilidades</h2>
        <span className="text-[13px] font-semibold text-accent cursor-default">Ver todas</span>
      </div>
      <div className="space-y-3.5">
        {HABILIDADES.map((h) => (
          <div key={h.nombre} className="flex items-center gap-3">
            <span className="text-[13px] text-text w-40 shrink-0">{h.nombre}</span>
            <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: `${h.nivel}%` }} />
            </div>
            <span className="text-[12px] font-bold text-sub w-9 text-right">{h.nivel}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RedesConectadas({ perfil }: { perfil: Perfil }) {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold">Redes conectadas</h2>
        <Link href="/app/perfil/completar?paso=conectar" className="text-[13px] font-semibold text-accent">Gestionar</Link>
      </div>
      <div className="space-y-3.5">
        {REDES.map((r) => {
          const handle = perfil.metricas?.[r.key]?.username || perfil.redes?.[r.key];
          const Icon = r.icon;
          return (
            <div key={r.key} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full grid place-items-center text-white shrink-0" style={{ background: r.color }}><Icon /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px]">{r.nombre}</div>
                <div className="text-[12px] text-sub truncate">{handle ? `@${handle}` : r.sub}</div>
              </div>
              {handle
                ? <span className="text-[12px] font-semibold text-green shrink-0">Conectada</span>
                : <Link href="/app/perfil/completar?paso=conectar" className="text-[12px] font-semibold text-accent shrink-0">Conectar</Link>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActividadReciente() {
  const tonos: Record<string, string> = { green: "bg-green-soft", blue: "bg-blue-soft", pink: "bg-pink-soft", accent: "bg-accent-soft" };
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-extrabold">Actividad reciente</h2>
        <span className="text-[12px] font-semibold text-accent cursor-default">Ver toda la actividad</span>
      </div>
      <div className="space-y-4">
        {ACTIVIDAD.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg grid place-items-center text-sm shrink-0 ${tonos[a.tono]}`}>{a.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-tight"><span className="text-sub">{a.titulo}</span> <span className="font-semibold">{a.sub}</span></p>
              <p className="text-[11px] text-hint mt-0.5">{a.hace}</p>
            </div>
            <span className="text-[12px] font-bold text-accent shrink-0">{a.xp}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Recomendaciones() {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-extrabold">Recomendaciones para ti</h2>
        <span className="text-[12px] font-semibold text-accent cursor-default">Ver todas</span>
      </div>
      <div className="space-y-3">
        {RECOMENDACIONES.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-soft grid place-items-center text-sm shrink-0">{r.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] leading-tight truncate">{r.titulo}</p>
              <p className="text-[11px] text-sub">{r.sub}</p>
            </div>
            <button className="w-7 h-7 rounded-full bg-bg grid place-items-center text-sub shrink-0">▶</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuienVio() {
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-extrabold">Quién ha visto tu perfil</h2>
        <span className="text-[12px] font-semibold text-accent cursor-default">Ver todos</span>
      </div>
      <div className="space-y-4">
        {VISITAS.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-[#A78BFA] grid place-items-center text-white text-[12px] font-bold shrink-0">
              {v.nombre.split(" ").map((p) => p[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] leading-tight">{v.nombre}</p>
              <p className="text-[11px] text-sub">{v.rol}</p>
            </div>
            <span className="text-[11px] text-hint shrink-0">{v.hace}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ————————————— Piezas chicas —————————————
function StatCol({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-2">
      <div className="text-[12px] text-sub mb-1">{label}</div>
      {children}
    </div>
  );
}
function MiniDato({ label, valor, chico }: { label: string; valor: string; chico?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-sub">{label}</div>
      <div className={`font-bold text-text mt-0.5 ${chico ? "text-[12px] leading-tight" : "text-sm"}`}>{valor}</div>
    </div>
  );
}
function InfoRow({ icon, label, valor }: { icon: React.ReactNode; label: string; valor: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-hint mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] text-hint">{label}</div>
        <div className="text-[13px] text-text break-words">{valor}</div>
      </div>
    </div>
  );
}
function AnilloMini({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#e0d7f7" strokeWidth="7" />
        <circle cx="42" cy="42" r={r} fill="none" stroke="#7c3aed" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center"><span className="font-display font-extrabold text-accent">{pct}%</span></div>
    </div>
  );
}
function VerifiedBadge() {
  return <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-white/90 text-accent text-[11px] shrink-0" title="Verificado">✓</span>;
}

// ————————————— Iconos —————————————
function CameraIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>; }
function GearIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.62.78 1.05 1.43 1.05H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function PencilIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>; }
function ShareIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>; }
function HomeIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>; }
function BookIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" /><path d="M17 4h3v16h-3" /></svg>; }
function LiveIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17" /></svg>; }
function PeopleIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-4-5.6" /></svg>; }
function UserIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>; }
function MailIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3 7 9 6 9-6" /></svg>; }
function PinIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function GlobeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>; }
function ClockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>; }
function HeartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>; }
function InstagramIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>; }
function TikTokIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 1.9 4 4 4.3v3c-1.5 0-2.9-.4-4-1.1V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.8V3z" /></svg>; }
function YouTubeIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.8 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1c.2-1.2.2-2.5.2-3.8s0-2.6-.2-3.8zM10 15V9l5.2 3z" /></svg>; }
function LinkedInIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.8-2 3.75-2 4 0 4.4 2.6 4.4 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.05 1.4-2.05 2.8V21h-4z" /></svg>; }
