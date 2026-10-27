import Link from "next/link";

// Una sección del panel que todavía no existe. Se dice con todas sus letras en
// vez de enseñar una pantalla vacía que parezca rota o, peor, datos de mentira.
export function MktPendiente({ titulo, pie, falta }: {
  titulo: string;
  pie: string;
  falta: string[];
}) {
  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{titulo}</h1>
      <p className="text-sub text-[14px] mt-1">{pie}</p>

      <div className="bg-surface border border-dashed border-border rounded-3xl p-8 sm:p-10 mt-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
        <h2 className="font-display font-extrabold text-[16px] mt-3">Esta sección todavía no está lista</h2>
        <p className="text-sub text-[13.5px] mt-1.5 max-w-md mx-auto leading-snug">
          Ya está el menú y el candado del equipo. Lo que falta construir aquí:
        </p>
        <ul className="text-[13px] text-sub mt-4 max-w-sm mx-auto space-y-1.5 text-left">
          {falta.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-hint shrink-0">•</span><span>{f}</span>
            </li>
          ))}
        </ul>
        <Link href="/app/admin/marketplace"
          className="inline-block mt-6 bg-accent text-white rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
