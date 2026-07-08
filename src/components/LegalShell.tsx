import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({
  titulo,
  fecha,
  children,
}: {
  titulo: string;
  fecha: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-display font-extrabold text-white text-sm">M</div>
            <span className="font-display font-extrabold">Mel<span className="text-accent">sprout</span></span>
          </Link>
          <div className="flex items-center gap-4 text-[13px] font-medium">
            <Link href="/terminos" className="text-sub hover:text-text">Términos</Link>
            <Link href="/privacidad" className="text-sub hover:text-text">Privacidad</Link>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-extrabold">{titulo}</h1>
        <p className="text-sub text-sm mt-2">{fecha}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/" className="text-sm text-accent font-medium">← Volver a Melsprout</Link>
        </div>
      </article>
    </main>
  );
}

export function EnCorto({ children }: { children: ReactNode }) {
  return (
    <div className="bg-accent-soft border-l-4 border-accent rounded-r-xl px-4 py-3 my-3 text-[13.5px] text-[#4C1D95] leading-relaxed">
      <b>En corto:</b> {children}
    </div>
  );
}

export function Sec({ n, titulo, children }: { n: string; titulo: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-extrabold text-text">
        {n}. {titulo}
      </h2>
      <div className="mt-2 text-[14px] text-sub leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export function Lista({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5">{children}</ul>;
}
