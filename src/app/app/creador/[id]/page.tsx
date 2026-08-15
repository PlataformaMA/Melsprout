import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nivelPorXP } from "@/lib/data";
import { getAvanceDe } from "@/lib/progreso-actions";
import { banderaUrl } from "@/lib/catalogos";
import { getSocial } from "@/lib/seguidores-actions";
import { AppSidebar } from "@/components/AppSidebar";
import { SocialPerfil } from "@/components/SocialPerfil";

// Decorativos por ahora: nadie los gana todavía y son iguales para todos.
const BADGES = [
  { img: "/badges/fuego.png", nombre: "Racha encendida" },
  { img: "/badges/video.png", nombre: "Creador de video" },
  { img: "/badges/camara.png", nombre: "Fotógrafo" },
  { img: "/badges/corazon.png", nombre: "Favorito de la comunidad" },
  { img: "/badges/corona.png", nombre: "Top creador" },
];
const HABILIDADES = [
  { nombre: "Creación De Contenido", nivel: 42 },
  { nombre: "Grabación Y Edición", nivel: 30 },
  { nombre: "Estrategia De Redes", nivel: 26 },
  { nombre: "Copywriting", nivel: 22 },
];

// El certificado Starter se otorga al terminar el primer módulo.
const CLASES_MODULO_1 = 8;

