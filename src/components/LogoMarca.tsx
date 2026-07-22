// Logo de marca: destello ✦ + "MELSPROUT" + "by Boost Academy" (como el mockup).
export function LogoMarca({ className = "", chico = false }: { className?: string; chico?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sparkle size={chico ? 24 : 30} />
      <div className="leading-none">
        <div className={`font-display font-extrabold tracking-wide ${chico ? "text-[15px]" : "text-lg"}`}>MELSPROUT</div>
        <div className="text-[10px] text-sub mt-0.5">by Boost Academy</div>
      </div>
    </div>
  );
}

function Sparkle({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2c.6 4.4 1.9 6.6 5.5 7.4C13.9 10.2 12.6 12.4 12 16.8c-.6-4.4-1.9-6.6-5.5-7.4C10.1 8.6 11.4 6.4 12 2Z"
        fill="#7C3AED" />
      <path d="M18.5 14c.3 2 .9 3 2.5 3.4-1.6.4-2.2 1.4-2.5 3.4-.3-2-.9-3-2.5-3.4 1.6-.4 2.2-1.4 2.5-3.4Z"
        fill="#A78BFA" />
    </svg>
  );
}
