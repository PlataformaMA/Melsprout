"use client";

// "Desbloquea esta sección con Pro".
//
// Es el candado de lo social: seguir a alguien, ver la actividad de tus amigos
// e invitar. Hermano de ProVivoModal (clases en vivo) y ProModal (fin de la
// ruta): mismo plan, distinto momento.
//
// DESTINO: hoy el botón abre el WhatsApp del equipo. El día que haya página de
// pago se cambian las tres constantes.
const PRO_URL = "https://boostacademy-n8n.n6e5xe.easypanel.host/webhook/fbc26af3-56ad-4a3f-9422-cfbf586f9ec3";

const VENTAJAS: { titulo: string; detalle: string; icono: React.ReactNode }[] = [
  {
    titulo: "Conecta con otros estudiantes",
    detalle: "Ve su actividad y progreso.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="9" cy="7" r="3.2" />
        <path d="M22 20v-1.5a4 4 0 0 0-3-3.8" /><path d="M16.5 4.2a3.2 3.2 0 0 1 0 6" />
      </svg>
    ),
  },
  {
    titulo: "Sigue y consigue seguidores",
    detalle: "Forma tu comunidad.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="8.5" cy="7" r="3.2" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
  },
  {
    titulo: "Invita a tus amigos",
    detalle: "Gana recompensas juntos.",
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="11" rx="2" /><path d="M3 13h18M12 9v11" />
        <path d="M12 9S10.5 4.5 8 4.5a2.2 2.2 0 0 0 0 4.5h4Zm0 0s1.5-4.5 4-4.5a2.2 2.2 0 0 1 0 4.5h-4Z" />
      </svg>
    ),
  },
];

export function ProSeccionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[400px] bg-surface rounded-[28px] shadow-2xl my-4 onb-slide p-6 sm:p-7">
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi-pro.png" alt="" className="mx-auto w-[190px] select-none" draggable={false} />
          <h2 className="font-display font-extrabold text-[23px] sm:text-[26px] leading-tight mt-1">
            Desbloquea esta sección<br /><span className="text-accent">con Pro</span>
          </h2>
          <p className="text-sub text-[13.5px] leading-snug mt-2.5">
            Con Pro puedes ver la actividad de tus amigos, seguir usuarios,
            invitar a otros y mucho más.
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-accent-soft/40 p-3.5 space-y-3.5">
          {VENTAJAS.map((v) => (
            <div key={v.titulo} className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 rounded-full bg-surface text-accent grid place-items-center">
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
          Obtener Pro
        </a>
        <button type="button" onClick={onClose}
          className="w-full mt-2.5 text-[12.5px] font-bold text-hint underline underline-offset-2 py-1.5 hover:text-sub transition">
          Quizás más tarde
        </button>
      </div>
    </div>
  );
}
