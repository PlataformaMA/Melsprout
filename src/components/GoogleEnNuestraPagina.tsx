"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Botón oficial de Google dibujado DENTRO de melsprout.boostacademy.io.
//
// Por qué existe: con el login normal de Supabase, el navegador se va a
// sojuzsyumgfeivogesnh.supabase.co y Google le enseña esa dirección a la
// alumna ("ir a sojuz...supabase.co"), que se ve como un enlace sospechoso.
// Aquí la ventana de Google se abre encima de nuestra página, así que lo único
// que aparece es melsprout.boostacademy.io. El token que devuelve Google se le
// entrega a Supabase con signInWithIdToken y la sesión queda igual que siempre.
//
// Si no hay NEXT_PUBLIC_GOOGLE_CLIENT_ID configurado, este componente no se usa
// (OAuthButtons deja el botón de antes), así que nunca se queda sin login.

type CredentialResponse = { credential?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const SCRIPT = "https://accounts.google.com/gsi/client";

// Google recibe el nonce ya cifrado y Supabase el original: así nadie puede
// reutilizar un token de Google emitido para otro sitio.
async function nonces(): Promise<{ crudo: string; cifrado: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const crudo = btoa(String.fromCharCode(...bytes));
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(crudo));
  const cifrado = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { crudo, cifrado };
}

export function GoogleEnNuestraPagina({ clientId, siguiente = "/app" }: { clientId: string; siguiente?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function arrancar() {
      const { crudo, cifrado } = await nonces();

      await new Promise<void>((listo, falla) => {
        if (window.google?.accounts?.id) return listo();
        const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
        if (existente) {
          existente.addEventListener("load", () => listo());
          existente.addEventListener("error", () => falla(new Error("script")));
          return;
        }
        const s = document.createElement("script");
        s.src = SCRIPT;
        s.async = true;
        s.onload = () => listo();
        s.onerror = () => falla(new Error("script"));
        document.head.appendChild(s);
      });

      if (cancelado || !caja.current || !window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: cifrado,
        use_fedcm_for_prompt: true,
        callback: async (respuesta: CredentialResponse) => {
          if (!respuesta.credential) return;
          setEntrando(true);
          const supabase = createClient();
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: respuesta.credential,
            nonce: crudo,
          });
          if (error) {
            setEntrando(false);
            setError("No se pudo entrar con Google. Intenta con tu correo y contraseña.");
            return;
          }
          router.push(siguiente);
          router.refresh();
        },
      });

      const dibujar = caja.current;
      window.google.accounts.id.renderButton(dibujar, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        locale: "es",
        // Google solo acepta de 200 a 400 px. Se le pide lo más cercano al
        // ancho real y el CSS de abajo estira su marco al 100% de la caja, para
        // que quede exactamente igual de ancho que el botón de Facebook.
        width: Math.min(Math.max(dibujar.offsetWidth || 320, 200), 400),
      });

      // Google dibuja su botón dentro de un marco con ancho fijo. Se estira al
      // 100% para que quede igual de ancho que el botón de Facebook; se intenta
      // varias veces porque el marco aparece un instante después.
      for (let i = 0; i < 10 && !cancelado; i++) {
        const marco = dibujar.querySelector("iframe");
        if (marco) {
          marco.style.width = "100%";
          marco.style.maxWidth = "100%";
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    arrancar().catch(() => {
      if (!cancelado) setError("No se pudo cargar el botón de Google. Usa tu correo y contraseña.");
    });

    return () => {
      cancelado = true;
    };
  }, [clientId, router, siguiente]);

  return (
    <div>
      <div ref={caja} className="flex justify-center min-h-[44px] [color-scheme:light]" />
      {entrando && <p className="text-[12px] text-sub mt-2 text-center">Entrando…</p>}
      {error && <p className="text-[12px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-2">{error}</p>}
    </div>
  );
}
