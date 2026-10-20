"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listarMarcasAdmin, guardarMarca, borrarMarca,
  listarCampaniasAdmin, guardarCampania, borrarCampania,
  listarAplicaciones, responderAplicacion, opcionesDeFiltro,
} from "@/lib/marketplace";
import type { MarcaAdmin, CampaniaAdmin, Aplicacion } from "@/lib/marketplace";

// Panel del Marketplace: dar de alta marcas y campañas, y revisar quién aplicó.

type Sub = "campanias" | "marcas" | "aplicaciones";

export function MarketplaceAdminTab() {
  const [sub, setSub] = useState<Sub>("campanias");
  const [marcas, setMarcas] = useState<MarcaAdmin[]>([]);
  const [campanias, setCampanias] = useState<CampaniaAdmin[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [opciones, setOpciones] = useState<{ categorias: string[]; plataformas: string[]; tipos: string[] }>(
    { categorias: [], plataformas: [], tipos: [] }
  );
  const [cargando, setCargando] = useState(true);
  const [formMarca, setFormMarca] = useState<Partial<MarcaAdmin> | null>(null);
  const [formCampania, setFormCampania] = useState<Partial<CampaniaAdmin> | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [m, c, a, o] = await Promise.all([
      listarMarcasAdmin(), listarCampaniasAdmin(), listarAplicaciones(), opcionesDeFiltro(),
    ]);
    setMarcas(m); setCampanias(c); setAplicaciones(a); setOpciones(o);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const sinLeer = aplicaciones.filter((a) => a.estado === "enviada").length;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          ["campanias", `Campañas (${campanias.length})`],
          ["marcas", `Marcas (${marcas.length})`],
          ["aplicaciones", `Aplicaciones${sinLeer ? ` · ${sinLeer} sin revisar` : ""}`],
        ] as const).map(([k, txt]) => (
          <button key={k} onClick={() => setSub(k)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
              sub === k ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
            {txt}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-[13.5px] text-sub py-8 text-center">Cargando…</p>
      ) : sub === "marcas" ? (
        <>
          <button onClick={() => setFormMarca({ activa: true })}
            className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13px] font-bold mb-4 hover:brightness-110 transition">
            + Nueva marca
          </button>
          {marcas.length === 0 ? (
            <Vacio texto="Todavía no hay marcas. Da de alta la primera para poder publicar campañas." />
          ) : (
            <div className="space-y-2">
              {marcas.map((m) => (
                <div key={m.id} className={`flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 ${m.activa ? "" : "opacity-60"}`}>
                  {m.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.logoUrl} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <span className="w-11 h-11 rounded-xl bg-accent-soft shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <b className="text-[14px] truncate">{m.nombre}</b>
                      {m.destacada && <Pill texto="Destacada" />}
                      {!m.activa && <Pill texto="Oculta" gris />}
                    </div>
                    <div className="text-[12px] text-hint truncate">
                      {m.categoria ?? "Sin categoría"} · {m.campanias} {m.campanias === 1 ? "campaña" : "campañas"}
                    </div>
                  </div>
                  <button onClick={() => setFormMarca(m)}
                    className="text-[12.5px] font-bold text-accent shrink-0">Editar</button>
                  <button onClick={async () => {
                    if (!confirm(`¿Borrar «${m.nombre}»? Se van también sus ${m.campanias} campañas.`)) return;
                    const r = await borrarMarca(m.id);
                    if ("error" in r) { alert(r.error); return; }
                    cargar();
                  }} className="text-[12.5px] font-bold text-pink shrink-0">Borrar</button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : sub === "campanias" ? (
        <>
          <button
            onClick={() => marcas.length
              ? setFormCampania({ activa: true, etiquetas: [], plataformas: [], nivelMinimo: 0 })
              : alert("Primero da de alta una marca.")}
            className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13px] font-bold mb-4 hover:brightness-110 transition">
            + Nueva campaña
          </button>
          {campanias.length === 0 ? (
            <Vacio texto="Todavía no hay campañas publicadas." />
          ) : (
            <div className="space-y-2">
              {campanias.map((c) => (
                <div key={c.id} className={`flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 ${c.activa ? "" : "opacity-60"}`}>
                  {c.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imagenUrl} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <span className="w-11 h-11 rounded-xl bg-accent-soft shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-[14px] truncate">{c.titulo}</b>
                      {c.popular && <Pill texto="Popular" />}
                      {c.nivelMinimo > 0 && <Pill texto={`Nivel ${c.nivelMinimo}`} gris />}
                      {!c.activa && <Pill texto="Oculta" gris />}
                    </div>
                    <div className="text-[12px] text-hint truncate">
                      {c.marca} · {dinero(c.pagoMin, c.pagoMax)} · {c.aplicantes} {c.aplicantes === 1 ? "aplicante" : "aplicantes"}
                    </div>
                  </div>
                  <button onClick={() => setFormCampania(c)}
                    className="text-[12.5px] font-bold text-accent shrink-0">Editar</button>
                  <button onClick={async () => {
                    if (!confirm(`¿Borrar la campaña «${c.titulo}»?`)) return;
                    const r = await borrarCampania(c.id);
                    if ("error" in r) { alert(r.error); return; }
                    cargar();
                  }} className="text-[12.5px] font-bold text-pink shrink-0">Borrar</button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : aplicaciones.length === 0 ? (
        <Vacio texto="Todavía nadie ha aplicado a una campaña." />
      ) : (
        <div className="space-y-3">
          {aplicaciones.map((a) => <FilaAplicacion key={a.id} a={a} onCambio={cargar} />)}
        </div>
      )}

      {formMarca && (
        <FormMarca marca={formMarca} categorias={opciones.categorias}
          onCerrar={() => setFormMarca(null)}
          onGuardado={() => { setFormMarca(null); cargar(); }} />
      )}
      {formCampania && (
        <FormCampania campania={formCampania} marcas={marcas} opciones={opciones}
          onCerrar={() => setFormCampania(null)}
          onGuardado={() => { setFormCampania(null); cargar(); }} />
      )}
    </div>
  );
}

// ————— Aplicación de una creadora —————
function FilaAplicacion({ a, onCambio }: { a: Aplicacion; onCambio: () => void }) {
  const [nota, setNota] = useState(a.notaEquipo ?? "");
  const [ocupado, setOcupado] = useState(false);

  async function responder(estado: "aceptada" | "rechazada") {
    setOcupado(true);
    const r = await responderAplicacion(a.id, estado, nota);
    setOcupado(false);
    if ("error" in r) { alert(r.error); return; }
    onCambio();
  }

  const estado = a.estado === "aceptada"
    ? { txt: "Aceptada", clase: "bg-green/10 text-green" }
    : a.estado === "rechazada"
      ? { txt: "No seleccionada", clase: "bg-bg text-hint border border-border" }
      : { txt: "Sin revisar", clase: "bg-amber-100 text-amber-700" };

  return (
    <article className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {a.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold shrink-0">
            {a.nombre.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <b className="text-[14px]">{a.nombre}</b>
          <div className="text-[12px] text-hint truncate">
            aplicó a <b className="text-sub">{a.campania}</b> · {fecha(a.fecha)}
          </div>
        </div>
        <span className={`shrink-0 text-[11.5px] font-bold rounded-full px-2.5 py-1 ${estado.clase}`}>
          {estado.txt}
        </span>
      </div>

      {a.mensaje && (
        <p className="text-[13px] text-sub leading-relaxed mt-3 whitespace-pre-wrap bg-bg rounded-xl px-3.5 py-3">
          {a.mensaje}
        </p>
      )}
      {a.enlace && (
        <a href={a.enlace} target="_blank" rel="noreferrer"
          className="inline-block text-[12.5px] font-bold text-accent mt-2 break-all">
          {a.enlace} →
        </a>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <input value={nota} onChange={(e) => setNota(e.target.value)}
          placeholder="Nota para ella (opcional)"
          className="flex-1 min-w-[180px] bg-bg border border-border rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-accent" />
        <button onClick={() => responder("aceptada")} disabled={ocupado}
          className="bg-green text-white rounded-xl px-4 py-2 text-[12.5px] font-bold disabled:opacity-50">
          Aceptar
        </button>
        <button onClick={() => responder("rechazada")} disabled={ocupado}
          className="border border-border text-sub rounded-xl px-4 py-2 text-[12.5px] font-bold disabled:opacity-50">
          No esta vez
        </button>
      </div>
    </article>
  );
}

// ————— Formularios —————
function FormMarca({ marca, categorias, onCerrar, onGuardado }: {
  marca: Partial<MarcaAdmin>; categorias: string[];
  onCerrar: () => void; onGuardado: () => void;
}) {
  const [f, setF] = useState(marca);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function guardar() {
    setOcupado(true);
    const r = await guardarMarca({
      id: f.id, nombre: f.nombre ?? "", lema: f.lema ?? undefined,
      categoria: f.categoria ?? undefined, logoUrl: f.logoUrl ?? undefined,
      destacada: f.destacada, activa: f.activa, calificacion: f.calificacion ?? null,
    });
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
  }

  return (
    <Modal titulo={f.id ? "Editar marca" : "Nueva marca"} onCerrar={onCerrar}>
      <Campo label="Nombre">
        <input value={f.nombre ?? ""} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={input} />
      </Campo>
      <Campo label="Lema" ayuda="La frase corta que va bajo el nombre.">
        <input value={f.lema ?? ""} onChange={(e) => setF({ ...f, lema: e.target.value })}
          placeholder="Aventuras que vale la pena compartir" className={input} />
      </Campo>
      <Campo label="Categoría">
        <select value={f.categoria ?? ""} onChange={(e) => setF({ ...f, categoria: e.target.value })} className={input}>
          <option value="">Sin categoría</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Campo>
      <Campo label="Calificación" ayuda="De 0 a 5, con un decimal. Vacío = sin calificar.">
        <input type="number" min={0} max={5} step={0.1} value={f.calificacion ?? ""}
          onChange={(e) => setF({ ...f, calificacion: e.target.value ? Number(e.target.value) : null })}
          placeholder="4.8" className={input} />
      </Campo>
      <Campo label="Logo (enlace a la imagen)">
        <input value={f.logoUrl ?? ""} onChange={(e) => setF({ ...f, logoUrl: e.target.value })}
          placeholder="https://…" className={input} />
      </Campo>
      <div className="flex gap-4 mt-1">
        <Check txt="Destacada" on={f.destacada === true} set={(v) => setF({ ...f, destacada: v })} />
        <Check txt="Visible" on={f.activa !== false} set={(v) => setF({ ...f, activa: v })} />
      </div>
      <Pie error={error} ocupado={ocupado} onGuardar={guardar} onCerrar={onCerrar} />
    </Modal>
  );
}

function FormCampania({ campania, marcas, opciones, onCerrar, onGuardado }: {
  campania: Partial<CampaniaAdmin>; marcas: MarcaAdmin[];
  opciones: { categorias: string[]; plataformas: string[]; tipos: string[] };
  onCerrar: () => void; onGuardado: () => void;
}) {
  const [f, setF] = useState(campania);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const alternar = (campo: "etiquetas" | "plataformas", v: string) =>
    setF((x) => {
      const lista = (x[campo] as string[]) ?? [];
      return { ...x, [campo]: lista.includes(v) ? lista.filter((y) => y !== v) : [...lista, v] };
    });

  async function guardar() {
    setOcupado(true);
    const r = await guardarCampania({
      id: f.id, marcaId: f.marcaId ?? "", titulo: f.titulo ?? "",
      descripcion: f.descripcion ?? undefined, imagenUrl: f.imagenUrl ?? undefined,
      pagoMin: f.pagoMin ?? null, pagoMax: f.pagoMax ?? null,
      categoria: f.categoria ?? undefined,
      etiquetas: f.etiquetas ?? [], plataformas: f.plataformas ?? [],
      nivelMinimo: f.nivelMinimo ?? 0, popular: f.popular, activa: f.activa,
      cierraAt: f.cierraAt ?? null,
    });
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
  }

  return (
    <Modal titulo={f.id ? "Editar campaña" : "Nueva campaña"} onCerrar={onCerrar}>
      <Campo label="Marca">
        <select value={f.marcaId ?? ""} onChange={(e) => setF({ ...f, marcaId: e.target.value })} className={input}>
          <option value="">Elige una marca</option>
          {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </Campo>
      <Campo label="Título">
        <input value={f.titulo ?? ""} onChange={(e) => setF({ ...f, titulo: e.target.value })}
          placeholder="Lanzamiento Summer Glow Collection" className={input} />
      </Campo>
      <Campo label="Descripción">
        <textarea value={f.descripcion ?? ""} onChange={(e) => setF({ ...f, descripcion: e.target.value })}
          rows={3} placeholder="Qué busca la marca y qué tiene que hacer la creadora."
          className={`${input} resize-none`} />
      </Campo>
      <Campo label="Imagen (enlace)">
        <input value={f.imagenUrl ?? ""} onChange={(e) => setF({ ...f, imagenUrl: e.target.value })}
          placeholder="https://…" className={input} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Pago desde" ayuda="En dólares enteros.">
          <input type="number" min={0} value={f.pagoMin ?? ""}
            onChange={(e) => setF({ ...f, pagoMin: e.target.value ? Number(e.target.value) : null })}
            placeholder="500" className={input} />
        </Campo>
        <Campo label="Pago hasta">
          <input type="number" min={0} value={f.pagoMax ?? ""}
            onChange={(e) => setF({ ...f, pagoMax: e.target.value ? Number(e.target.value) : null })}
            placeholder="1500" className={input} />
        </Campo>
      </div>

      <Campo label="Categoría">
        <select value={f.categoria ?? ""} onChange={(e) => setF({ ...f, categoria: e.target.value })} className={input}>
          <option value="">Sin categoría</option>
          {opciones.categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Campo>

      <Campo label="Plataformas">
        <div className="flex flex-wrap gap-1.5">
          {opciones.plataformas.map((p) => (
            <Tag key={p} txt={p} on={(f.plataformas ?? []).includes(p)} click={() => alternar("plataformas", p)} />
          ))}
        </div>
      </Campo>
      <Campo label="Tipo de campaña">
        <div className="flex flex-wrap gap-1.5">
          {opciones.tipos.map((t) => (
            <Tag key={t} txt={t} on={(f.etiquetas ?? []).includes(t)} click={() => alternar("etiquetas", t)} />
          ))}
        </div>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nivel mínimo" ayuda="0 = abierta para todas.">
          <input type="number" min={0} value={f.nivelMinimo ?? 0}
            onChange={(e) => setF({ ...f, nivelMinimo: Number(e.target.value) || 0 })} className={input} />
        </Campo>
        <Campo label="Cierra el">
          <input type="date" value={(f.cierraAt ?? "").slice(0, 10)}
            onChange={(e) => setF({ ...f, cierraAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className={input} />
        </Campo>
      </div>

      <div className="flex gap-4 mt-1">
        <Check txt="Popular" on={f.popular === true} set={(v) => setF({ ...f, popular: v })} />
        <Check txt="Visible" on={f.activa !== false} set={(v) => setF({ ...f, activa: v })} />
      </div>
      <Pie error={error} ocupado={ocupado} onGuardar={guardar} onCerrar={onCerrar} />
    </Modal>
  );
}

// ————— Piezas —————
const input = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-accent";

function Modal({ titulo, children, onCerrar }: { titulo: string; children: React.ReactNode; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[480px] bg-surface rounded-3xl shadow-2xl my-4 p-6 space-y-3">
        <h2 className="font-display font-extrabold text-[18px]">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, ayuda, children }: { label: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold">{label}</span>
      {ayuda && <span className="block text-[11.5px] text-hint leading-snug mt-0.5">{ayuda}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Tag({ txt, on, click }: { txt: string; on: boolean; click: () => void }) {
  return (
    <button type="button" onClick={click}
      className={`text-[12px] font-semibold rounded-full px-3 py-1.5 border transition ${
        on ? "bg-accent text-white border-accent" : "bg-bg text-sub border-border hover:border-accent/40"}`}>
      {txt}
    </button>
  );
}

function Check({ txt, on, set }: { txt: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)}
        className="w-4 h-4 accent-accent cursor-pointer" />
      {txt}
    </label>
  );
}

function Pie({ error, ocupado, onGuardar, onCerrar }: {
  error: string; ocupado: boolean; onGuardar: () => void; onCerrar: () => void;
}) {
  return (
    <>
      {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2 pt-2">
        <button onClick={onCerrar}
          className="flex-1 border border-border text-sub rounded-xl py-3 text-[14px] font-bold hover:bg-bg transition">
          Cancelar
        </button>
        <button onClick={onGuardar} disabled={ocupado}
          className="flex-1 bg-accent text-white rounded-xl py-3 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-60">
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </>
  );
}

function Pill({ texto, gris }: { texto: string; gris?: boolean }) {
  return (
    <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
      gris ? "bg-bg text-hint border border-border" : "bg-accent-soft text-accent"}`}>
      {texto}
    </span>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
      <p className="text-[13.5px] text-sub max-w-sm mx-auto leading-snug">{texto}</p>
    </div>
  );
}

function dinero(min: number | null, max: number | null): string {
  const s = (n: number) => `$${n.toLocaleString("en-US")}`;
  if (min && max) return `${s(min)} – ${s(max)}`;
  if (max) return `Hasta ${s(max)}`;
  if (min) return `Desde ${s(min)}`;
  return "A convenir";
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
