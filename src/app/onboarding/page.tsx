"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Octi } from "@/components/Octi";
import { Confetti } from "@/components/Confetti";
import { guardarOnboarding } from "@/lib/perfil-actions";

const PAISES = [
  "México", "Colombia", "Argentina", "Perú", "Chile", "Ecuador",
  "Guatemala", "Venezuela", "España", "Estados Unidos", "República Dominicana",
  "Bolivia", "Honduras", "Paraguay", "El Salvador", "Nicaragua",
  "Costa Rica", "Panamá", "Uruguay", "Puerto Rico", "Otro",
];

type Color = "pink" | "green" | "accent" | "blue" | "amber";
const NICHOS: { id: string; emoji: string; desc: string; color: Color }[] = [
  { id: "Moda", emoji: "👗", desc: "Estilo, outfits, tendencias", color: "pink" },
  { id: "Salud", emoji: "🥗", desc: "Bienestar, fitness, nutrición", color: "green" },
  { id: "Belleza", emoji: "💄", desc: "Maquillaje, skincare, cuidado", color: "accent" },
  { id: "Tech", emoji: "💻", desc: "Tecnología, apps, gadgets", color: "blue" },
  { id: "Lifestyle", emoji: "✨", desc: "Vida diaria, viajes, rutinas", color: "amber" },
];

const OBJETIVOS = [
  { id: "Empezar desde cero", emoji: "🌱" },
  { id: "Crecer mi audiencia", emoji: "📈" },
  { id: "Monetizar", emoji: "💰" },
];
const PLATAFORMAS = [
  { id: "Instagram", emoji: "📸" },
  { id: "TikTok", emoji: "🎵" },
  { id: "YouTube", emoji: "▶️" },
];
const AUDIENCIAS = ["0–500", "500–5K", "5K–50K", "50K+"];

