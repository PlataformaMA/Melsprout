"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MarcaShell } from "@/components/MarcaShell";
import { guardarCampania } from "@/lib/marca-campanias";
import { moverPostulacion } from "@/lib/marca-creadores";
import type { MiMarca } from "@/lib/marca-cuenta";
import type { CampaniaMarca } from "@/lib/marca-campanias";
import type { Postulacion } from "@/lib/marca-creadores";

// El detalle de una campaña, con sus pestañas.

const ESTADOS: Record<string, { txt: string; clase: string }> = {
  borrador: { txt: "Borrador", clase: "bg-bg text-hint border border-border" },
  pendiente: { txt: "En revisión", clase: "bg-amber-100 text-amber-700" },
  aprobada: { txt: "Activa", clase: "bg-green/10 text-green" },
  rechazada: { txt: "Necesita cambios", clase: "bg-pink-soft text-pink" },
  cerrada: { txt: "Cerrada", clase: "bg-bg text-hint border border-border" },
};

export function MarcaCampaniaDetalle({
  marca, campania, postulaciones, sitio,
}: {
  marca: MiMarca; campania: CampaniaMarca; postulaciones: Postulacion[]; sitio: string;
}) {
  const [tab, setTab] = useState<"info" | "creadores" | "colaboraciones" | "envios">("info");
  const [c, setC] = useState(campania);
  const [lista, setLista] = useState(postulaciones);
  const e = ESTADOS[c.estado] ?? ESTADOS.borrador;
  const enlace = `${sitio}/app/marketplace?campania=${c.id}`;

  return (
    <MarcaShell marca={marca} activo="campanias">
      <Link href="/app/marca/campanias" className="text-[13.5px] font-bold text-accent">← Volver</Link>

      <h1 className="font-display text-2xl font-extrabold mt-3">{c.titulo}</h1>
      <p className="text-[12.5px] text-hint mt-0.5">
        {c.publicadaAt ? `Publicado ${fecha(c.publicadaAt)}` : "Todavía sin publicar"}
      </p>

      <div className="flex gap-6 border-b border-border mt-4 mb-5 overflow-x-auto">
        {([["info", "Información"], ["creadores", "Creadores"],
           ["colaboraciones", "Colaboraciones"], ["envios", "Envíos"]] as const).map(([k, txt]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`pb-2.5 text-[14.5px] font-bold transition -mb-px border-b-2 whitespace-nowrap ${
              tab === k ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
            {txt}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          <div className="min-w-0 space-y-4">
            <Caja>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold">Estatus:</span>
                  <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 ${e.clase}`}>{e.txt}</span>
                </div>
                {c.estado === "borrador" || c.estado === "rechazada" ? (
                  <Link href={`/app/marca/campanias/${c.id}/editar`}
                    className="text-[12.5px] font-bold text-accent">Editar ✎</Link>
                ) : null}
              </div>
              {c.notaEquipo && c.estado === "rechazada" && (
                <p className="text-[12.5px] text-pink bg-pink-soft rounded-xl px-3 py-2.5 mt-3 leading-snug">
                  <b>El equipo pide estos cambios:</b> {c.notaEquipo}
                </p>
              )}
              {c.descripcion && (
                <p className="text-[13.5px] leading-relaxed mt-3 whitespace-pre-wrap">{c.descripcion}</p>
              )}
              {c.imagenes.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {c.imagenes.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={`${src}-${i}`} src={src} alt=""
                      className="w-24 h-24 rounded-xl object-cover border border-border" />
                  ))}
                </div>
              )}
            </Caja>

            <Caja>
              <h3 className="font-display font-extrabold text-[14px] mb-3">Perfil del creador objetivo</h3>
              <div className="flex flex-wrap gap-x-7 gap-y-3">
                <Dato k="Nicho" v={c.nicho ?? "Todos"} />
                <Dato k="Género" v={c.genero ?? "Todos"} />
                <Dato k="Rango de edad" v={edad(c)} />
                <Dato k="Cantidad de seguidores" v={c.seguidoresMin ? `+${corto(c.seguidoresMin)}` : "Sin mínimo"} />
              </div>
              {c.ubicaciones.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11.5px] text-hint">Ubicación de los creadores</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {c.ubicaciones.map((u) => (
                      <span key={u} className="text-[11.5px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-1">{u}</span>
                    ))}
                  </div>
                </div>
              )}
            </Caja>

            {c.preguntas.length > 0 && (
              <Caja>
                <h3 className="font-display font-extrabold text-[14px] mb-2.5">Preguntas de selección</h3>
                <ol className="space-y-2">
                  {c.preguntas.map((p, i) => (
                    <li key={p.id} className="flex items-start gap-3 text-[13px]">
                      <span className="text-hint shrink-0">{i + 1}.</span>
                      <span className="flex-1 min-w-0">{p.texto}</span>
                      <span className="shrink-0 text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2 py-0.5">
                        {p.tipo === "corto" ? "Respuesta corta" : p.tipo === "largo" ? "Respuesta larga" : "Enlace"}
                      </span>
                    </li>
                  ))}
                </ol>
              </Caja>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <Caja>
              <h3 className="font-display font-extrabold text-[14px] mb-3">Rendimiento de la campaña</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Num n={lista.length} t="Creadores postulados" />
                <Num n={lista.filter((p) => p.etapa === "seleccionada").length} t="En proceso" />
                <Num n={0} t="Contenido entregado" />
              </div>
            </Caja>

            <Caja>
              <h3 className="font-display font-extrabold text-[14px]">Enlace público de la campaña</h3>
              <p className="text-[11.5px] text-sub leading-snug mt-1">
                Puedes compartir este enlace en tus redes sociales para que los creadores se postulen.
              </p>
              <button onClick={() => navigator.clipboard?.writeText(enlace)}
                className="w-full mt-2.5 flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2.5 text-[12px] text-left hover:border-accent/40 transition">
                <span className="flex-1 min-w-0 truncate">{enlace}</span>
                <span className="shrink-0 text-hint">⧉</span>
              </button>
            </Caja>

            <Caja>
              <h3 className="font-display font-extrabold text-[14px] mb-3">Estado y visibilidad</h3>
              <Interruptor on={c.enMarketplace}
                set={(v) => { setC({ ...c, enMarketplace: v }); guardarCampania(c.id, { enMarketplace: v }); }}
                titulo="Mostrar en el marketplace"
                sub="Los creadores podrán ver y postularse." />
              <div className="h-3" />
              <Interruptor on={c.compartirConLista}
                set={(v) => { setC({ ...c, compartirConLista: v }); guardarCampania(c.id, { compartirConLista: v }); }}
                titulo="Compartir con todos los creadores de mi lista"
                sub="Se enviará la campaña a los creadores guardados." />
            </Caja>
          </aside>
        </div>
      )}

      {tab === "creadores" && (
        <Creadores lista={lista} onCambio={setLista} />
      )}

      {tab === "colaboraciones" && (
        <Pendiente
          titulo="Colaboraciones"
          texto="Aquí va el seguimiento de guion, grabación y entrega final de cada creadora, con su calificación y sus pagos. Es la siguiente etapa del portal."
        />
      )}

      {tab === "envios" && (
        <Pendiente
          titulo="Envíos"
          texto="Aquí van las direcciones, la paquetería, el número de guía y el estatus de entrega de los productos. Es la siguiente etapa del portal."
        />
      )}
    </MarcaShell>
  );
}

