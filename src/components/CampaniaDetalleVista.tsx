"use client";

import { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { postularme } from "@/lib/marketplace";
import type { CampaniaDetalle } from "@/lib/marketplace";

// La campaña vista por la creadora: de qué va, a quién busca la marca, qué
// paga y el botón para postularse. Si la marca dejó preguntas, salen en un
// pop-up antes de enviar.

export function CampaniaDetalleVista({
  nombre, avatarUrl, xp, racha, campania,
}: {
  nombre: string; avatarUrl: string | null; xp: number; racha: number;
  campania: CampaniaDetalle;
}) {
  const [estado, setEstado] = useState(campania.miEstado);
  const [preguntando, setPreguntando] = useState(false);
  const [gracias, setGracias] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(respuestas: Record<string, string>) {
    setEnviando(true);
    setError("");
    const r = await postularme(campania.id, respuestas);
    setEnviando(false);
    if ("error" in r) { setError(r.error); return; }
    setPreguntando(false);
    setEstado("enviada");
    setGracias(true);
  }

  function aplicar() {
    if (campania.preguntas.length) { setPreguntando(true); return; }
    void enviar({});
  }

  const puedeAplicar = campania.activa && !campania.bajoNivel && !estado;

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="marketplace" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-5 pb-16">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <Link href="/app/marketplace"
            className="inline-flex items-center gap-2 bg-accent-soft text-accent rounded-full pl-3 pr-4 py-2 text-[14px] font-bold hover:brightness-95 transition">
            <span aria-hidden>←</span> Volver
          </Link>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-4">{campania.titulo}</h1>
          <p className="text-sub text-[14px] mt-1">
            {campania.publicadaAt ? `Publicado ${fechaLarga(campania.publicadaAt)}` : campania.marca}
          </p>

          {/* Si es exclusiva de un curso, se dice: así quien la ve entiende
              por qué le tocó a ella y no a toda la comunidad. */}
          {campania.soloCurso && (
            <p className="inline-flex items-center gap-2 bg-accent-soft text-accent rounded-full px-3.5 py-1.5 text-[13px] font-bold mt-3">
              🎓 Exclusiva para alumnos de {campania.soloCurso}
            </p>
          )}

          {/* ————— De qué va la campaña ————— */}
          <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 mt-5 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-display font-extrabold text-[17px]">Estatus:</span>
              <Insignia activa={campania.activa} />
              <span className="ml-auto flex items-center gap-2 text-[13px] text-sub">
                {campania.marcaLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={campania.marcaLogo} alt="" className="w-6 h-6 rounded-full object-cover" />
                )}
                {campania.marca}
              </span>
            </div>

            {campania.descripcion && (
              <div className="mt-4 space-y-3 text-[14.5px] leading-relaxed">
                {campania.descripcion.split(/\n{2,}/).map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            )}

            <Galeria imagenes={galeria(campania)} />
          </section>

          {/* ————— A quién busca ————— */}
          <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 mt-4 shadow-sm">
            <h2 className="font-display font-extrabold text-[19px]">Perfil del creador objetivo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
              <Rasgo icono={<IcoEtiqueta />} titulo="Nicho"
                valor={campania.nicho} clase="bg-accent-soft text-accent" />
              <Rasgo icono={<IcoGente />} titulo="Género"
                valor={campania.genero || "Todos"} clase="bg-sky-100 text-sky-700" />
              <Rasgo icono={<IcoPastel />} titulo="Rango de edad"
                valor={edades(campania)} clase="bg-green/10 text-green" />
              <Rasgo icono={<IcoPersona />} titulo="Cantidad de seguidores"
                valor={seguidores(campania)} clase="bg-rose-100 text-rose-600" />
            </div>
            {campania.ubicaciones.length > 0 && (
              <div className="border-t border-border mt-5 pt-5">
                <Rasgo icono={<IcoPin />} titulo="Ubicación de los creadores"
                  valores={campania.ubicaciones} clase="bg-accent-soft text-accent" />
              </div>
            )}
          </section>

          {/* ————— Qué paga ————— */}
          <Compensacion c={campania} />

          {/* ————— Postularse ————— */}
          <div className="mt-6">
            {error && !preguntando && (
              <p className="text-[13.5px] text-red-600 font-semibold mb-3 text-center">{error}</p>
            )}
            {estado === "enviada" ? (
              <Aviso texto="Ya te postulaste. Te avisamos en cuanto la marca decida." />
            ) : estado === "aceptada" ? (
              <Link href="/app/campanias"
                className="block w-full text-center bg-green text-white rounded-2xl py-4 text-[15px] font-extrabold hover:brightness-110 transition">
                ¡Quedaste! Ver tu campaña
              </Link>
            ) : estado === "rechazada" ? (
              <Aviso texto="Esta vez no quedaste. Hay más campañas abiertas en el Marketplace." />
            ) : campania.bajoNivel ? (
              <Aviso texto={`Esta campaña pide nivel ${campania.nivelMinimo}. Sigue avanzando en tu ruta y vuelve.`} />
            ) : !campania.activa ? (
              <Aviso texto="Esta campaña ya cerró." />
            ) : (
              <button onClick={aplicar} disabled={enviando}
                className="w-full bg-accent text-white rounded-2xl py-4 text-[15px] font-extrabold hover:brightness-110 transition disabled:opacity-60">
                {enviando ? "Enviando…" : "Aplicar a la campaña"}
              </button>
            )}
            {puedeAplicar && (
              <p className="text-center text-hint text-[12.5px] mt-2.5">
                Con un clic mandas tu perfil a la marca. {campania.aplicantes > 0 && `Ya se postularon ${campania.aplicantes}.`}
              </p>
            )}
          </div>
        </div>
      </main>

      {preguntando && (
        <ModalPreguntas
          preguntas={campania.preguntas}
          enviando={enviando}
          error={error}
          onEnviar={enviar}
          onCerrar={() => { setPreguntando(false); setError(""); }}
        />
      )}
      {gracias && <ModalGracias onCerrar={() => setGracias(false)} />}
    </div>
  );
}

