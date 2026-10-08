"use client";

// "Esta clase en vivo está disponible con Pro".
//
// Sale al tocar una clase en vivo sin tener el plan. No esconde la clase: la
// deja a la vista con su candado, que es lo que invita a dar el paso.
//
// DESTINO: igual que ProModal, hoy el botón abre el WhatsApp del equipo. El día
// que haya página de pago se cambia esta constante (y la de ProModal).
const PRO_URL = "https://boostacademy-n8n.n6e5xe.easypanel.host/webhook/fbc26af3-56ad-4a3f-9422-cfbf586f9ec3";

const VENTAJAS: { titulo: string; detalle: string; icono: React.ReactNode }[] = [
  {
    titulo: "Accede a todas las clases en vivo",
    detalle: "Aprende con referentes de la industria.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="6" width="13" height="12" rx="3" /><path d="m15.5 11 6-3.5v9l-6-3.5z" />
      </svg>
    ),
  },
  {
    titulo: "Revisa las grabaciones",
    detalle: "Todas las clases disponibles 24/7.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="m10 8.5 6 3.5-6 3.5z" />
      </svg>
    ),
  },
  {
    titulo: "Contenido y beneficios exclusivos",
    detalle: "Recursos, plantillas y más.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9L3.5 9.7l5.9-.8L12 3.5Z" />
      </svg>
    ),
  },
];

export function ProVivoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-surface rounded-[28px] shadow-2xl my-4 onb-slide p-6 sm:p-7">
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi-pro.png" alt="" className="mx-auto w-[210px] select-none" draggable={false} />
          <h2 className="font-display font-extrabold text-[23px] sm:text-[26px] leading-tight mt-1">
            Esta clase en vivo<br />está <span className="text-accent">disponible con Pro</span>
          </h2>
          <p className="text-sub text-[13.5px] leading-snug mt-2.5">
            Con Boost Pro puedes acceder a todas las clases en vivo con referentes
            de la industria, además de grabaciones, recursos exclusivos y mucho más.
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-bg border border-border/70 p-3.5 space-y-3.5">
          {VENTAJAS.map((v) => (
            <div key={v.titulo} className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-accent-soft text-accent grid place-items-center">
                {v.icono}
              </span>
              <div className="min-w-0">
                <div className="font-display font-extrabold text-[13.5px] leading-tight">{v.titulo}</div>
                <p className="text-[12px] text-sub leading-snug mt-0.5">{v.detalle}</p>
              </div>
            </div>
          ))}
        </div>

        <a href={PRO_URL} target="_blank" rel="noreferrer"
          className="mt-5 w-full flex items-center justify-center gap-2.5 rounded-full bg-accent text-white font-bold text-[15px] py-3.5 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 7.5 7 11l5-6.5 5 6.5 4-3.5-1.8 10.5a1.5 1.5 0 0 1-1.5 1.25H6.3a1.5 1.5 0 0 1-1.5-1.25L3 7.5Z" />
          </svg>
          Obtener Boost Pro
        </a>
        <button type="button" onClick={onClose}
          className="w-full mt-2.5 text-[12.5px] font-bold text-hint underline underline-offset-2 py-1.5 hover:text-sub transition">
          Quizás más tarde
        </button>
      </div>
    </div>
  );
}
