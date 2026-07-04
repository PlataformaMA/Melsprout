"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Octi } from "@/components/Octi";
import { guardarOnboarding } from "@/lib/perfil-actions";

const PAISES = [
  "México", "Colombia", "Argentina", "Perú", "Chile", "Ecuador",
  "Guatemala", "Venezuela", "España", "Estados Unidos", "República Dominicana",
  "Bolivia", "Honduras", "Paraguay", "El Salvador", "Nicaragua",
  "Costa Rica", "Panamá", "Uruguay", "Puerto Rico", "Otro",
];

const NICHOS = [
  { id: "Moda", emoji: "👗", desc: "Estilo, outfits, tendencias" },
  { id: "Salud", emoji: "🥗", desc: "Bienestar, fitness, nutrición" },
  { id: "Belleza", emoji: "💄", desc: "Maquillaje, skincare, cuidado" },
  { id: "Tech", emoji: "💻", desc: "Tecnología, apps, gadgets" },
  { id: "Lifestyle", emoji: "✨", desc: "Vida diaria, viajes, rutinas" },
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

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [fase, setFase] = useState<"form" | "celebrando">("form");
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Datos
  const [pais, setPais] = useState("México");
  const [nacimiento, setNacimiento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [waOptin, setWaOptin] = useState(true);
  const [nicho, setNicho] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [audiencia, setAudiencia] = useState("");

  // Mensaje de Octi según el paso y las elecciones
  const mensajeOcti = useMemo(() => {
    if (fase === "celebrando")
      return "¡Lo lograste! 🎉 Ganaste +50 XP de bienvenida. ¡Vamos a tu camino!";
    if (paso === 1)
      return "¡Bienvenido! 🐙 Soy Octi. Antes de empezar, cuéntame un poco de ti. Son solo 3 preguntas rápidas.";
    if (paso === 2) {
      if (!nicho) return "¿Cuál es tu mundo? Elige el tema que más te late. 💜";
      const react: Record<string, string> = {
        Moda: "¡Moda! 👗 Un mundo con muchísimo que crear.",
        Salud: "¡Salud y bienestar! 🥗 Contenido que ayuda a la gente.",
        Belleza: "¡Belleza! 💄 Uno de los nichos más fuertes.",
        Tech: "¡Tech! 💻 Enseñar tecnología engancha muchísimo.",
        Lifestyle: "¡Lifestyle! ✨ Tu día a día puede inspirar a miles.",
      };
      return react[nicho];
    }
    // paso 3
    if (!objetivo) return "Última pregunta: ¿a dónde quieres llegar? 🚀";
    if (objetivo === "Monetizar")
      return "¡Me encanta! 💰 Te llevaré paso a paso hasta que cobres tu primera campaña.";
    if (objetivo === "Crecer mi audiencia")
      return "¡Vamos por esa audiencia! 📈 Constancia + método = crecimiento.";
    return "¡Perfecto para empezar! 🌱 Todos los grandes creadores empezaron en cero.";
  }, [paso, fase, nicho, objetivo]);

  const puedeAvanzar =
    (paso === 1 && !!pais) ||
    (paso === 2 && !!nicho) ||
    (paso === 3 && !!objetivo && !!plataforma && !!audiencia);

  function siguiente() {
    setError("");
    if (paso < 3) {
      setPaso(paso + 1);
      return;
    }
    // Guardar
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
      if ("error" in r) {
        setError(r.error);
      } else {
        setFase("celebrando");
        setTimeout(() => {
          router.replace("/app");
          router.refresh();
        }, 3200);
      }
    });
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      {/* Barra de progreso */}
      <div className="px-6 pt-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-2 flex-1 rounded-full overflow-hidden bg-border"
            >
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{
                  width:
                    fase === "celebrando" || paso > n
                      ? "100%"
                      : paso === n
                      ? "50%"
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>
        {fase === "form" && (
          <p className="text-xs text-hint mt-2 font-medium">Paso {paso} de 3</p>
        )}
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row lg:items-start gap-8">
        {/* Octi guía */}
        <div className="lg:w-[240px] shrink-0 flex lg:flex-col items-center lg:sticky lg:top-8">
          <Octi size={150} mensaje={mensajeOcti} />
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 w-full">
          {fase === "celebrando" ? (
            <Celebracion />
          ) : (
            <>
              {paso === 1 && (
                <Paso titulo="Cuéntanos de ti" subtitulo="Para personalizar tu experiencia.">
                  <Campo label="¿De qué país eres?">
                    <select
                      value={pais}
                      onChange={(e) => setPais(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    >
                      {PAISES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo label="Fecha de nacimiento (opcional)">
                    <input
                      type="date"
                      value={nacimiento}
                      onChange={(e) => setNacimiento(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    />
                  </Campo>
                  <Campo label="WhatsApp (opcional)">
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ej. +52 55 1234 5678"
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    />
                    <label className="flex items-start gap-2.5 text-[13px] text-sub cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={waOptin}
                        onChange={(e) => setWaOptin(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#7c3aed]"
                      />
                      <span>Quiero recibir recordatorios de Octi por WhatsApp.</span>
                    </label>
                  </Campo>
                </Paso>
              )}

              {paso === 2 && (
                <Paso titulo="¿Cuál es tu mundo?" subtitulo="Elige el tema de tu contenido.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {NICHOS.map((n) => (
                      <Tarjeta
                        key={n.id}
                        activa={nicho === n.id}
                        onClick={() => setNicho(n.id)}
                        emoji={n.emoji}
                        titulo={n.id}
                        desc={n.desc}
                      />
                    ))}
                  </div>
                </Paso>
              )}

              {paso === 3 && (
                <Paso titulo="¿A dónde quieres llegar?" subtitulo="Así te marco el mejor camino.">
                  <Campo label="Tu objetivo">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {OBJETIVOS.map((o) => (
                        <Pildora key={o.id} activa={objetivo === o.id} onClick={() => setObjetivo(o.id)}>
                          <span className="text-lg">{o.emoji}</span>
                          <span>{o.id}</span>
                        </Pildora>
                      ))}
                    </div>
                  </Campo>
                  <Campo label="Tu plataforma principal">
                    <div className="grid grid-cols-3 gap-2.5">
                      {PLATAFORMAS.map((p) => (
                        <Pildora key={p.id} activa={plataforma === p.id} onClick={() => setPlataforma(p.id)}>
                          <span className="text-lg">{p.emoji}</span>
                          <span>{p.id}</span>
                        </Pildora>
                      ))}
                    </div>
                  </Campo>
                  <Campo label="Tamaño de tu audiencia hoy">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {AUDIENCIAS.map((a) => (
                        <Pildora key={a} activa={audiencia === a} onClick={() => setAudiencia(a)}>
                          <span>{a}</span>
                        </Pildora>
                      ))}
                    </div>
                  </Campo>
                </Paso>
              )}

              {error && (
                <p className="mt-4 text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2.5">
                  {error}
                </p>
              )}

              <div className="mt-8 flex items-center gap-3">
                {paso > 1 && (
                  <button
                    onClick={() => { setError(""); setPaso(paso - 1); }}
                    className="text-sm font-medium text-sub hover:text-text px-4 py-3"
                  >
                    ← Atrás
                  </button>
                )}
                <button
                  onClick={siguiente}
                  disabled={!puedeAvanzar || pendiente}
                  className="flex-1 bg-accent text-white font-semibold text-sm rounded-xl py-3 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {pendiente
                    ? "Guardando…"
                    : paso === 3
                    ? "¡Empezar mi camino! 🚀"
                    : "Continuar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Paso({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-text">{titulo}</h1>
      <p className="text-sub text-sm mt-1">{subtitulo}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[13px] font-semibold text-text block mb-1.5">{label}</span>
      {children}
    </div>
  );
}

function Tarjeta({
  activa,
  onClick,
  emoji,
  titulo,
  desc,
}: {
  activa: boolean;
  onClick: () => void;
  emoji: string;
  titulo: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border-2 p-4 transition-all ${
        activa
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface hover:border-accent/40"
      }`}
    >
      <div className="text-3xl">{emoji}</div>
      <div className="font-display font-extrabold mt-2 text-text">{titulo}</div>
      <div className="text-[12.5px] text-sub mt-0.5">{desc}</div>
    </button>
  );
}

function Pildora({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-[13px] font-semibold transition-all ${
        activa
          ? "border-accent bg-accent-soft text-text"
          : "border-border bg-surface text-sub hover:border-accent/40"
      }`}
    >
      {children}
    </button>
  );
}

function Celebracion() {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="octi-pop font-display text-5xl font-extrabold text-accent">
        +50 XP
      </div>
      <h2 className="font-display text-2xl font-extrabold mt-4">
        ¡Bienvenido a Melsprout! 🎉
      </h2>
      <p className="text-sub mt-2 max-w-sm">
        Ganaste tus primeros 50 puntos. Octi te está llevando a tu camino de
        aprendizaje…
      </p>
    </div>
  );
}
