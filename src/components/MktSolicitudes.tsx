"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { moverPostulacion } from "@/lib/marca-creadores";
import { fechaCorta } from "@/lib/formato-campanias";
import type { Solicitud, PostulacionPendiente } from "@/lib/mkt-admin";

// Las campañas que las marcas mandaron a revisión. El equipo entra a cada una
// y decide: aprobar (sale al Marketplace) o regresarla con comentarios.
export function MktSolicitudes({ lista, postulaciones }: {
  lista: Solicitud[];
  postulaciones: PostulacionPendiente[];
}) {
  const [sub, setSub] = useState<"campanias" | "creadores">(
    // Si no hay campañas por revisar pero sí postulaciones, se abre donde hay
    // trabajo, en vez de en una pantalla vacía.
    lista.length === 0 && postulaciones.length > 0 ? "creadores" : "campanias",
  );
  const [busca, setBusca] = useState("");
  const [orden, setOrden] = useState<"recientes" | "antiguas">("recientes");

  // Se filtra y ordena aquí: son pocas y así no hay viaje al servidor por letra.
  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtradas = q
      ? lista.filter((s) =>
          s.titulo.toLowerCase().includes(q) || s.marca.toLowerCase().includes(q))
      : lista;
    const copia = [...filtradas];
    copia.sort((a, b) => {
      const x = a.fecha || "", y = b.fecha || "";
      return orden === "recientes" ? y.localeCompare(x) : x.localeCompare(y);
    });
    return copia;
  }, [lista, busca, orden]);

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Solicitudes</h1>
      <p className="text-sub text-[14px] mt-1">
        Lo que está esperando una respuesta del equipo.
      </p>

      <div className="flex gap-2 mt-4 flex-wrap">
        {([["campanias", "Campañas de marcas", lista.length],
           ["creadores", "Postulaciones de creadoras", postulaciones.length]] as const).map(([k, txt, n]) => (
          <button key={k} onClick={() => setSub(k)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
              sub === k ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
            {txt}
            {n > 0 && <span className="ml-1.5 opacity-80">{n}</span>}
          </button>
        ))}
      </div>

      {sub === "creadores"
        ? <Postulaciones lista={postulaciones} />
        : <>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <label className="flex-1 min-w-[220px] flex items-center gap-2 bg-surface border border-border rounded-2xl px-3.5 h-11">
          <span className="text-hint text-[14px]">🔍</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar marca o campaña…"
            className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        </label>
        <label className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-3.5 h-11">
          <span className="text-hint text-[13px]">↕</span>
          <select value={orden} onChange={(e) => setOrden(e.target.value as "recientes" | "antiguas")}
            className="bg-transparent text-[13.5px] font-semibold outline-none cursor-pointer">
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
          </select>
        </label>
      </div>

      <div className="mt-5 space-y-3">
        {visibles.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
            <h2 className="font-display font-extrabold text-[16px] mt-3">
              {lista.length === 0 ? "No hay nada por revisar" : "Nada con esa búsqueda"}
            </h2>
            <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
              {lista.length === 0
                ? "Cuando una marca publique una campaña, te va a aparecer aquí."
                : "Prueba con otro nombre de marca o de campaña."}
            </p>
          </div>
        ) : (
          visibles.map((s) => (
            <article key={s.id}
              className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4 flex-wrap sm:flex-nowrap">
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt="" className="w-16 h-16 rounded-xl object-contain bg-bg p-1.5 shrink-0" />
              ) : (
                <span className="w-16 h-16 rounded-xl bg-accent-soft text-accent grid place-items-center text-[15px] font-extrabold shrink-0">
                  {s.marca.slice(0, 2).toUpperCase()}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="font-display font-extrabold text-[15px] leading-tight">{s.titulo}</h3>
                {s.descripcion && (
                  <p className="text-[13px] text-sub leading-snug mt-1 line-clamp-2">{s.descripcion}</p>
                )}
                <p className="text-[12px] text-hint mt-1">{s.marca}</p>
              </div>

              <div className="font-display font-extrabold text-[15px] shrink-0 sm:text-right sm:w-[130px]">
                {s.compensacion}
              </div>

              <Link href={`/app/admin/marketplace/solicitudes/${s.id}`}
                className="shrink-0 bg-accent-soft text-accent rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:bg-accent hover:text-white transition">
                Revisar
              </Link>
            </article>
          ))
        )}
      </div>
      </>}
    </>
  );
}