// ————— Pestaña de creadores —————
function Creadores({ lista, onCambio }: { lista: Postulacion[]; onCambio: (l: Postulacion[]) => void }) {
  const [sub, setSub] = useState<"postulaciones" | "seleccionados">("postulaciones");
  const [busca, setBusca] = useState("");
  const [viendo, setViendo] = useState<Postulacion | null>(null);
  const [, startTransition] = useTransition();

  const q = busca.trim().toLowerCase();
  const filtrada = lista.filter((p) => {
    if (q && !p.creador.nombre.toLowerCase().includes(q)) return false;
    return sub === "seleccionados" ? p.etapa === "seleccionada" : p.etapa === "postulada";
  });

  function mover(p: Postulacion, etapa: "seleccionada" | "descartada") {
    onCambio(lista.map((x) => (x.id === p.id ? { ...x, etapa } : x)));
    startTransition(async () => { await moverPostulacion(p.id, etapa); });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([["postulaciones", "Postulaciones"], ["seleccionados", "Seleccionados"]] as const).map(([k, txt]) => (
          <button key={k} onClick={() => setSub(k)}
            className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition ${
              sub === k ? "bg-accent-soft text-accent" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
            {txt}
          </button>
        ))}
        <label className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2 ml-auto min-w-[200px]">
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nombre, usuario o nicho…"
            className="flex-1 min-w-0 bg-transparent text-[13px] outline-none" />
        </label>
      </div>

      {filtrada.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
          <p className="text-[13.5px] text-sub">
            {sub === "seleccionados"
              ? "Todavía no has seleccionado a nadie."
              : "Todavía nadie se ha postulado a esta campaña."}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11.5px] text-hint border-b border-border">
                <tr>
                  <th className="font-semibold px-4 py-2.5">Creador</th>
                  <th className="font-semibold px-3 py-2.5">Seguidores</th>
                  <th className="font-semibold px-3 py-2.5">Nicho</th>
                  <th className="font-semibold px-3 py-2.5">Ubicación</th>
                  <th className="font-semibold px-3 py-2.5">Postulación</th>
                  <th className="font-semibold px-3 py-2.5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrada.map((p) => (
                  <tr key={p.id} className="hover:bg-bg transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {p.creador.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.creador.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center text-[10px] font-bold shrink-0">
                            {p.creador.nombre.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[12.5px] truncate">{p.creador.nombre}</div>
                          {p.creador.usuario && (
                            <div className="text-[11px] text-hint truncate">@{p.creador.usuario}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12.5px] font-bold">{corto(p.creador.seguidores)}</td>
                    <td className="px-3 py-3">
                      {p.creador.nichos[0] && (
                        <span className="text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2 py-0.5">
                          {p.creador.nichos[0]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-sub whitespace-nowrap">
                      {[p.creador.ciudad, p.creador.pais].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-sub whitespace-nowrap">{fecha(p.fecha)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setViendo(p)}
                          className="text-[11.5px] font-bold text-accent border border-border rounded-lg px-2.5 py-1.5 hover:border-accent/40 transition whitespace-nowrap">
                          Ver respuestas
                        </button>
                        <Link href={`/app/marca/creadores/${p.creador.id}`}
                          className="text-[11.5px] font-bold text-accent border border-border rounded-lg px-2.5 py-1.5 hover:border-accent/40 transition whitespace-nowrap">
                          Ver perfil
                        </Link>
                        {p.etapa === "postulada" ? (
                          <button onClick={() => mover(p, "seleccionada")}
                            className="text-[11.5px] font-bold text-white bg-green rounded-lg px-2.5 py-1.5 whitespace-nowrap">
                            Seleccionar
                          </button>
                        ) : (
                          <button onClick={() => mover(p, "descartada")}
                            className="text-[11.5px] font-bold text-sub border border-border rounded-lg px-2.5 py-1.5 whitespace-nowrap">
                            Quitar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viendo && <ModalRespuestas p={viendo} onCerrar={() => setViendo(null)} />}
    </div>
  );
}

function ModalRespuestas({ p, onCerrar }: { p: Postulacion; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[460px] bg-surface rounded-3xl shadow-2xl my-4 p-6">
        <button type="button" onClick={onCerrar} aria-label="Cerrar"
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-full text-hint hover:bg-bg transition">✕</button>
        <h2 className="font-display font-extrabold text-[18px] pr-8">Respuestas</h2>

        {p.mensaje && (
          <div className="mt-4">
            <div className="text-[13px] font-bold">¿Por qué tú?</div>
            <p className="text-[13px] text-sub leading-relaxed bg-accent-soft/40 rounded-xl px-3.5 py-3 mt-1.5 whitespace-pre-wrap">
              {p.mensaje}
            </p>
          </div>
        )}

        {p.respuestas.map((r, i) => (
          <div key={`${r.pregunta}-${i}`} className="mt-4">
            <div className="text-[13px] font-bold">{i + 1}. {r.pregunta}</div>
            <p className="text-[13px] text-sub leading-relaxed bg-accent-soft/40 rounded-xl px-3.5 py-3 mt-1.5 whitespace-pre-wrap">
              {r.respuesta}
            </p>
          </div>
        ))}

        {p.enlace && (
          <a href={p.enlace} target="_blank" rel="noreferrer"
            className="inline-block text-[12.5px] font-bold text-accent mt-4 break-all">{p.enlace} →</a>
        )}

        {!p.mensaje && p.respuestas.length === 0 && (
          <p className="text-[13px] text-sub mt-4">Esta persona se postuló sin dejar respuestas.</p>
        )}
      </div>
    </div>
  );
}

// ————— Piezas —————
function Caja({ children }: { children: React.ReactNode }) {
  return <section className="bg-surface border border-border rounded-2xl p-4 shadow-sm">{children}</section>;
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11.5px] text-hint">{k}</div>
      <div className="text-[12.5px] font-bold mt-0.5">{v}</div>
    </div>
  );
}

function Num({ n, t }: { n: number; t: string }) {
  return (
    <div>
      <div className="font-display font-extrabold text-[20px]">{n}</div>
      <div className="text-[10.5px] text-hint leading-snug">{t}</div>
    </div>
  );
}

function Interruptor({ on, set, titulo, sub }: {
  on: boolean; set: (v: boolean) => void; titulo: string; sub: string;
}) {
  return (
    <button type="button" onClick={() => set(!on)} className="flex items-start gap-2.5 text-left w-full">
      <span className={`w-9 h-5 rounded-full p-0.5 transition shrink-0 mt-0.5 ${on ? "bg-accent" : "bg-border"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-bold">{titulo}</span>
        <span className="block text-[11.5px] text-hint leading-snug">{sub}</span>
      </span>
    </button>
  );
}

function Pendiente({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
      <h3 className="font-display font-extrabold text-[16px]">{titulo}</h3>
      <p className="text-[13.5px] text-sub max-w-md mx-auto leading-snug mt-1.5">{texto}</p>
    </div>
  );
}

function edad(c: CampaniaMarca): string {
  if (c.edadMin && c.edadMax) return `${c.edadMin} - ${c.edadMax} años`;
  if (c.edadMin) return `${c.edadMin}+ años`;
  return "Todos";
}

function corto(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}
