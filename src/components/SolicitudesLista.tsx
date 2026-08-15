"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { responderSolicitud, type Solicitud } from "@/lib/seguidores-actions";

// Solicitudes de seguimiento que esperan tu respuesta. Al aceptar, esa persona
// pasa a contar como seguidora y quedan como amigas (se abre el chat).
export function SolicitudesLista({ inicial }: { inicial: Solicitud[] }) {
  const router = useRouter();
  const [lista, setLista] = useState(inicial);
  const [error, setError] = useState("");
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (lista.length === 0) return null;

  function responder(id: string, aceptar: boolean) {
    const previa = lista;
    setError("");
    setOcupada(id);
    setLista((v) => v.filter((s) => s.id !== id)); // se va de la lista al instante
    startTransition(async () => {
      const r = await responderSolicitud(id, aceptar);
      setOcupada(null);
      if ("error" in r) { setLista(previa); setError(r.error); return; }
      router.refresh(); // actualiza amigos, seguidores y la campana
    });
  }

  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-extrabold text-lg">Solicitudes</h2>
        <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-extrabold grid place-items-center">
          {lista.length}
        </span>
      </div>

      <div className="bg-surface border border-border rounded-3xl shadow-sm divide-y divide-border overflow-hidden">
        {lista.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-5 py-4">
            {s.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.avatar} alt={s.nombre} className="w-11 h-11 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-11 h-11 rounded-full bg-accent/15 text-accent grid place-items-center font-bold shrink-0">
                {s.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14.5px] truncate">{s.nombre}</p>
              <p className="text-[12.5px] text-hint">Quiere seguirte</p>
            </div>
            <button onClick={() => responder(s.id, true)} disabled={ocupada === s.id}
              className="shrink-0 bg-accent text-white rounded-full px-4 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-60 transition">
              Aceptar
            </button>
            <button onClick={() => responder(s.id, false)} disabled={ocupada === s.id}
              className="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold text-sub hover:bg-bg disabled:opacity-60 transition">
              Rechazar
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-[12px] text-pink mt-2">{error}</p>}
    </section>
  );
}