// ————— Las creadoras que esperan respuesta —————
function Postulaciones({ lista }: { lista: PostulacionPendiente[] }) {
  const [datos, setDatos] = useState(lista);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decidir(p: PostulacionPendiente, etapa: "seleccionada" | "descartada") {
    setOcupada(p.id);
    setError("");
    const r = await moverPostulacion(p.id, etapa);
    setOcupada(null);
    if ("error" in r) { setError(r.error); return; }
    // Ya tiene respuesta: sale de la bandeja.
    setDatos((d) => d.filter((x) => x.id !== p.id));
  }

  if (datos.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center mt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
        <h2 className="font-display font-extrabold text-[16px] mt-3">No hay postulaciones esperando</h2>
        <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
          Cuando una creadora se postule a una campaña, te aparece aquí para abrirla y decidir.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {error && <p className="text-[13px] text-pink bg-pink-soft rounded-xl px-3.5 py-3">{error}</p>}

      {datos.map((p) => (
        <article key={p.id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3.5 flex-wrap">
            {p.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-14 h-14 rounded-full bg-accent-soft text-accent grid place-items-center text-[14px] font-extrabold shrink-0">
                {p.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-display font-extrabold text-[15px] truncate">{p.nombre}</h3>
              {p.usuario && <p className="text-[12px] text-hint truncate">@{p.usuario}</p>}
              <p className="text-[12.5px] text-sub truncate">
                se postuló a <b>{p.campania}</b> · {p.marca}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-[12.5px] font-bold">{abrev(p.seguidores)} seguidores</div>
              <div className="text-[11.5px] text-hint">{fechaCorta(p.fecha)}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-3.5 flex-wrap">
            <button onClick={() => setAbierta(abierta === p.id ? null : p.id)}
              className="bg-accent-soft text-accent rounded-xl px-3.5 py-2 text-[12.5px] font-bold hover:bg-accent hover:text-white transition">
              {abierta === p.id ? "Ocultar respuestas" : `Ver respuestas${p.respuestas.length ? ` (${p.respuestas.length})` : ""}`}
            </button>
            <Link href={`/app/admin/marketplace/creadores/${p.userId}?volver=/app/admin/marketplace/solicitudes`}
              className="border border-border rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-sub hover:border-accent/40 hover:text-accent transition">
              Ver perfil
            </Link>
            <span className="flex-1" />
            <button onClick={() => decidir(p, "descartada")} disabled={ocupada === p.id}
              className="border border-border rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-sub hover:border-pink/40 hover:text-pink transition disabled:opacity-50">
              No quedó
            </button>
            <button onClick={() => decidir(p, "seleccionada")} disabled={ocupada === p.id}
              className="bg-green text-white rounded-xl px-4 py-2 text-[12.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
              {ocupada === p.id ? "Guardando…" : "Seleccionar"}
            </button>
          </div>

          {abierta === p.id && (
            <div className="mt-3.5 pt-3.5 border-t border-border space-y-3">
              {p.mensaje && (
                <p className="text-[13px] text-sub leading-relaxed bg-bg rounded-xl px-3.5 py-3">{p.mensaje}</p>
              )}
              {p.respuestas.length === 0 && !p.mensaje ? (
                <p className="text-[13px] text-hint">Esta campaña no tenía preguntas.</p>
              ) : (
                p.respuestas.map((r, i) => (
                  <div key={i}>
                    <p className="text-[13px] font-bold">{i + 1}. {r.pregunta}</p>
                    <p className="text-[13px] text-sub leading-relaxed bg-accent-soft/40 rounded-xl px-3.5 py-3 mt-1.5">
                      {r.respuesta}
                    </p>
                  </div>
                ))
              )}
              {p.enlace && (
                <a href={p.enlace} target="_blank" rel="noreferrer"
                  className="inline-block text-[12.5px] font-bold text-accent break-all">{p.enlace} ↗</a>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function abrev(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}