const COLORES: Record<Color, { ring: string; bg: string; chip: string }> = {
  pink: { ring: "ring-pink", bg: "bg-pink-soft", chip: "bg-pink" },
  green: { ring: "ring-green", bg: "bg-green-soft", chip: "bg-green" },
  accent: { ring: "ring-accent", bg: "bg-accent-soft", chip: "bg-accent" },
  blue: { ring: "ring-blue", bg: "bg-blue-soft", chip: "bg-blue" },
  amber: { ring: "ring-amber", bg: "bg-amber-soft", chip: "bg-amber" },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [fase, setFase] = useState<"intro" | "form" | "celebrando">("intro");
  const [paso, setPaso] = useState(1);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [xpCount, setXpCount] = useState(0);

  const [pais, setPais] = useState("México");
  const [nacimiento, setNacimiento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [waOptin, setWaOptin] = useState(true);
  const [nicho, setNicho] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [audiencia, setAudiencia] = useState("");

  // Cuenta el XP hacia arriba al celebrar (0 → 50)
  useEffect(() => {
    if (fase !== "celebrando") return;
    const t = setInterval(() => {
      setXpCount((n) => (n >= 50 ? 50 : n + 2));
    }, 45);
    return () => clearInterval(t);
  }, [fase]);

  const mensajeOcti = useMemo(() => {
    if (fase === "celebrando")
      return "¡Lo lograste! 🎉 Ganaste tus primeros 50 XP. ¡Vamos a tu camino!";
    if (paso === 1)
      return "Cuéntame un poquito de ti para personalizar tu experiencia. 💜";
    if (paso === 2) {
      if (!nicho) return "¿Cuál es tu mundo? Toca el tema que más te late. ✨";
      const r: Record<string, string> = {
        Moda: "¡Moda! 👗 Un mundo con muchísimo que crear.",
        Salud: "¡Salud y bienestar! 🥗 Contenido que ayuda a la gente.",
        Belleza: "¡Belleza! 💄 De los nichos más fuertes que hay.",
        Tech: "¡Tech! 💻 Enseñar tecnología engancha muchísimo.",
        Lifestyle: "¡Lifestyle! ✨ Tu día a día puede inspirar a miles.",
      };
      return r[nicho];
    }
    if (!objetivo) return "Última pregunta: ¿a dónde quieres llegar? 🚀";
    if (objetivo === "Monetizar")
      return "¡Me encanta! 💰 Te llevaré hasta tu primera campaña pagada.";
    if (objetivo === "Crecer mi audiencia")
      return "¡Vamos por esa audiencia! 📈 Constancia + método.";
    return "¡Perfecto! 🌱 Todos los grandes empezaron en cero.";
  }, [fase, paso, nicho, objetivo]);

  const puedeAvanzar =
    (paso === 1 && !!pais) ||
    (paso === 3 && !!objetivo && !!plataforma && !!audiencia);

  function elegirNicho(id: string) {
    setNicho(id);
    setTimeout(() => setPaso(3), 950); // auto-avanza tras la reacción de Octi
  }

  function finalizar() {
    setError("");
    startTransition(async () => {
      const r = await guardarOnboarding({
        pais,
        fecha_nacimiento: nacimiento || undefined,
        whatsapp: whatsapp || undefined,
        whatsapp_optin: waOptin,
        nicho,
        objetivo,
        plataforma_principal: plataforma,
        tamano_audiencia: audiencia,
      });
      if ("error" in r) setError(r.error);
      else {
        setFase("celebrando");
        setTimeout(() => {
          router.replace("/app");
          router.refresh();
        }, 3600);
      }
    });
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Fondo inmersivo */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-accent-soft via-bg to-pink-soft" />
      <div className="fixed -z-10 top-[-120px] left-[-100px] w-[380px] h-[380px] rounded-full bg-accent/20 blur-3xl onb-blob" />
      <div className="fixed -z-10 bottom-[-140px] right-[-120px] w-[420px] h-[420px] rounded-full bg-pink/20 blur-3xl onb-blob" style={{ animationDelay: "2s" }} />

      {fase === "celebrando" && <Confetti />}

      {/* ===== INTRO ===== */}
      {fase === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center onb-slide">
          <Octi size={200} mensaje="¡Hola! Soy Octi 🐙 Seré tu guía. ¿List@ para armar tu camino?" />
          <h1 className="font-display text-3xl font-extrabold mt-6 max-w-md">
            Bienvenid@ a Melsprout
          </h1>
          <p className="text-sub mt-2 max-w-sm">
            En 30 segundos personalizamos tu experiencia. Solo 3 preguntas rápidas.
          </p>
          <button
            onClick={() => setFase("form")}
            className="mt-8 bg-accent text-white font-bold rounded-2xl px-8 py-4 text-base shadow-lg shadow-accent/30 hover:brightness-110 hover:scale-[1.03] active:scale-95 transition"
          >
            ¡Empecemos! →
          </button>
        </div>
      )}

      {/* ===== CELEBRACIÓN ===== */}
      {fase === "celebrando" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Octi size={190} celebrando conBurbuja={false} />
          <div className="octi-pop font-display text-6xl font-extrabold text-accent mt-6">
            +{xpCount} XP
          </div>
          <h2 className="font-display text-2xl font-extrabold mt-4">
            ¡Bienvenid@ a Melsprout! 🎉
          </h2>
          <p className="text-sub mt-2 max-w-sm">
            Octi te está llevando a tu camino de aprendizaje…
          </p>
        </div>
      )}

      {/* ===== FORM (3 pasos) ===== */}
      {fase === "form" && (
        <>
          <div className="px-6 pt-6 max-w-xl mx-auto w-full">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-2.5 flex-1 rounded-full bg-white/60 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: paso > n ? "100%" : paso === n ? "55%" : "0%" }}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-sub mt-2 font-bold tracking-wide">
              PASO {paso} DE 3
            </p>
          </div>

          <div className="flex-1 max-w-xl mx-auto w-full px-6 py-6 flex flex-col">
            <div className="flex justify-center mb-2">
              <Octi size={128} mensaje={mensajeOcti} />
            </div>

            {/* Contenido del paso (con transición) */}
            <div key={paso} className="onb-slide flex-1">
              {paso === 1 && (
                <Tarjetota titulo="Cuéntanos de ti">
                  <Campo label="¿De qué país eres?">
                    <select
                      value={pais}
                      onChange={(e) => setPais(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition"
                    >
                      {PAISES.map((p) => (<option key={p} value={p}>{p}</option>))}
                    </select>
                  </Campo>
                  <Campo label="Fecha de nacimiento (opcional)">
                    <input
                      type="date"
                      value={nacimiento}
                      onChange={(e) => setNacimiento(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition"
                    />
                  </Campo>
                  <Campo label="WhatsApp (opcional)">
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ej. +52 55 1234 5678"
                      className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition"
                    />
                    <label className="flex items-start gap-2.5 text-[13px] text-sub cursor-pointer mt-2.5">
                      <input type="checkbox" checked={waOptin} onChange={(e) => setWaOptin(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#7c3aed]" />
                      <span>Quiero recordatorios de Octi por WhatsApp. 🐙</span>
                    </label>
                  </Campo>
                </Tarjetota>
              )}

              {paso === 2 && (
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-center mb-5">
                    ¿Cuál es tu mundo?
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {NICHOS.map((n, idx) => (
                      <NichoCard
                        key={n.id}
                        activa={nicho === n.id}
                        onClick={() => elegirNicho(n.id)}
                        emoji={n.emoji}
                        titulo={n.id}
                        desc={n.desc}
                        color={n.color}
                        delay={idx * 60}
                      />
                    ))}
                  </div>
                </div>
              )}

              {paso === 3 && (
                <Tarjetota titulo="¿A dónde quieres llegar?">
                  <Campo label="Tu objetivo">
                    <div className="grid grid-cols-1 gap-2.5">
                      {OBJETIVOS.map((o) => (
                        <Pildora key={o.id} activa={objetivo === o.id} onClick={() => setObjetivo(o.id)} grande>
                          <span className="text-xl">{o.emoji}</span>
                          <span>{o.id}</span>
                        </Pildora>
                      ))}
                    </div>
                  </Campo>
                  <Campo label="Tu plataforma principal">
                    <div className="grid grid-cols-3 gap-2.5">
                      {PLATAFORMAS.map((p) => (
                        <Pildora key={p.id} activa={plataforma === p.id} onClick={() => setPlataforma(p.id)} col>
                          <span className="text-2xl">{p.emoji}</span>
                          <span className="text-xs">{p.id}</span>
                        </Pildora>
                      ))}
                    </div>
                  </Campo>
                  <Campo label="Tu audiencia hoy">
                    <div className="grid grid-cols-4 gap-2">
                      {AUDIENCIAS.map((a) => (
                        <Pildora key={a} activa={audiencia === a} onClick={() => setAudiencia(a)}>
                          <span className="text-xs">{a}</span>
                        </Pildora>
                      ))}
                    </div>
                  </Campo>
                </Tarjetota>
              )}
            </div>

            {error && (
              <p className="mt-4 text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2.5 text-center">
                {error}
              </p>
            )}

            {/* Navegación (paso 2 auto-avanza, no lleva botón) */}
            {paso !== 2 && (
              <div className="mt-6 flex items-center gap-3">
                {paso > 1 && (
                  <button
                    onClick={() => { setError(""); setPaso(paso - 1); }}
                    className="text-sm font-semibold text-sub hover:text-text px-4 py-3.5"
                  >
                    ← Atrás
                  </button>
                )}
                <button
                  onClick={() => (paso === 1 ? setPaso(2) : finalizar())}
                  disabled={!puedeAvanzar || pendiente}
                  className="flex-1 bg-accent text-white font-bold text-sm rounded-2xl py-3.5 shadow-lg shadow-accent/25 hover:brightness-110 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:scale-100 transition"
                >
                  {pendiente ? "Guardando…" : paso === 3 ? "¡Empezar mi camino! 🚀" : "Continuar"}
                </button>
              </div>
            )}
            {paso === 2 && (
              <div className="mt-6 flex">
                <button
                  onClick={() => { setError(""); setPaso(1); }}
                  className="text-sm font-semibold text-sub hover:text-text px-4 py-3.5"
                >
                  ← Atrás
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Tarjetota({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-3xl border border-white shadow-xl shadow-accent/5 p-6">
      <h2 className="font-display text-2xl font-extrabold text-center">{titulo}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[13px] font-bold text-text block mb-2">{label}</span>
      {children}
    </div>
  );
}

function NichoCard({
  activa, onClick, emoji, titulo, desc, color, delay,
}: {
  activa: boolean; onClick: () => void; emoji: string; titulo: string;
  desc: string; color: Color; delay: number;
}) {
  const c = COLORES[color];
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`onb-pop-in relative text-left rounded-3xl p-4 transition-all duration-200 bg-white/90 backdrop-blur shadow-lg ${
        activa
          ? `ring-4 ${c.ring} ${c.bg} scale-[1.03]`
          : "ring-1 ring-black/5 hover:scale-[1.02] hover:-translate-y-0.5"
      }`}
    >
      {activa && (
        <span className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full ${c.chip} text-white grid place-items-center text-xs font-bold onb-pop-in`}>
          ✓
        </span>
      )}
      <div className={`w-14 h-14 rounded-2xl ${c.bg} grid place-items-center text-3xl`}>
        {emoji}
      </div>
      <div className="font-display font-extrabold mt-3 text-text">{titulo}</div>
      <div className="text-[12px] text-sub mt-0.5 leading-snug">{desc}</div>
    </button>
  );
}

function Pildora({
  activa, onClick, children, grande, col,
}: {
  activa: boolean; onClick: () => void; children: React.ReactNode;
  grande?: boolean; col?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex ${col ? "flex-col" : "flex-row"} items-center justify-center gap-1.5 rounded-2xl border-2 font-bold transition-all active:scale-95 ${
        grande ? "px-4 py-3.5" : "px-2 py-3"
      } ${
        activa
          ? "border-accent bg-accent-soft text-text scale-[1.02] shadow-md shadow-accent/15"
          : "border-border bg-white text-sub hover:border-accent/40 hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}
