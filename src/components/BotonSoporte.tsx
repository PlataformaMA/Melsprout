// Botón flotante de soporte: abre WhatsApp con el equipo (vía n8n, que arma
// el mensaje). Va en todas las pantallas de la app, en escritorio y móvil.
const SOPORTE_URL = "https://boostacademy-n8n.n6e5xe.easypanel.host/webhook/fbc26af3-56ad-4a3f-9422-cfbf586f9ec3";

export function BotonSoporte() {
  return (
    <a
      href={SOPORTE_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Soporte por WhatsApp"
      title="¿Necesitas ayuda? Escríbenos por WhatsApp"
      className="fixed z-40 right-4 sm:right-6 flex items-center gap-2
                 bg-[#25D366] text-white rounded-full shadow-lg shadow-black/20
                 h-12 px-3 sm:pl-3.5 sm:pr-4 hover:brightness-105 active:scale-95 transition"
      // En iPhone (PWA) sube lo que mide la barra de inicio.
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 0 16.4c-1.4 0-2.8-.4-4-1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5 0 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4l-.5-.3-1.8-.9c-.3-.1-.5-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.4-.4-.6-.4h-.5z" />
      </svg>
      <span className="hidden sm:inline text-[14px] font-bold">Soporte</span>
    </a>
  );
}
