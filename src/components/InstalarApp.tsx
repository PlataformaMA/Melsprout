"use client";

import { useEffect, useState } from "react";

// Aviso para instalar Melsprout en el celular.
//
// La plataforma ya es instalable, pero nadie lo descubre solo: en Android el
// navegador avisa cuando quiere, y en iPhone no avisa nunca. Este recuadro lo
// propone una vez, de forma discreta, y se acuerda si la persona dice que no.
//
// No se muestra si ya está instalada (ahí la app se abre en "standalone"), ni
// en computadora, ni si ya la cerró antes.

type Instalable = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const GUARDADO = "melsprout.instalar.visto";

function yaInstalada(): boolean {
  if (typeof window === "undefined") return true;
  const navegadorIOS = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navegadorIOS.standalone === true;
}

export function InstalarApp() {
  const [evento, setEvento] = useState<Instalable | null>(null);
  const [visible, setVisible] = useState(false);
  // Se calcula una sola vez, al crear el componente: en el servidor da false y
  // el recuadro no se dibuja hasta que el efecto decide mostrarlo.
  const [iphone] = useState(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  });

  useEffect(() => {
    if (yaInstalada()) return;
    try {
      if (localStorage.getItem(GUARDADO)) return;
    } catch {
      // Navegación privada: no pasa nada, se muestra igual.
    }

    const esMovil = window.matchMedia("(max-width: 820px)").matches;
    if (!esMovil) return;

    // Android/Chrome avisan con este evento; el iPhone nunca lo manda, así que
    // ahí se explican los dos toques a mano.
    const alPoder = (e: Event) => {
      e.preventDefault();
      setEvento(e as Instalable);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", alPoder);

    if (iphone) {
      // En el iPhone no hay evento: se explica a mano, un momento después de
      // entrar, para no tapar la pantalla apenas abre.
      const t = setTimeout(() => setVisible(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", alPoder);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", alPoder);
  }, [iphone]);

  function cerrar() {
    setVisible(false);
    try {
      localStorage.setItem(GUARDADO, "1");
    } catch {}
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    cerrar();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] sm:hidden">
      <div className="bg-surface border border-border rounded-2xl shadow-xl p-3.5 flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icono-192.png" alt="" width={44} height={44} className="rounded-xl shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-[14px] leading-tight">
            Ten Melsprout en tu pantalla de inicio
          </p>
          {iphone ? (
            <p className="text-[12.5px] text-sub mt-1 leading-snug">
              Toca <b>Compartir</b> abajo y luego <b>Agregar a inicio</b>. Se abre como app, sin el navegador.
            </p>
          ) : (
            <p className="text-[12.5px] text-sub mt-1 leading-snug">
              Se abre como app, entra más rápido y no ocupa casi espacio.
            </p>
          )}
          <div className="flex gap-2 mt-2.5">
            {!iphone && (
              <button
                type="button"
                onClick={instalar}
                className="bg-accent text-white font-bold text-[13px] rounded-full px-4 py-2 hover:brightness-110 transition"
              >
                Instalar
              </button>
            )}
            <button
              type="button"
              onClick={cerrar}
              className="text-sub font-bold text-[13px] rounded-full px-3 py-2 hover:bg-bg transition"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
