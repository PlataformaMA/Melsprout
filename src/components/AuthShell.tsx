import Link from "next/link";
import type { ReactNode } from "react";
import { Octi } from "./Octi";
import { LogoMarca } from "./LogoMarca";

// Marco visual de marca para las pantallas de login / registro / recuperar.
export function AuthShell({
  titulo,
  subtitulo,
  children,
  pie,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <main className="min-h-screen flex">
      {/* Panel de marca (solo en pantallas grandes) */}
      <aside className="hidden lg:flex flex-col justify-between w-[46%] p-12 text-white relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,#1A1A2E 0%,#3C1A6B 58%,#7C3AED 130%)",
          }}
        />
        <Link href="/" className="relative z-10 flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 rounded-[10px] bg-white/15 grid place-items-center font-display font-extrabold text-lg">
            M
          </div>
          <span className="font-display font-extrabold text-lg">
            Mel<span className="text-[#C4B5FD]">sprout</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-sm">
          <Octi size={190} />
          <h1 className="mt-6 font-display text-[30px] font-extrabold leading-[1.15]">
            Conviértete en creador de contenido, paso a paso.
          </h1>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {["🎯 Un solo camino", "🔥 Racha diaria", "🏆 Diploma verificable"].map(
              (t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm"
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          Melsprout by Boost Academy · Datos protegidos y cifrados
        </p>
      </aside>

      {/* Panel del formulario */}
      <section className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          {/* Logo de marca (centrado en celular, como el mockup) */}
          <Link href="/" className="lg:hidden flex justify-center mb-8">
            <LogoMarca />
          </Link>

          {titulo && (
            <h2 className="font-display text-2xl font-extrabold text-text text-center lg:text-left">
              {titulo}
            </h2>
          )}
          {subtitulo && <p className="text-sub text-sm mt-1.5 text-center lg:text-left">{subtitulo}</p>}

          <div className={titulo ? "mt-7" : ""}>{children}</div>

          {pie && <div className="mt-6">{pie}</div>}
        </div>
      </section>
    </main>
  );
}
