"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Octi } from "@/components/Octi";
import { Confetti } from "@/components/Confetti";
import { guardarOnboarding } from "@/lib/perfil-actions";
import { cumpleEdadMinima, EDAD_MINIMA } from "@/lib/edad";
import { RecortarFoto } from "@/components/RecortarFoto";
import { NICHOS as CAT_NICHOS } from "@/lib/catalogos";

const PAISES = [
  "México", "Colombia", "Argentina", "Perú", "Chile", "Ecuador",
  "Guatemala", "Venezuela", "España", "Estados Unidos", "República Dominicana",
  "Bolivia", "Honduras", "Paraguay", "El Salvador", "Nicaragua",
  "Costa Rica", "Panamá", "Uruguay", "Puerto Rico", "Otro",
];

// Catálogo estandarizado de nichos (incluye "Otro" al final).
const NICHOS = CAT_NICHOS.map((n) => n.id);
const OBJETIVOS = ["Crear contenido", "Crecer en redes", "Conseguir colaboraciones", "Monetizar", "Aún no estoy seguro"];
const EXPERIENCIA = ["Nunca he publicado", "He publicado algunas veces", "Publico constantemente", "Ya soy creador"];
const TIEMPO = ["1 hora", "3 horas", "5 horas", "Más de 5 horas"];
const HABILIDADES = ["💡 Tener ideas", "🎥 Grabar videos", "✂️ Editar videos", "📱 Publicar en redes", "📊 Analizar resultados"];
const COMO_CONOCIO = ["TikTok", "Instagram", "YouTube", "Un amigo", "Google", "Otro"];
const PLATAFORMAS = ["Instagram", "TikTok", "YouTube"];
const AUDIENCIAS = ["0–500", "500–5K", "5K–50K", "50K+"];
// Solo define cómo le habla Octi (creadora / creador / neutro). Nada más.
const GENEROS = ["Femenino", "Masculino", "Prefiero neutro"];

type Clave = "nicho" | "objetivo" | "experiencia" | "tiempo" | "habilidades" | "como_conocio" | "plataforma" | "audiencia" | "genero" | "perfil" | "datos";
type Pregunta = { clave: Clave; pregunta: string; opciones: string[] | null; octi: string; multi?: boolean };

const PREGUNTAS: Pregunta[] = [
  { clave: "nicho", pregunta: "¿Cuál es tu mundo?", opciones: NICHOS, octi: "Toca el tema que más te late. ✨" },
  { clave: "objetivo", pregunta: "¿Cuál es tu objetivo?", opciones: OBJETIVOS, octi: "No hay respuesta mala. Elige la tuya. 🚀" },
  { clave: "experiencia", pregunta: "¿Qué experiencia tienes?", opciones: EXPERIENCIA, octi: "Todos empezamos en algún punto. 💜" },
  { clave: "tiempo", pregunta: "¿Cuánto tiempo puedes dedicar por semana?", opciones: TIEMPO, octi: "Con esto ajusto tu ritmo. ⏰" },
  { clave: "habilidades", pregunta: "¿Qué se te da bien hoy?", opciones: HABILIDADES, octi: "Elige todas las que quieras. 😉", multi: true },
  { clave: "como_conocio", pregunta: "¿Cómo conociste Melsprout?", opciones: COMO_CONOCIO, octi: "Nos ayuda a mejorar. 🙌" },
  { clave: "plataforma", pregunta: "¿Cuál es tu plataforma?", opciones: PLATAFORMAS, octi: "¿Dónde quieres brillar primero? 📱" },
  { clave: "audiencia", pregunta: "¿Cuántos te siguen hoy?", opciones: AUDIENCIAS, octi: "Todos empezamos en algún punto. 💜" },
  { clave: "genero", pregunta: "¿Cómo prefieres que te hable?", opciones: GENEROS, octi: "Para no decirte \"bienvenido\" si eres bienvenida. 🐙" },
  { clave: "perfil", pregunta: "Arma tu perfil", opciones: null, octi: "Así te conoce la comunidad. Puedes cambiarlo cuando quieras. 📸" },
  { clave: "datos", pregunta: "Solo un par de datos más", opciones: null, octi: "Con esto personalizo tu experiencia. 🐙" },
];