function edadDe(fecha: string | null): number | null {
  if (!fecha) return null;
  const n = new Date(fecha);
  if (Number.isNaN(n.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
  return e > 0 && e < 120 ? e : null;
}

// Perfil PÚBLICO de otro creador. Muestra solo lo que ya se expone en la
// comunidad: nunca correo, WhatsApp ni fecha de nacimiento (de ahí solo sale la
// edad). Las tarjetas de "completa tu perfil" e "invita a un amigo" no van aquí:
// son tuyas, no de la persona que estás viendo.
export default async function CreadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (id === user.id) redirect("/app/perfil");

  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select("id, full_name, username, avatar_url, cover_url, headline, bio, ciudad, pais, nicho, especialidades, redes, xp, racha, created_at, fecha_nacimiento, onboarding_completo")
    .eq("id", id)
    .maybeSingle();
  if (!p || !p.onboarding_completo) notFound();

  const [avance, social] = await Promise.all([getAvanceDe(id), getSocial(id)]);
  const clases = avance.clases;
  const retos = avance.retos;

  const nivel = nivelPorXP((p.xp as number) || 0);
  const pct = nivel.siguiente
    ? Math.min(100, Math.round((((p.xp as number) - nivel.actual.xp) / (nivel.siguiente.xp - nivel.actual.xp)) * 100))
    : 100;
  const nombre = (p.full_name as string) || "Creador";
  const redes = (p.redes as Record<string, string>) || {};
  const nichos = [p.nicho, ...(((p.especialidades as string[]) || []))].filter(Boolean) as string[];
  const edad = edadDe(p.fecha_nacimiento as string | null);
  const bandera = banderaUrl(p.pais as string | null);
  const certificado = clases >= CLASES_MODULO_1;

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="comunidad" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-5">
          <Link href="/app/comunidad"
            className="w-10 h-10 rounded-full bg-surface border border-border grid place-items-center text-lg hover:border-accent/40 transition"
            aria-label="Volver">←</Link>

          <div className="grid lg:grid-cols-[1fr_320px] gap-5 mt-4 items-start">
            <div className="min-w-0">
              {/* Cabecera */}
              <section className="rounded-3xl border-2 border-accent bg-surface p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url as string} alt={nombre}
                      className="w-20 h-20 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-accent/20 text-accent grid place-items-center font-display font-extrabold text-2xl shrink-0">
                      {nombre.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h1 className="font-display text-2xl font-extrabold leading-tight truncate">{nombre}</h1>
                        {p.username && <p className="text-[13px] text-sub">@{p.username as string}</p>}
                        {edad !== null && <p className="text-[13px] text-sub">{edad} años</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.ciudad && <span className="text-[13px] text-sub">{p.ciudad as string}</span>}
                        {bandera ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={bandera} alt={(p.pais as string) ?? ""} className="w-6 h-6 rounded-full object-cover ring-1 ring-black/10" />
                        ) : <span className="text-lg">🌎</span>}
                      </div>
                    </div>
                    {p.headline && (
                      <span className="inline-block mt-2 text-[12px] font-bold text-accent bg-accent-soft rounded-full px-3 py-1">
                        {p.headline as string}
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de nivel con Octi */}
                <div className="relative mt-4 h-2.5 rounded-full bg-[#EEEBF6]">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/octi.png" alt="" className="absolute -top-3.5 w-8 -translate-x-1/2"
                    style={{ left: `clamp(16px, ${pct}%, calc(100% - 16px))` }} />
                </div>

                <SocialPerfil userId={id} inicial={social} />
              </section>

              {/* Sobre mí */}
              {p.bio && (
                <section className="mt-6">
                  <h2 className="font-display text-lg font-extrabold">Sobre mí</h2>
                  <p className="text-[13.5px] leading-relaxed mt-1.5 whitespace-pre-line">{p.bio as string}</p>
                  <p className="text-[12px] text-hint mt-2">
                    Se unió en {new Date(p.created_at as string).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                  </p>
                </section>
              )}

              {/* Nichos */}
              {nichos.length > 0 && (
                <section className="mt-5">
                  <h2 className="font-display text-lg font-extrabold mb-2">Nichos</h2>
                  <div className="flex flex-wrap gap-2">
                    {nichos.map((n) => (
                      <span key={n} className="rounded-full bg-accent-soft text-accent text-[12.5px] font-semibold px-3.5 py-1.5">{n}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Resumen */}
              <div className="mt-6 border-b border-border">
                <span className="inline-block pb-2 border-b-2 border-accent text-accent font-display font-extrabold text-[15px]">Resumen</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                <Stat icon="📊" valor={`Nivel ${nivel.actual.nivel}`} label="Nivel actual" />
                <Stat icon="⭐" valor={((p.xp as number) || 0).toLocaleString("es-MX")} label="Puntos" />
                <Stat icon="📖" valor={`${clases} / ${avance.totalClases}`} label="Clases completadas" />
                <Stat icon="💥" valor={`${retos} / ${avance.totalRetos}`} label="Retos completados" />
                <Stat icon="🔥" valor={`${(p.racha as number) || 0}`} label="Días de racha" />
              </div>

              {/* Badgeds */}
              <section className="mt-7">
                <h2 className="font-display text-lg font-extrabold mb-3">Badgeds</h2>
                <div className="flex flex-wrap gap-3">
                  {BADGES.map((b) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={b.img} src={b.img} alt={b.nombre} title={b.nombre}
                      className="w-14 h-14 object-contain select-none" draggable={false} />
                  ))}
                </div>
              </section>

              {/* Habilidades */}
              <section className="mt-7">
                <h2 className="font-display text-lg font-extrabold mb-3">Habilidades</h2>
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  {HABILIDADES.map((h) => (
                    <div key={h.nombre}>
                      <div className="text-[13.5px] font-bold mb-1.5">{h.nombre}</div>
                      <div className="h-2 rounded-full bg-[#EEEBF6]">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${h.nivel}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Certificaciones */}
              <section className="mt-7">
                <h2 className="font-display text-lg font-extrabold mb-3">Certificaciones</h2>
                {certificado ? (
                  <div className="w-[320px] max-w-full rounded-2xl p-5 pb-4 text-white shadow-md relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#7C3AED 0%,#9F67FF 55%,#C4A5FF 100%)" }}>
                    <div className="flex items-end gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold opacity-90">✦ Melsprout</div>
                        <div className="font-display text-xl font-extrabold leading-tight mt-2">
                          Certificado<br />Starter
                        </div>
                        <p className="text-[11px] opacity-90 mt-2 leading-snug">
                          Otorgado a<br /><b>{nombre}</b>
                        </p>
                        <p className="text-[10px] opacity-75 mt-3 leading-snug">
                          Por completar el módulo Básicos del Marketing Digital.
                        </p>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/octi.png" alt="" className="w-20 shrink-0 self-end -mb-1 opacity-95" />
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-hint">Todavía no tiene certificaciones.</p>
                )}
              </section>
            </div>

            {/* Barra lateral: solo sus redes */}
            <aside className="space-y-4">
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-extrabold text-[15px] mb-3">Redes sociales</h3>
                {Object.keys(redes).length === 0 ? (
                  <p className="text-[13px] text-hint">Todavía no conecta ninguna red.</p>
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(redes).map(([red, usuario]) => (
                      <div key={red} className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-bg border border-border grid place-items-center text-[15px] shrink-0">
                          {red === "instagram" ? "📸" : red === "tiktok" ? "🎵" : red === "youtube" ? "▶️" : "🔗"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] text-sub capitalize">{red}</div>
                          <div className="text-[13px] font-semibold truncate">@{usuario}</div>
                        </div>
                        <span className="text-green">✓</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, valor, label }: { icon: string; valor: string; label: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3.5 text-center shadow-sm">
      <div className="text-lg">{icon}</div>
      <div className="font-display font-extrabold text-[15px] mt-1">{valor}</div>
      <div className="text-[11px] text-sub mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
