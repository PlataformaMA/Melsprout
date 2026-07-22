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

// Nichos en el orden del mockup (grid de 2 columnas fila por fila):
// Moda | Belleza  ·  Salud | Tech  ·  Lifestyle | Marketing
const NICHOS = ["Moda", "Salud", "Lifestyle", "Belleza", "Tecnología", "Marketing"];
const OBJETIVOS = ["Empezar desde cero", "Crecer mi audiencia", "Monetizar"];
const PLATAFORMAS = ["Instagram", "TikTok", "YouTube"];
const AUDIENCIAS = ["0–500", "500–5K", "5K–50K", "50K+"];

type Clave = "nicho" | "objetivo" | "plataforma" | "audiencia" | "datos";
type Pregunta = { clave: Clave; pregunta: string; opciones: string[] | null; octi: string };

const PREGUNTAS: Pregunta[] = [
  { clave: "nicho", pregunta: "¿Cuál es tu mundo?", opciones: NICHOS, octi: "Toca el tema que más te late. ✨" },
  { clave: "objetivo", pregunta: "¿A dónde quieres llegar?", opciones: OBJETIVOS, octi: "No hay respuesta mala. Elige la tuya. 🚀" },
  { clave: "plataforma", pregunta: "¿Cuál es tu plataforma?", opciones: PLATAFORMAS, octi: "¿Dónde quieres brillar primero? 📱" },
  { clave: "audiencia", pregunta: "¿Cuántos te siguen hoy?", opciones: AUDIENCIAS, octi: "Todos empezamos en algún punto. 💜" },
  { clave: "datos", pregunta: "Solo un par de datos más", opciones: null, octi: "Con esto personalizo tu experiencia. 🐙" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [fase, setFase] = useState<"intro" | "form" | "celebrando">("intro");
  const [paso, setPaso] = useState(0);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [xpCount, setXpCount] = useState(0);

  const [nicho, setNicho] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [audiencia, setAudiencia] = useState("");
  const [pais, setPais] = useState("México");
  const [nacimiento, setNacimiento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [waOptin, setWaOptin] = useState(true);

  const valores: Record<string, string> = { nicho, objetivo, plataforma, audiencia };
  const setters: Record<string, (v: string) => void> = {
    nicho: setNicho, objetivo: setObjetivo, plataforma: setPlataforma, audiencia: setAudiencia,
  };

  const total = PREGUNTAS.length;
  const actual = PREGUNTAS[paso];
  const esUltimo = paso >= total - 1;
  const puedeSiguiente = actual.opciones ? !!valores[actual.clave] : true;

  // Cuenta el XP hacia arriba al celebrar (0 → 50)
  useEffect(() => {
    if (fase !== "celebrando") return;
    const t = setInterval(() => setXpCount((n) => (n >= 50 ? 50 : n + 2)), 45);
    return () => clearInterval(t);
  }, [fase]);

  const datosOnboarding = useMemo(
    () => ({
      pais, fecha_nacimiento: nacimiento || undefined, whatsapp: whatsapp || undefined,
      whatsapp_optin: waOptin, nicho, objetivo, plataforma_principal: plataforma, tamano_audiencia: audiencia,
    }),
    [pais, nacimiento, whatsapp, waOptin, nicho, objetivo, plataforma, audiencia]
  );

  function guardar(conCelebracion: boolean) {
    setError("");
    startTransition(async () => {
      const r = await guardarOnboarding(datosOnboarding);
      if ("error" in r) { setError(r.error); return; }
      if (conCelebracion) {
        setFase("celebrando");
        setTimeout(() => { router.replace("/app"); router.refresh(); }, 3400);
      } else {
        router.replace("/app"); router.refresh();
      }
    });
  }

  function siguiente() {
    if (esUltimo) { guardar(true); return; }
    setError("");
    setPaso((p) => Math.min(total - 1, p + 1));
  }
  function masTarde() {
    if (esUltimo) { guardar(true); return; }
    setError("");
    setPaso((p) => Math.min(total - 1, p + 1));
  }
  function atras() {
    if (paso === 0) { setFase("intro"); return; }
    setError("");
    setPaso((p) => Math.max(0, p - 1));
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
          <Octi size={190} mensaje="¡Hola! Soy Octi 🐙 Seré tu guía. ¿List@ para armar tu camino?" />
          <h1 className="font-display text-3xl font-extrabold mt-6 max-w-md">Bienvenid@ a Melsprout</h1>
          <p className="text-sub mt-2 max-w-sm">En menos de un minuto personalizamos tu experiencia.</p>
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
          <Octi size={180} celebrando conBurbuja={false} />
          <div className="octi-pop font-display text-6xl font-extrabold text-accent mt-6">+{xpCount} XP</div>
          <h2 className="font-display text-2xl font-extrabold mt-4">¡Bienvenid@ a Melsprout! 🎉</h2>
          <p className="text-sub mt-2 max-w-sm">Octi te está llevando a tu camino de aprendizaje…</p>
        </div>
      )}

      {/* ===== FORM (pregunta por pantalla, estilo mockup) ===== */}
      {fase === "form" && (
        <div className="flex-1 flex flex-col">
          {/* Barra superior: atrás + salir */}
          <div className="flex items-center justify-between px-5 sm:px-8 pt-5">
            <button onClick={atras} aria-label="Atrás"
              className="w-11 h-11 rounded-full bg-white shadow-md grid place-items-center text-accent hover:scale-105 active:scale-95 transition">
              <ArrowLeft />
            </button>
            <button onClick={() => guardar(false)} disabled={pendiente}
              className="text-accent font-bold text-[15px] hover:underline disabled:opacity-60">
              Salir
            </button>
          </div>

          {/* Barra de progreso (ARRIBA, como el mockup) */}
          <div className="px-6 sm:px-8 mt-4">
            <div className="h-2.5 w-full max-w-md mx-auto bg-black/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${((paso + 1) / total) * 100}%` }} />
            </div>
          </div>

          {/* Contenido central */}
          <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-5">
           <div className="flex-1 flex flex-col justify-center">
            {/* Burbuja de pregunta + Octi (Octi a la derecha en desktop, arriba en móvil) */}
            <div key={paso} className="onb-slide flex flex-col-reverse sm:flex-row items-center justify-center gap-4 sm:gap-7 mb-8">
              <div className="relative bg-accent-soft/70 border-2 border-accent/25 rounded-[30px] px-7 py-5 max-w-[360px] w-full sm:w-auto">
                <span className="font-display text-xl sm:text-[26px] font-extrabold text-accent text-center block leading-tight">
                  {actual.pregunta}
                </span>
                <span className="hidden sm:block absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-accent-soft/70 border-r-2 border-t-2 border-accent/25 rotate-45" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/octi.webp" alt="Octi" className="octi-float w-24 sm:w-40 shrink-0 drop-shadow-lg" draggable={false} />
            </div>

            {/* Opciones (píldoras) o campos */}
            {actual.opciones ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto w-full">
                {actual.opciones.map((op) => (
                  <Pastilla key={op} activa={valores[actual.clave] === op} onClick={() => setters[actual.clave](op)}>
                    {op}
                  </Pastilla>
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto w-full space-y-4 bg-white/80 backdrop-blur rounded-3xl border border-white shadow-lg p-5 sm:p-6">
                <Campo label="¿De qué país eres?">
                  <select value={pais} onChange={(e) => setPais(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition">
                    {PAISES.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </Campo>
                <Campo label="Fecha de nacimiento (opcional)">
                  <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition" />
                </Campo>
                <Campo label="WhatsApp (opcional)">
                  <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej. +52 55 1234 5678"
                    className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition" />
                  <label className="flex items-start gap-2.5 text-[13px] text-sub cursor-pointer mt-2.5">
                    <input type="checkbox" checked={waOptin} onChange={(e) => setWaOptin(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#7c3aed]" />
                    <span>Quiero recordatorios de Octi por WhatsApp. 🐙</span>
                  </label>
                </Campo>
              </div>
            )}

            {error && <p className="mt-5 text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2.5 text-center max-w-md mx-auto w-full">{error}</p>}
           </div>

            {/* Navegación (abajo) */}
            <div className="flex items-center justify-between gap-3 mt-6 max-w-xl mx-auto w-full">
              <button onClick={masTarde} disabled={pendiente}
                className="text-[15px] font-semibold text-sub rounded-2xl px-6 py-3.5 bg-white/60 hover:bg-white transition disabled:opacity-60">
                Más tarde
              </button>
              <button onClick={siguiente} disabled={!puedeSiguiente || pendiente}
                className="bg-accent text-white font-bold text-[15px] rounded-2xl px-8 py-3.5 shadow-lg shadow-accent/25 hover:brightness-110 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:scale-100 transition">
                {pendiente ? "Guardando…" : esUltimo ? "¡Empezar! 🚀" : "Siguiente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Pastilla({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`w-full rounded-full border-2 px-5 py-3.5 text-[12.5px] font-bold tracking-wide uppercase transition active:scale-95 ${
        activa
          ? "border-accent bg-accent-soft text-accent shadow-md shadow-accent/15 scale-[1.02]"
          : "border-border bg-white text-sub hover:border-accent/40 hover:-translate-y-0.5 shadow-sm"
      }`}>
      {children}
    </button>
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

function ArrowLeft() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
}