// ————————————————— Preguntas de selección —————————————————

function ModalPreguntas({ preguntas, enviando, error, onEnviar, onCerrar }: {
  preguntas: CampaniaDetalle["preguntas"];
  enviando: boolean; error: string;
  onEnviar: (r: Record<string, string>) => void;
  onCerrar: () => void;
}) {
  const [r, setR] = useState<Record<string, string>>({});

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4" onClick={onCerrar}>
      <div className="bg-surface rounded-3xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-3">
          <h3 className="font-display text-xl font-extrabold">Para aplicar responde a las siguientes preguntas</h3>
        </div>

        <div className="px-6 overflow-y-auto space-y-4 flex-1">
          {preguntas.map((p, i) => (
            <div key={p.id} className="bg-bg rounded-2xl p-4">
              <label className="block text-[14px] font-semibold">
                <span className="text-sub mr-1.5">{i + 1}.</span>
                {p.texto}
                {!p.obligatoria && <span className="text-hint font-normal text-[12.5px]"> (opcional)</span>}
              </label>
              {p.tipo === "enlace" ? (
                <input type="url" inputMode="url" value={r[p.id] ?? ""}
                  onChange={(e) => setR({ ...r, [p.id]: e.target.value })}
                  placeholder="https://instagram.com/tu-perfil"
                  className="w-full mt-2 bg-accent-soft/50 border border-transparent focus:border-accent rounded-xl px-3.5 py-2.5 text-[14px] outline-none" />
              ) : (
                <textarea value={r[p.id] ?? ""} rows={p.tipo === "corto" ? 2 : 4} maxLength={2000}
                  onChange={(e) => setR({ ...r, [p.id]: e.target.value })}
                  className="w-full mt-2 bg-accent-soft/50 border border-transparent focus:border-accent rounded-xl px-3.5 py-2.5 text-[14px] outline-none resize-none" />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 pt-4">
          {error && <p className="text-[13px] text-red-600 font-semibold mb-2.5 text-center">{error}</p>}
          <button onClick={() => onEnviar(r)} disabled={enviando}
            className="w-full bg-accent text-white rounded-xl py-3.5 text-[14.5px] font-extrabold hover:brightness-110 transition disabled:opacity-60">
            {enviando ? "Enviando…" : "Aplicar a la campaña"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalGracias({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/40 grid place-items-center p-4" onClick={onCerrar}>
      <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onCerrar} className="absolute top-4 right-4 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>
        <span className="w-20 h-20 rounded-full bg-accent-soft grid place-items-center mx-auto">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="m4.5 12.5 5 5 10-11" />
          </svg>
        </span>
        <h3 className="font-display text-2xl font-extrabold mt-4">¡Gracias por aplicar!</h3>
        <p className="text-sub text-[14px] mt-2 leading-snug">
          Te notificaremos si has sido seleccionado para esta campaña.
        </p>
        <button onClick={onCerrar}
          className="mt-6 bg-accent text-white rounded-xl px-8 py-3 text-[14.5px] font-extrabold hover:brightness-110 transition">
          Entendido
        </button>
      </div>
    </div>
  );
}

// ————————————————— Piezas —————————————————

function Compensacion({ c }: { c: CampaniaDetalle }) {
  const { intercambio, monto, afiliados } = c.compensacion;
  if (!intercambio && !monto && !afiliados && !c.compensacionDetalle) return null;

  return (
    <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 mt-4 shadow-sm">
      <h2 className="font-display font-extrabold text-[19px]">Pago y compensación</h2>
      {c.compensacionDetalle && (
        <>
          <h3 className="font-bold text-[14px] mt-4">Detalles de la compensación</h3>
          <p className="text-sub text-[13.5px] leading-relaxed mt-1 whitespace-pre-line">{c.compensacionDetalle}</p>
        </>
      )}

      <div className="space-y-3 mt-5">
        {intercambio && (
          <Forma icono="🎁" titulo="Intercambio de producto"
            texto="Recibirás un kit de productos de la marca para que puedas crear contenido auténtico."
            etiqueta="Productos a enviar" valor={intercambio.productos} />
        )}
        {monto && (
          <Forma icono="💵" titulo="Monto específico"
            texto="La marca te ofrece una compensación económica por tu contenido."
            etiqueta="Monto por creador"
            valor={`$${(monto.cantidad || 0).toLocaleString("en-US")} ${monto.moneda || "MXN"}`} />
        )}
        {afiliados && (
          <Forma icono="📈" titulo="Programa de afiliados"
            texto="Ganas una comisión por cada venta que llegue con tu enlace."
            etiqueta="Comisión"
            valor={`${afiliados.porcentaje || 0}%${afiliados.duracion ? ` · ${afiliados.duracion}` : ""}`} />
        )}
      </div>
    </section>
  );
}

function Forma({ icono, titulo, texto, etiqueta, valor }: {
  icono: string; titulo: string; texto: string; etiqueta: string; valor: string;
}) {
  return (
    <div className="bg-accent-soft/40 border border-accent/15 rounded-2xl p-4 grid gap-4 sm:grid-cols-[1.1fr_1fr] sm:items-center">
      <div className="flex gap-3">
        <span className="w-11 h-11 rounded-xl bg-surface grid place-items-center text-[20px] shrink-0">{icono}</span>
        <div className="min-w-0">
          <h4 className="font-display font-extrabold text-[14.5px]">{titulo}</h4>
          <p className="text-sub text-[12.5px] leading-snug mt-0.5">{texto}</p>
        </div>
      </div>
      {valor && (
        <div className="bg-surface border border-border rounded-xl p-3">
          <div className="text-[12px] text-hint font-semibold">{etiqueta}</div>
          <div className="text-[13.5px] font-bold mt-0.5 break-words">{valor}</div>
        </div>
      )}
    </div>
  );
}

function Rasgo({ icono, titulo, valor, valores, clase }: {
  icono: React.ReactNode; titulo: string;
  valor?: string | null; valores?: string[]; clase: string;
}) {
  const lista = valores ?? (valor ? [valor] : []);
  if (!lista.length) return null;
  return (
    <div className="flex gap-3">
      <span className="text-hint shrink-0 mt-0.5">{icono}</span>
      <div className="min-w-0">
        <div className="text-[13px] text-sub font-semibold leading-tight">{titulo}</div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {lista.map((v) => (
            <span key={v} className={`text-[12.5px] font-bold rounded-full px-2.5 py-1 ${clase}`}>{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Insignia({ activa }: { activa: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold rounded-full px-3 py-1 ${
      activa ? "bg-green/10 text-green" : "bg-bg text-hint border border-border"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${activa ? "bg-green" : "bg-hint"}`} />
      {activa ? "Activa" : "Cerrada"}
    </span>
  );
}

function Galeria({ imagenes }: { imagenes: string[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  if (!imagenes.length) return null;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        {imagenes.slice(0, 8).map((src) => (
          <button key={src} onClick={() => setAbierta(src)}
            className="aspect-[4/3] rounded-2xl overflow-hidden bg-bg hover:brightness-95 transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {abierta && (
        <div className="fixed inset-0 z-[80] bg-black/80 grid place-items-center p-6" onClick={() => setAbierta(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={abierta} alt="" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <p className="bg-surface border border-dashed border-border rounded-2xl py-4 px-5 text-center text-[14px] text-sub">
      {texto}
    </p>
  );
}

// ————————————————— Formato —————————————————

function galeria(c: CampaniaDetalle): string[] {
  const todas = [...(c.imagenUrl ? [c.imagenUrl] : []), ...c.imagenes];
  return [...new Set(todas.filter(Boolean))];
}

function edades(c: CampaniaDetalle): string | null {
  if (c.edadMin && c.edadMax) return `${c.edadMin} – ${c.edadMax} años`;
  if (c.edadMin) return `Desde ${c.edadMin} años`;
  if (c.edadMax) return `Hasta ${c.edadMax} años`;
  return "Sin límite";
}

function seguidores(c: CampaniaDetalle): string | null {
  const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
  if (c.seguidoresMin && c.seguidoresMax) return `${k(c.seguidoresMin)} – ${k(c.seguidoresMax)}`;
  if (c.seguidoresMin) return `Desde ${k(c.seguidoresMin)}`;
  if (c.seguidoresMax) return `Hasta ${k(c.seguidoresMax)}`;
  return "Sin mínimo";
}

// Las fechas se arman en el navegador: en el servidor salían en UTC y los
// publicados de la tarde aparecían con el día de mañana.
function fechaLarga(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

const ICO = {
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
} as const;

function IcoEtiqueta() { return <svg {...ICO}><path d="M3.5 11V4.5H10l10 10-6.5 6.5z" /><circle cx="7.3" cy="7.8" r="1.3" /></svg>; }
function IcoGente() { return <svg {...ICO}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9.5" r="2.2" /><path d="M16 15.5a4.5 4.5 0 0 1 4.5 3.5" /></svg>; }
function IcoPastel() { return <svg {...ICO}><path d="M4 20v-7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V20z" /><path d="M4 15.5h16" /><path d="M8 10.5V8M12 10.5V7.5M16 10.5V8" /></svg>; }
function IcoPersona() { return <svg {...ICO}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>; }
function IcoPin() { return <svg {...ICO}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
