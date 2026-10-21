"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MarcaShell } from "@/components/MarcaShell";
import { guardarCampania, publicarCampania } from "@/lib/marca-campanias";
import type { MiMarca } from "@/lib/marca-cuenta";
import type { CampaniaMarca, Pregunta } from "@/lib/marca-campanias";

// El formulario de 3 pasos para armar una campaña.
//
// Se guarda al pasar de paso y al tocar "Guardar borrador": si cierra la
// pestaña a medias, lo escrito sigue ahí.

const TIPOS = [
  { id: "intercambio", txt: "Intercambio de producto" },
  { id: "monto", txt: "Compensación económica" },
  { id: "afiliados", txt: "Afiliados" },
];

const GENEROS = ["Todos", "Mujeres", "Hombres", "No binario"];
const EDADES = [
  { txt: "Todos", min: null, max: null },
  { txt: "18 - 24 años", min: 18, max: 24 },
  { txt: "25 - 34 años", min: 25, max: 34 },
  { txt: "35 - 44 años", min: 35, max: 44 },
  { txt: "45+ años", min: 45, max: null },
];

export function MarcaCampaniaEditor({
  marca, campania, nichos, rangos,
}: {
  marca: MiMarca; campania: CampaniaMarca;
  nichos: string[];
  rangos: { valor: number; texto: string }[];
}) {
  const [paso, setPaso] = useState(1);
  const [c, setC] = useState<CampaniaMarca>(campania);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const set = <K extends keyof CampaniaMarca>(k: K, v: CampaniaMarca[K]) =>
    setC((x) => ({ ...x, [k]: v }));

  async function guardar(): Promise<boolean> {
    const r = await guardarCampania(c.id, c);
    if ("error" in r) { setError(r.error); return false; }
    return true;
  }

  function siguiente() {
    setError("");
    startTransition(async () => {
      if (!(await guardar())) return;
      setPaso((p) => Math.min(3, p + 1));
    });
  }

  function guardarBorrador() {
    setError(""); setAviso("");
    startTransition(async () => {
      if (await guardar()) setAviso("Borrador guardado.");
    });
  }

  function publicar() {
    setError("");
    startTransition(async () => {
      if (!(await guardar())) return;
      const r = await publicarCampania(c.id);
      if ("error" in r) { setError(r.error); setConfirmar(false); return; }
      window.location.href = `/app/marca/campanias/${c.id}`;
    });
  }

  const alternarTipo = (id: string) =>
    set("tipos", c.tipos.includes(id) ? c.tipos.filter((t) => t !== id) : [...c.tipos, id]);

  return (
    <MarcaShell marca={marca} activo="campanias">
      <Link href="/app/marca/campanias" className="text-[13.5px] font-bold text-accent">← Volver</Link>

      {/* Los tres pasos */}
      <div className="flex items-start justify-center gap-2 sm:gap-10 mt-4 mb-7">
        {[
          { n: 1, t: "Información general", s: "Detalles básicos de tu campaña" },
          { n: 2, t: "Requisitos y perfil", s: "Criterios de búsqueda" },
          { n: 3, t: "Pago y compensación", s: "Define la colaboración" },
        ].map((p, i) => (
          <div key={p.n} className="flex items-start gap-2 sm:gap-10">
            <div className="text-center w-[110px] sm:w-[150px]">
              <span className={`w-8 h-8 rounded-full grid place-items-center text-[13px] font-extrabold mx-auto ${
                paso >= p.n ? "bg-accent text-white" : "bg-bg border border-border text-hint"}`}>
                {p.n}
              </span>
              <div className={`text-[12.5px] font-bold mt-1.5 leading-tight ${paso >= p.n ? "" : "text-hint"}`}>
                {p.t}
              </div>
              <div className="text-[11px] text-hint leading-snug hidden sm:block">{p.s}</div>
            </div>
            {i < 2 && <span className="hidden sm:block h-px w-10 bg-border mt-4" />}
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        {paso === 1 && (
          <>
            <Titulo t="Información de la campaña" s="Cuéntanos sobre tu campaña para que podamos entender tus necesidades." />
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo label="Nombre de la campaña" obligatorio>
                <input value={c.titulo} maxLength={100} onChange={(e) => set("titulo", e.target.value)}
                  placeholder="Ej. Lanzamiento Colección Verano 2026" className={input} />
              </Campo>
              <Campo label="Tipo de campaña" obligatorio>
                <div className="flex flex-wrap gap-1.5">
                  {TIPOS.map((t) => (
                    <Chip key={t.id} txt={t.txt} on={c.tipos.includes(t.id)} click={() => alternarTipo(t.id)} />
                  ))}
                </div>
              </Campo>
            </div>

            <Campo label="Descripción de la campaña" obligatorio>
              <textarea value={c.descripcion ?? ""} rows={5} maxLength={500}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Describe tu campaña, el contexto, la idea general y cualquier detalle relevante."
                className={`${input} resize-none`} />
              <div className="text-[11px] text-hint text-right mt-1">{(c.descripcion ?? "").length}/500</div>
            </Campo>

            <Campo label="Imágenes de referencia"
              ayuda="Puedes subir imágenes de productos, moodboard, ejemplos de contenido o cualquier referencia visual.">
              <ListaEnlaces valores={c.imagenes} onCambio={(v) => set("imagenes", v)}
                marcador="https://… (enlace a la imagen)" />
            </Campo>

            <Titulo t="Detalles adicionales" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo label="Límite de postulaciones">
                <input type="number" min={1} value={c.limitePostulaciones ?? ""}
                  onChange={(e) => set("limitePostulaciones", e.target.value ? Number(e.target.value) : null)}
                  placeholder="Sin límite" className={input} />
              </Campo>
              <Campo label="Fecha de cierre">
                <input type="date" value={(c.cierraAt ?? "").slice(0, 10)}
                  onChange={(e) => set("cierraAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className={input} />
              </Campo>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <Titulo t="Perfil del creador" s="Define las características de los creadores que pueden postularse a esta campaña." />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Campo label="Nicho" obligatorio>
                <select value={c.nicho ?? ""} onChange={(e) => set("nicho", e.target.value)} className={input}>
                  <option value="">Selecciona nicho</option>
                  {nichos.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Campo>
              <Campo label="Género" obligatorio>
                <select value={c.genero ?? "Todos"} onChange={(e) => set("genero", e.target.value)} className={input}>
                  {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Campo>
              <Campo label="Rango de edad" obligatorio>
                <select
                  value={EDADES.findIndex((e) => e.min === c.edadMin && e.max === c.edadMax)}
                  onChange={(e) => {
                    const r = EDADES[Number(e.target.value)] ?? EDADES[0];
                    set("edadMin", r.min); set("edadMax", r.max);
                  }}
                  className={input}>
                  {EDADES.map((e, i) => <option key={e.txt} value={i}>{e.txt}</option>)}
                </select>
              </Campo>
              <Campo label="Cantidad de seguidores" obligatorio>
                <select value={c.seguidoresMin}
                  onChange={(e) => set("seguidoresMin", Number(e.target.value))} className={input}>
                  {rangos.map((r) => <option key={r.valor} value={r.valor}>{r.texto}</option>)}
                </select>
              </Campo>
            </div>

            <Campo label="Ubicación de los creadores" ayuda="Escribe un país o ciudad y presiona Enter.">
              <ListaEnlaces valores={c.ubicaciones} onCambio={(v) => set("ubicaciones", v)}
                marcador="Ej. México, Monterrey…" />
            </Campo>

            <div className="flex items-start justify-between gap-3 pt-2">
              <Titulo t="Preguntas de selección (opcional)"
                s="¿Quieres hacer preguntas adicionales a los creadores? Agrégalas aquí." />
              <button type="button"
                onClick={() => set("preguntas", [...c.preguntas, {
                  id: `p${Date.now()}`, texto: "", tipo: "corto", obligatoria: true, compartir: false,
                }])}
                className="shrink-0 border border-border rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-sub hover:border-accent/40 transition">
                + Agregar pregunta
              </button>
            </div>

            <div className="space-y-3">
              {c.preguntas.map((p, i) => (
                <PreguntaFila key={p.id} p={p}
                  onCambio={(nueva) => set("preguntas", c.preguntas.map((x, j) => (j === i ? nueva : x)))}
                  onBorrar={() => set("preguntas", c.preguntas.filter((_, j) => j !== i))} />
              ))}
              {c.preguntas.length === 0 && (
                <p className="text-[12.5px] text-hint">Sin preguntas: las creadoras solo mandan su mensaje.</p>
              )}
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <Titulo t="Pago y compensación" s="Define cómo te gustaría compensar a los creadores por su participación en esta campaña." />
            <Campo label="Detalles de la compensación"
              ayuda="Cuéntanos más sobre la compensación: qué incluye, condiciones y cualquier detalle relevante.">
              <textarea value={c.compensacionDetalle ?? ""} rows={4} maxLength={500}
                onChange={(e) => set("compensacionDetalle", e.target.value)}
                placeholder="Escribe aquí los detalles de la compensación…"
                className={`${input} resize-none`} />
            </Campo>

            <Titulo t="Selecciona las opciones de compensación"
              s="Puedes elegir una o varias formas de compensación para esta campaña." />

            <Opcion icono="🎁" titulo="Intercambio de producto"
              sub="Enviarás productos de tu marca a los creadores seleccionados."
              on={!!c.compensacion.intercambio}
              alternar={(v) => set("compensacion", { ...c.compensacion, intercambio: v ? { productos: "" } : undefined })}>
              <Campo label="Productos a enviar" obligatorio ayuda="Describe los productos, cantidades y cualquier detalle relevante.">
                <input value={c.compensacion.intercambio?.productos ?? ""}
                  onChange={(e) => set("compensacion", { ...c.compensacion, intercambio: { productos: e.target.value } })}
                  placeholder="Ej. Kit de skincare, 2 productos, etc." className={input} />
              </Campo>
            </Opcion>

            <Opcion icono="💲" titulo="Monto específico"
              sub="Ofrecerás una compensación económica a los creadores."
              on={!!c.compensacion.monto}
              alternar={(v) => set("compensacion", { ...c.compensacion, monto: v ? { cantidad: 0, moneda: "USD" } : undefined })}>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Campo label="Monto por creador" obligatorio ayuda="Indica el monto fijo que recibirán los creadores seleccionados.">
                  <input type="number" min={0} value={c.compensacion.monto?.cantidad || ""}
                    onChange={(e) => set("compensacion", {
                      ...c.compensacion,
                      monto: { cantidad: Number(e.target.value) || 0, moneda: c.compensacion.monto?.moneda ?? "USD" },
                    })}
                    placeholder="Ej. 500" className={input} />
                </Campo>
                <Campo label="Moneda">
                  <select value={c.compensacion.monto?.moneda ?? "USD"}
                    onChange={(e) => set("compensacion", {
                      ...c.compensacion,
                      monto: { cantidad: c.compensacion.monto?.cantidad ?? 0, moneda: e.target.value },
                    })}
                    className={input}>
                    <option>USD</option><option>MXN</option>
                  </select>
                </Campo>
              </div>
            </Opcion>

            <Opcion icono="🔗" titulo="Afiliados"
              sub="Los creadores recibirán una comisión por ventas generadas a través de su enlace de afiliado."
              on={!!c.compensacion.afiliados}
              alternar={(v) => set("compensacion", { ...c.compensacion, afiliados: v ? { porcentaje: 0, duracion: "" } : undefined })}>
              <div className="grid sm:grid-cols-2 gap-3">
                <Campo label="Porcentaje de comisión" obligatorio>
                  <input type="number" min={0} max={100} value={c.compensacion.afiliados?.porcentaje || ""}
                    onChange={(e) => set("compensacion", {
                      ...c.compensacion,
                      afiliados: { porcentaje: Number(e.target.value) || 0, duracion: c.compensacion.afiliados?.duracion ?? "" },
                    })}
                    placeholder="Ej. 10" className={input} />
                </Campo>
                <Campo label="Duración">
                  <select value={c.compensacion.afiliados?.duracion ?? ""}
                    onChange={(e) => set("compensacion", {
                      ...c.compensacion,
                      afiliados: { porcentaje: c.compensacion.afiliados?.porcentaje ?? 0, duracion: e.target.value },
                    })}
                    className={input}>
                    <option value="">Selecciona una opción</option>
                    <option>1 mes</option><option>3 meses</option>
                    <option>6 meses</option><option>Indefinida</option>
                  </select>
                </Campo>
              </div>
            </Opcion>
          </>
        )}

        {error && <p className="text-[13px] text-pink bg-pink-soft rounded-xl px-3.5 py-2.5">{error}</p>}
        {aviso && <p className="text-[13px] text-green bg-green/10 rounded-xl px-3.5 py-2.5">{aviso}</p>}
      </div>

      {/* Pie: guardar o avanzar */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Link href={`/app/marca/campanias/${c.id}`}
          className="border border-border text-sub rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:bg-surface transition">
          Vista previa
        </Link>
        <button onClick={guardarBorrador} disabled={pendiente}
          className="border border-border text-sub rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:bg-surface transition disabled:opacity-50">
          Guardar borrador
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setPaso((p) => Math.max(1, p - 1))} disabled={paso === 1 || pendiente}
            className="rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-sub hover:bg-surface transition disabled:opacity-40">
            Atrás
          </button>
          {paso < 3 ? (
            <button onClick={siguiente} disabled={pendiente}
              className="bg-accent text-white rounded-xl px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-60">
              {pendiente ? "Guardando…" : "Siguiente →"}
            </button>
          ) : (
            <button onClick={() => setConfirmar(true)} disabled={pendiente}
              className="bg-accent text-white rounded-xl px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-60">
              Publicar campaña
            </button>
          )}
        </div>
      </div>

      {confirmar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setConfirmar(false)} />
          <div className="relative w-full max-w-[400px] bg-surface rounded-3xl shadow-2xl p-6 text-center">
            <button type="button" onClick={() => setConfirmar(false)} aria-label="Cerrar"
              className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-full text-hint hover:bg-bg transition">✕</button>
            <span className="w-14 h-14 rounded-full bg-accent-soft grid place-items-center text-2xl mx-auto">📣</span>
            <h2 className="font-display font-extrabold text-[18px] mt-3">¿Todo listo para publicar la campaña?</h2>
            <p className="text-[13px] text-sub leading-snug mt-2">
              Cuando la publiques, aún podrás editar los <b className="text-text">datos generales</b>, pero
              la información de <b className="text-text">compensación quedará fija</b>.
            </p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setConfirmar(false)}
                className="flex-1 border border-border text-sub rounded-xl py-2.5 text-[14px] font-bold hover:bg-bg transition">
                Cancelar
              </button>
              <button onClick={publicar} disabled={pendiente}
                className="flex-1 bg-accent text-white rounded-xl py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-60">
                {pendiente ? "Publicando…" : "Publicar campaña"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MarcaShell>
  );
}

// ————— Piezas —————
const input = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-accent";

function Titulo({ t, s }: { t: string; s?: string }) {
  return (
    <div>
      <h2 className="font-display font-extrabold text-[15.5px]">{t}</h2>
      {s && <p className="text-[12.5px] text-sub leading-snug mt-0.5">{s}</p>}
    </div>
  );
}

function Campo({ label, ayuda, obligatorio, children }: {
  label: string; ayuda?: string; obligatorio?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold">
        {label} {obligatorio && <span className="text-pink">*</span>}
      </span>
      {ayuda && <span className="block text-[11.5px] text-hint leading-snug mt-0.5">{ayuda}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Chip({ txt, on, click }: { txt: string; on: boolean; click: () => void }) {
  return (
    <button type="button" onClick={click}
      className={`text-[12px] font-semibold rounded-full px-3 py-1.5 border transition ${
        on ? "bg-accent text-white border-accent" : "bg-bg text-sub border-border hover:border-accent/40"}`}>
      {txt}
    </button>
  );
}

function Opcion({ icono, titulo, sub, on, alternar, children }: {
  icono: string; titulo: string; sub: string; on: boolean;
  alternar: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition ${on ? "border-accent/40 bg-accent-soft/20" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={on} onChange={(e) => alternar(e.target.checked)}
          className="w-5 h-5 accent-accent cursor-pointer mt-0.5 shrink-0" />
        <span className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center text-[17px] shrink-0">{icono}</span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-extrabold text-[13.5px]">{titulo}</div>
          <p className="text-[12px] text-sub leading-snug mt-0.5">{sub}</p>
        </div>
      </div>
      {on && <div className="mt-3.5 pl-0 sm:pl-[72px]">{children}</div>}
    </div>
  );
}

function PreguntaFila({ p, onCambio, onBorrar }: {
  p: Pregunta; onCambio: (p: Pregunta) => void; onBorrar: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border p-3.5">
      <div className="flex flex-wrap items-start gap-2">
        <input value={p.texto} onChange={(e) => onCambio({ ...p, texto: e.target.value })}
          placeholder="Escribe tu pregunta aquí…"
          className={`${input} flex-1 min-w-[180px]`} />
        <select value={p.tipo} onChange={(e) => onCambio({ ...p, tipo: e.target.value as Pregunta["tipo"] })}
          className={`${input} w-auto`}>
          <option value="corto">Texto corto</option>
          <option value="largo">Texto largo</option>
          <option value="enlace">Enlace</option>
        </select>
        <button type="button" onClick={onBorrar} aria-label="Quitar pregunta"
          className="w-10 h-10 grid place-items-center rounded-xl text-hint hover:text-pink hover:bg-bg transition">
          🗑
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-2.5">
        <Interruptor on={p.obligatoria} set={(v) => onCambio({ ...p, obligatoria: v })} txt="Obligatoria" />
        <Interruptor on={p.compartir} set={(v) => onCambio({ ...p, compartir: v })}
          txt="Compartir respuestas en la lista de creadores" />
      </div>
    </div>
  );
}

function Interruptor({ on, set, txt }: { on: boolean; set: (v: boolean) => void; txt: string }) {
  return (
    <button type="button" onClick={() => set(!on)} className="flex items-center gap-2 text-[12px] font-semibold text-sub">
      <span className={`w-9 h-5 rounded-full p-0.5 transition ${on ? "bg-accent" : "bg-border"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`} />
      </span>
      {txt}
    </button>
  );
}

// Lista sencilla de textos (imágenes por enlace, ubicaciones…).
function ListaEnlaces({ valores, onCambio, marcador }: {
  valores: string[]; onCambio: (v: string[]) => void; marcador: string;
}) {
  const [texto, setTexto] = useState("");
  const agregar = () => {
    const t = texto.trim();
    if (!t) return;
    onCambio([...valores, t]);
    setTexto("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <input value={texto} onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregar(); } }}
          placeholder={marcador} className={input} />
        <button type="button" onClick={agregar}
          className="shrink-0 border border-border rounded-xl px-4 text-[13px] font-bold text-sub hover:border-accent/40 transition">
          Agregar
        </button>
      </div>
      {valores.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {valores.map((v, i) => (
            <span key={`${v}-${i}`} className="flex items-center gap-1.5 text-[12px] bg-bg border border-border rounded-full pl-3 pr-1.5 py-1">
              <span className="max-w-[220px] truncate">{v}</span>
              <button type="button" onClick={() => onCambio(valores.filter((_, j) => j !== i))}
                aria-label="Quitar" className="text-hint hover:text-pink">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
