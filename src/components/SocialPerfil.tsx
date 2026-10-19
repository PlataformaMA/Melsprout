"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleSeguir, type Social } from "@/lib/seguidores-actions";
import { ProSeccionModal } from "@/components/ProSeccionModal";

// Contadores + botón juntos en un solo componente: al seguir, el número de
// seguidores cambia en el momento. Antes el botón era cliente y el contador
// venía del servidor, así que quedaban desincronizados.
export function SocialPerfil({ userId, inicial, bloqueado = false }: {
  userId: string; inicial: Social;
  // Seguir es libre; ESCRIBIR es lo que pide Boost Pro. `bloqueado` solo es
  // true cuando el plan ya existe en la base y esta persona no lo tiene.
  bloqueado?: boolean;
}) {
  const router = useRouter();
  const [s, setS] = useState(inicial);
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();
  const [proAbierto, setProAbierto] = useState(false);

  function alternar() {
    const previo = s;
    setError("");
    // Optimista: seguir manda SOLICITUD (no suma seguidor hasta que la acepten);
    // si ya la seguía, deshacer sí resta en el momento.
    setS({
      ...s,
      loSigo: false,
      solicitada: !previo.loSigo && !previo.solicitada,
      seguidores: previo.seguidores - (previo.loSigo ? 1 : 0),
    });
    startTransition(async () => {
      const r = await toggleSeguir(userId);
      if ("error" in r) { setS(previo); setError(r.error); return; }
      setS((v) => ({ ...v, loSigo: r.loSigo, solicitada: r.solicitada, seguidores: r.seguidores }));
      // Refresca el resto de la página (ranking, amigos, conteos) para que todo
      // quede consistente sin recargar a mano.
      router.refresh();
    });
  }

  return (
    <div className="mt-5 pt-4 border-t border-border">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="text-[14px] whitespace-nowrap">👤 <b>Seguidores</b> <span className="text-sub">{s.seguidores}</span></span>
        <span className="text-[14px] whitespace-nowrap">👤 <b>Siguiendo</b> <span className="text-sub">{s.siguiendo}</span></span>
        <button onClick={alternar} disabled={pendiente}
          title={s.solicitada ? "Toca para cancelar la solicitud" : undefined}
          className={`w-full sm:w-auto sm:ml-auto rounded-full px-5 py-2.5 sm:py-2 text-[13.5px] sm:text-[13px] font-bold transition disabled:opacity-60 ${
            s.loSigo || s.solicitada
              ? "bg-surface border border-border text-sub hover:border-accent/40"
              : "bg-accent text-white hover:brightness-110 shadow-sm shadow-accent/30"
          }`}>
          {s.loSigo ? "Siguiendo" : s.solicitada ? "Solicitud enviada" : "+ Seguir"}
        </button>
        {/* El chat se abre cuando ya la sigues: antes de eso no hay con quién. */}
        {/* El chat se abre con que UNA de las dos siga a la otra: antes el
            botón solo salía si yo la seguía, y con quien me seguía a mí no
            había forma de escribirle aunque la conversación sí funcionara. */}
        {(s.loSigo || s.meSigue) && (
          <Link href={bloqueado ? "#" : `/app/amigos/${userId}`}
            onClick={bloqueado ? (e) => { e.preventDefault(); setProAbierto(true); } : undefined}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-5 py-2.5 sm:py-2 text-[13.5px] sm:text-[13px] font-bold bg-accent text-white hover:brightness-110 shadow-sm shadow-accent/30 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a7.5 7.5 0 0 1-7.5 7.5H8l-4 2.5V12A7.5 7.5 0 0 1 11.5 4.5h2A7.5 7.5 0 0 1 21 12Z" />
            </svg>
            Enviar mensaje {bloqueado && <span className="text-[10px] font-extrabold bg-white/25 rounded-full px-1.5 py-0.5">PRO</span>}
          </Link>
        )}
      </div>
      {error && <p className="text-[12px] text-pink mt-2">{error}</p>}
      {proAbierto && <ProSeccionModal onClose={() => setProAbierto(false)} />}
    </div>
  );
}
