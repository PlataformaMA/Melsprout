"use client";

// "Sube al siguiente nivel": el aviso de plan Pro.
//
// Sale en dos momentos: cuando alguien termina todas las clases disponibles de
// su plan, y cuando toca algo que todavía no tiene contratado. Por eso el texto
// de arriba cambia (`motivo`) pero la lista de beneficios es siempre la misma.
//
// DESTINO: hoy el botón abre el WhatsApp del equipo, que es por donde se cierra
// la venta. El día que haya página de pago, se cambia SUBIR_URL y ya.
const SUBIR_URL = "https://boostacademy-n8n.n6e5xe.easypanel.host/webhook/fbc26af3-56ad-4a3f-9422-cfbf586f9ec3";

type Beneficio = { titulo: string; detalle: string; icono: React.ReactNode };

const BENEFICIOS: Beneficio[] = [
  {
    titulo: "Más clases especiales",
    detalle: "Para tu camino como creador, con contenidos avanzados.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9 12 4 2 9l10 5 10-5Z" /><path d="M6 11.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" />
      </svg>
    ),
  },
  {
    titulo: "Participa en campañas con marcas reconocidas",
    detalle: "Sé parte de oportunidades reales y lleva tu trabajo al siguiente nivel.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 15-6v14L3 13z" /><path d="M3 11v2a2 2 0 0 0 2 2h1" /><path d="M7 15v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3.5" />
      </svg>
    ),
  },
  {
    titulo: "Una comunidad de tu nicho",
    detalle: "Conecta con personas que comparten tus mismos intereses.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="9" cy="7" r="3.2" />
        <path d="M22 20v-1.5a4 4 0 0 0-3-3.8" /><path d="M16.5 4.2a3.2 3.2 0 0 1 0 6" />
      </svg>
    ),
  },
  {
    titulo: "Eventos presenciales y clases en vivo",
    detalle: "Con referentes de la industria, donde podrás aprender e inspirarte.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    titulo: "Podrás enviar mensajes",
    detalle: "A otros miembros, compartir ideas y resolver dudas.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a7.5 7.5 0 0 1-7.5 7.5H8l-4 2.5V12A7.5 7.5 0 0 1 11.5 4.5h2A7.5 7.5 0 0 1 21 12Z" />
      </svg>
    ),
  },
  {
    titulo: "Beneficios exclusivos",
    detalle: "Acceso anticipado a nuevos cursos, recursos premium, descuentos y más.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9L3.5 9.7l5.9-.8L12 3.5Z" />
      </svg>
    ),
  },
];

export function ProModal({
  motivo = "clases",
  onClose,
}: {
  // "clases": terminó todo lo que tiene. "funcion": tocó algo del plan Pro.
  motivo?: "clases" | "funcion";
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[680px] bg-surface rounded-[28px] shadow-2xl my-4 onb-slide p-6 sm:p-8">
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi-trofeo.png" alt="" className="mx-auto w-[210px] sm:w-[250px] select-none" draggable={false} />
          <h2 className="font-display font-extrabold text-[26px] sm:text-[34px] leading-tight mt-1">
            ¡Sube al siguiente nivel<br className="hidden sm:block" />{" "}
            en <span className="text-accent">Boost Academy!</span>
          </h2>
          <p className="text-sub text-[14px] sm:text-[15px] leading-snug mt-3 max-w-[480px] mx-auto">
            {motivo === "clases"
              ? "Has completado todos los módulos disponibles. Lleva tu aprendizaje más lejos y desbloquea nuevas oportunidades."
              : "Esto es parte del siguiente nivel. Lleva tu aprendizaje más lejos y desbloquea nuevas oportunidades."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5 mt-6">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="flex items-start gap-3 rounded-2xl bg-bg border border-border/70 p-3.5">
              <span className="w-10 h-10 shrink-0 rounded-full bg-accent-soft text-accent grid place-items-center">
                {b.icono}
              </span>
              <div className="min-w-0">
                <div className="font-display font-extrabold text-[13.5px] leading-tight">{b.titulo}</div>
                <p className="text-[12px] text-sub leading-snug mt-1">{b.detalle}</p>
              </div>
            </div>
          ))}
        </div>

        <a href={SUBIR_URL} target="_blank" rel="noreferrer"
          className="mt-6 w-full max-w-[400px] mx-auto flex items-center justify-center gap-2.5 rounded-full bg-accent text-white font-bold text-[16px] py-4 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 7.5 7 11l5-6.5 5 6.5 4-3.5-1.8 10.5a1.5 1.5 0 0 1-1.5 1.25H6.3a1.5 1.5 0 0 1-1.5-1.25L3 7.5Z" />
          </svg>
          Subir de nivel <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
