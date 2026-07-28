"use client";

import { useEffect, useRef } from "react";

// Llave pública de Cloudflare Turnstile. Si no está configurada, el captcha
// queda DESACTIVADO (no se renderiza nada y el registro funciona igual).
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }) => string;
    };
  }
}

// Filtro invisible humano/robot para el registro (Cloudflare Turnstile).
export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    const cont = ref.current;
    const ID = "cf-turnstile-script";

    const render = () => {
      if (window.turnstile && cont && !cont.hasChildNodes()) {
        window.turnstile.render(cont, {
          sitekey: SITE_KEY,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
        });
      }
    };

    if (!document.getElementById(ID)) {
      const s = document.createElement("script");
      s.id = ID;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      render();
    }
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="mt-1" />;
}

// ¿Está activo el captcha? (para saber si exigir el token antes de enviar)
export const CAPTCHA_ACTIVO = !!SITE_KEY;