// Explica en concreto por qué no puede pasar.
function mensajeEdad(fecha: string): string {
  if (!fecha) return "Pon tu fecha de nacimiento para continuar.";
  return `Tienes que tener al menos ${EDAD_MINIMA} años para usar Melsprout.`;
}

// La etiqueta que ve el alumno → el valor que guardamos.
function generoClave(v: string): "femenino" | "masculino" | "neutro" | undefined {
  if (v === "Femenino") return "femenino";
  if (v === "Masculino") return "masculino";
  if (v === "Prefiero neutro") return "neutro";
  return undefined;
}

// Nivel inicial a partir de la experiencia (para el resumen "Tu camino está listo").
function nivelInicial(exp: string): string {
  if (exp === "Ya soy creador") return "Creador";
  if (exp === "Publico constantemente") return "Creador activo";
  if (exp === "He publicado algunas veces") return "Explorador";
  return "Principiante";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [fase, setFase] = useState<"intro" | "form" | "resumen" | "celebrando">("intro");
  const [paso, setPaso] = useState(0);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [xpCount, setXpCount] = useState(0);

  const [genero, setGenero] = useState("");
  const [nicho, setNicho] = useState("");
  const [nichoOtro, setNichoOtro] = useState(""); // texto libre cuando eligen "Otro"
  const [objetivo, setObjetivo] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [tiempo, setTiempo] = useState("");
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [comoConocio, setComoConocio] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [audiencia, setAudiencia] = useState("");
  const [pais, setPais] = useState("México");
  const [nacimiento, setNacimiento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [porRecortar, setPorRecortar] = useState<File | null>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  const [waOptin, setWaOptin] = useState(true);

  const valores: Record<string, string> = { nicho, objetivo, experiencia, tiempo, como_conocio: comoConocio, plataforma, audiencia, genero };
  const setters: Record<string, (v: string) => void> = {
    nicho: setNicho, objetivo: setObjetivo, experiencia: setExperiencia, tiempo: setTiempo,
    como_conocio: setComoConocio, plataforma: setPlataforma, audiencia: setAudiencia, genero: setGenero,
  };
  const toggleHabilidad = (op: string) =>
    setHabilidades((prev) => (prev.includes(op) ? prev.filter((x) => x !== op) : [...prev, op]));

  const total = PREGUNTAS.length;
  const actual = PREGUNTAS[paso];
  const esUltimo = paso >= total - 1;
  const otroSinLlenar = actual.clave === "nicho" && nicho === "Otro" && !nichoOtro.trim();
  const edadOk = !!nacimiento && cumpleEdadMinima(nacimiento);
  const puedeSiguiente =
    (actual.clave === "datos"
      ? edadOk
      : actual.clave === "perfil" || actual.multi
        ? true
        : !!valores[actual.clave]) && !otroSinLlenar;

  // Cuenta el XP hacia arriba al celebrar (0 → 50)
  useEffect(() => {
    if (fase !== "celebrando") return;
    const t = setInterval(() => setXpCount((n) => (n >= 50 ? 50 : n + 2)), 45);
    return () => clearInterval(t);
  }, [fase]);

  const datosOnboarding = useMemo(
    () => ({
      pais, genero: generoClave(genero), fecha_nacimiento: nacimiento || undefined, whatsapp: whatsapp || undefined,
      whatsapp_optin: waOptin,
      nicho: nicho === "Otro" ? (nichoOtro.trim() || "Otro") : nicho,
      objetivo, plataforma_principal: plataforma, tamano_audiencia: audiencia,
      experiencia: experiencia || undefined, tiempo_semanal: tiempo || undefined,
      habilidades, como_conocio: comoConocio || undefined,
      headline: headline.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarDataUrl: foto || undefined,
    }),
    [pais, genero, nacimiento, whatsapp, waOptin, nicho, nichoOtro, objetivo, plataforma, audiencia, experiencia, tiempo, habilidades, comoConocio, headline, bio, foto]
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
    if (esUltimo) {
      if (!edadOk) { setError(mensajeEdad(nacimiento)); return; }
      setError(""); setFase("resumen"); return;
    }
    setError("");
    setPaso((p) => Math.min(total - 1, p + 1));
  }
  function masTarde() {
    if (esUltimo) {
      if (!edadOk) { setError(mensajeEdad(nacimiento)); return; }
      setError(""); setFase("resumen"); return;
    }
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

      {/* ===== RESUMEN "Tu camino está listo" ===== */}
      {fase === "resumen" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 onb-slide">
          <img src="/octi.png" alt="Octi" className="octi-float w-24 sm:w-28 drop-shadow-lg" draggable={false} />
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-4 text-center">🎉 ¡Tu camino está listo!</h2>
          <p className="text-sub mt-1.5 text-center">Con base en tus respuestas:</p>

          <div className="mt-6 w-full max-w-md bg-white/85 backdrop-blur rounded-3xl border border-white shadow-lg p-5 sm:p-6 space-y-3">
            <ResumenFila etiqueta="Nivel inicial" valor={nivelInicial(experiencia)} />
            <ResumenFila etiqueta="Objetivo" valor={objetivo || "Crear contenido"} />
            <ResumenFila etiqueta="Tiempo disponible" valor={tiempo ? `${tiempo} por semana` : "A tu ritmo"} />
            <ResumenFila etiqueta="Recomendación" valor="Empieza por Fundamentos" />
            <ResumenFila etiqueta="Primer reto" valor="Completa tu primera clase" />
          </div>

          {error && <p className="mt-4 text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2.5 text-center max-w-md w-full">{error}</p>}

          <button onClick={() => guardar(true)} disabled={pendiente}
            className="mt-7 bg-accent text-white font-bold rounded-2xl px-8 py-4 text-base shadow-lg shadow-accent/30 hover:brightness-110 hover:scale-[1.03] active:scale-95 transition disabled:opacity-60">
            {pendiente ? "Guardando…" : "¡Empezar! 🚀"}
          </button>
          <button onClick={() => { setError(""); setFase("form"); }} disabled={pendiente}
            className="mt-3 text-[13px] font-semibold text-sub hover:underline disabled:opacity-60">
            ← Volver a las preguntas
          </button>
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
              <img src="/octi.png" alt="Octi" className="octi-float w-24 sm:w-40 shrink-0 drop-shadow-lg" draggable={false} />
            </div>

            {/* Opciones (píldoras) o campos */}
            {actual.multi && actual.opciones ? (
              <div className="max-w-xl mx-auto w-full">
                <p className="text-center text-[12.5px] text-sub mb-3">Puedes elegir varias 👇</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {actual.opciones.map((op) => (
                    <Pastilla key={op} activa={habilidades.includes(op)} onClick={() => toggleHabilidad(op)}>
                      {op}
                    </Pastilla>
                  ))}
                </div>
              </div>
            ) : actual.opciones ? (
              <div className="max-w-xl mx-auto w-full">
                <div className={actual.clave === "nicho" ? "grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[46vh] overflow-y-auto py-1" : "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"}>
                  {actual.opciones.map((op) => (
                    <Pastilla key={op} activa={valores[actual.clave] === op} onClick={() => setters[actual.clave](op)}>
                      {op}
                    </Pastilla>
                  ))}
                </div>
                {/* Texto libre cuando eligen "Otro" en el nicho */}
                {actual.clave === "nicho" && nicho === "Otro" && (
                  <input value={nichoOtro} onChange={(e) => setNichoOtro(e.target.value)} maxLength={40} autoFocus
                    placeholder="Escribe tu nicho…"
                    className="mt-3 w-full rounded-xl border-2 border-accent/40 bg-white px-4 py-3 text-sm outline-none focus:border-accent transition" />
                )}
              </div>
            ) : actual.clave === "perfil" ? (
              <div className="max-w-md mx-auto w-full space-y-4 bg-white/80 backdrop-blur rounded-3xl border border-white shadow-lg p-5 sm:p-6">
                <div className="flex flex-col items-center gap-2.5">
                  <button type="button" onClick={() => fotoRef.current?.click()}
                    className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent/25 grid place-items-center bg-white shadow-sm hover:border-accent/50 transition">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt="" className="w-full h-full object-cover" />
                    ) : <span className="text-3xl">📷</span>}
                  </button>
                  <button type="button" onClick={() => fotoRef.current?.click()}
                    className="text-[13px] font-bold text-accent">
                    {foto ? "Cambiar foto" : "Subir tu foto"}
                  </button>
                  <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (fotoRef.current) fotoRef.current.value = "";
                      if (!f) return;
                      if (f.size > 12 * 1024 * 1024) { setError("La imagen pesa más de 12 MB."); return; }
                      setError("");
                      setPorRecortar(f);
                    }} />
                </div>

                <Campo label="¿A qué te dedicas?">
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={60}
                    placeholder="Ej. Creadora de contenido de belleza"
                    className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition" />
                </Campo>

                <Campo label="Cuéntanos de ti">
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3}
                    placeholder="Lo que quieras que vean las demás al entrar a tu perfil…"
                    className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition resize-none" />
                  <p className="text-[11.5px] text-hint text-right mt-1">{bio.length}/280</p>
                </Campo>

                <p className="text-[12px] text-sub text-center leading-snug">
                  Todo esto es opcional y lo puedes cambiar después desde tu perfil.
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto w-full space-y-4 bg-white/80 backdrop-blur rounded-3xl border border-white shadow-lg p-5 sm:p-6">
                <Campo label="¿De qué país eres?">
                  <select value={pais} onChange={(e) => setPais(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition">
                    {PAISES.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </Campo>
                <Campo label="Fecha de nacimiento">
                  <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className={`w-full rounded-xl border-2 bg-white px-3.5 py-3 text-sm outline-none transition ${
                      nacimiento && !edadOk ? "border-pink" : "border-border focus:border-accent"
                    }`} />
                  <p className={`text-[12px] mt-1.5 leading-snug ${nacimiento && !edadOk ? "text-pink" : "text-hint"}`}>
                    {nacimiento && !edadOk
                      ? `Melsprout es para mayores de ${EDAD_MINIMA} años.`
                      : `Necesitamos confirmar que tienes ${EDAD_MINIMA} años o más.`}
                  </p>
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

            {porRecortar && (
              <RecortarFoto
                file={porRecortar}
                onCancelar={() => setPorRecortar(null)}
                onListo={(url) => { setFoto(url); setPorRecortar(null); }}
              />
            )}
           </div>

            {/* Navegación (abajo) */}
            <div className="flex items-center justify-between gap-3 mt-6 max-w-xl mx-auto w-full">
              <button onClick={masTarde} disabled={pendiente}
                className="text-[15px] font-semibold text-sub rounded-2xl px-6 py-3.5 bg-white/60 hover:bg-white transition disabled:opacity-60">
                Más tarde
              </button>
              <button onClick={siguiente} disabled={!puedeSiguiente || pendiente}
                className="bg-accent text-white font-bold text-[15px] rounded-2xl px-8 py-3.5 shadow-lg shadow-accent/25 hover:brightness-110 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:scale-100 transition">
                {pendiente ? "Guardando…" : esUltimo ? "Ver mi camino 🗺️" : "Siguiente"}
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

function ResumenFila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 last:border-0 pb-2.5 last:pb-0">
      <span className="text-[13px] text-sub">{etiqueta}</span>
      <span className="text-[13.5px] font-bold text-text text-right">{valor}</span>
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

function ArrowLeft() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
}
