"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fechaCorta } from "@/lib/formato-campanias";
import { revisarCampania } from "@/lib/marca-campanias";
import { fijarMonto } from "@/lib/mkt-admin";
import type { SolicitudDetalle } from "@/lib/mkt-admin";

// La ficha con la que el equipo aprueba una campaña. Es la campaña de verdad,
// no una copia: al aprobar, este mismo renglón es el que ve la creadora.

const TIPOS: Record<string, string> = {
  intercambio: "Intercambio de producto",
  monto: "Compensación económica",
  afiliados: "Afiliados",
};

const TIPO_PREGUNTA: Record<string, string> = {
  corto: "Respuesta corta",
  largo: "Respuesta larga",
  enlace: "Enlace",
};

export function MktSolicitudDetalle({ s }: { s: SolicitudDetalle }) {
  const router = useRouter();
  const [monto, setMonto] = useState(s.compensacion.monto?.cantidad ? String(s.compensacion.monto.cantidad) : "");
  const [moneda, setMoneda] = useState(s.compensacion.monto?.moneda || "MXN");
  const [nota, setNota] = useState("");
  const [pidiendo, setPidiendo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  // Si la marca ofrece dinero, el monto es obligatorio antes de aprobar: es el
  // número con el que la creadora decide si se postula.
  const pideMonto = s.tipos.includes("monto");

  async function aprobar() {
    setError("");
    if (pideMonto) {
      const n = Number(monto);
      if (!n || n <= 0) { setError("Pon el monto por creador antes de aprobar."); return; }
      setOcupado(true);
      const r = await fijarMonto(s.id, n, moneda);
      if ("error" in r) { setOcupado(false); setError(r.error); return; }
    } else {
      setOcupado(true);
    }
    const r = await revisarCampania(s.id, true, "");
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    router.push("/app/admin/marketplace/solicitudes");
    router.refresh();
  }

  async function pedirCorrecciones() {
    setError("");
    if (!nota.trim()) { setError("Escribe qué tiene que cambiar: es lo que va a leer la marca."); return; }
    setOcupado(true);
    const r = await revisarCampania(s.id, false, nota.trim());
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    router.push("/app/admin/marketplace/solicitudes");
    router.refresh();
  }

  return (
    <>
      <Link href="/app/admin/marketplace/solicitudes"
        className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-4 py-2 text-[13.5px] font-bold text-accent hover:bg-accent-soft transition">
        ← Volver
      </Link>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-4">{s.titulo}</h1>

      <div className="flex items-center gap-2.5 mt-2.5">
        {s.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logoUrl} alt="" className="w-9 h-9 rounded-full object-contain bg-surface border border-border p-1" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-accent-soft text-accent grid place-items-center text-[11px] font-extrabold">
            {s.marca.slice(0, 2).toUpperCase()}
          </span>
        )}
        <b className="text-[15px]">{s.marca}</b>
      </div>

      <div className="bg-surface border border-border rounded-2xl mt-4 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <Dato icono="🏷️" etiqueta="Tipo"
          valor={s.tipos.map((t) => TIPOS[t] || t).join(" · ") || "Por definir"} />
        <Dato icono="📅" etiqueta="Fecha de inicio" valor={fechaCorta(s.inicio?.slice(0, 10))} />
        <Dato icono="📅" etiqueta="Fecha de fin" valor={fechaCorta(s.fin?.slice(0, 10))} />
      </div>

      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mt-3">
        <h2 className="font-display font-extrabold text-[15.5px]">Descripción</h2>
        <p className="text-[13.5px] text-sub leading-relaxed mt-3 whitespace-pre-wrap">
          {s.descripcion || "La marca no escribió descripción."}
        </p>
        {s.imagenes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {s.imagenes.slice(0, 8).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="w-full aspect-square rounded-xl object-cover" />
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mt-3">
        <h2 className="font-display font-extrabold text-[15.5px]">Perfil del creador objetivo</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          <Chip icono="🏷️" etiqueta="Nicho" valor={s.nicho || "Todos"} color="bg-accent-soft text-accent" />
          <Chip icono="👥" etiqueta="Género" valor={genero(s.genero)} color="bg-sky-100 text-sky-700" />
          <Chip icono="🎂" etiqueta="Rango de edad" valor={edad(s.edadMin, s.edadMax)} color="bg-green/10 text-green" />
          <Chip icono="📈" etiqueta="Cantidad de seguidores"
            valor={seguidores(s.seguidoresMin, s.seguidoresMax)} color="bg-pink-soft text-pink" />
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Chip icono="📍" etiqueta="Ubicación de los creadores"
            valor={s.ubicaciones.length ? s.ubicaciones.join(", ") : "Sin restricción"}
            color="bg-accent-soft text-accent" />
        </div>
      </section>

      {pideMonto && (
        <section className="bg-accent-soft/40 border border-accent/25 rounded-2xl p-4 sm:p-5 mt-3">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            <div className="flex items-start gap-3 lg:w-[45%]">
              <span className="w-11 h-11 rounded-full bg-surface text-accent grid place-items-center text-[17px] font-extrabold shrink-0">$</span>
              <div>
                <h2 className="font-display font-extrabold text-[15.5px]">Monto específico</h2>
                <p className="text-[13px] text-sub leading-snug mt-0.5">
                  Ofrecerás una compensación económica a los creadores.
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[13px] font-bold block mb-1.5">
                Monto por creador <span className="text-pink">*</span>
              </label>
              <div className="flex gap-2">
                <span className="flex-1 min-w-0 flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 h-11">
                  <span className="text-hint">$</span>
                  <input value={monto} inputMode="numeric"
                    onChange={(e) => setMonto(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Ej: 500"
                    className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
                </span>
                <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
                  className="bg-surface border border-border rounded-xl px-3 h-11 text-[13.5px] font-semibold outline-none cursor-pointer">
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <p className="text-[12px] text-hint mt-1.5">
                Indica el monto fijo que recibirán los creadores seleccionados.
              </p>
            </div>
          </div>
        </section>
      )}

      {s.compensacionDetalle && (
        <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mt-3">
          <h2 className="font-display font-extrabold text-[15.5px]">Detalles de la compensación</h2>
          <p className="text-[13.5px] text-sub leading-relaxed mt-2.5 whitespace-pre-wrap">{s.compensacionDetalle}</p>
        </section>
      )}

      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mt-3">
        <h2 className="font-display font-extrabold text-[15.5px]">Preguntas de selección (opcional)</h2>
        {s.preguntas.length === 0 ? (
          <p className="text-[13px] text-sub mt-3">
            Sin preguntas: las creadoras solo mandan su mensaje al postularse.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border">
            {s.preguntas.map((p, i) => (
              <li key={p.id || i} className="flex items-center gap-3 py-3 flex-wrap">
                <span className="text-[13.5px] text-hint w-5 shrink-0">{i + 1}.</span>
                <span className="text-[13.5px] flex-1 min-w-[180px]">{p.texto}</span>
                <span className="text-[11.5px] font-bold text-sub bg-bg border border-border rounded-full px-2.5 py-1 shrink-0">
                  {TIPO_PREGUNTA[p.tipo] || p.tipo}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {error && (
        <p className="text-[13px] text-pink bg-pink-soft rounded-xl px-3.5 py-3 mt-3">{error}</p>
      )}

      {pidiendo && (
        <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mt-3">
          <label className="text-[13px] font-bold block mb-1.5">¿Qué tiene que cambiar?</label>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} autoFocus
            placeholder="Escríbelo como se lo dirías a la marca: esto es lo que van a leer."
            className="w-full bg-bg border border-border rounded-xl px-3.5 py-3 text-[13.5px] outline-none focus:border-accent resize-none" />
        </section>
      )}

      <div className="flex justify-end gap-2.5 mt-4 mb-2 flex-wrap">
        {pidiendo && (
          <button onClick={() => { setPidiendo(false); setNota(""); setError(""); }} disabled={ocupado}
            className="rounded-full px-5 py-3 text-[13.5px] font-bold text-sub hover:bg-bg transition disabled:opacity-50">
            Cancelar
          </button>
        )}
        <button onClick={() => (pidiendo ? pedirCorrecciones() : setPidiendo(true))} disabled={ocupado}
          className="border border-accent/40 text-accent rounded-full px-5 py-3 text-[13.5px] font-bold hover:bg-accent-soft transition disabled:opacity-50">
          {pidiendo ? (ocupado ? "Enviando…" : "Enviar comentarios") : "Pedir correcciones"}
        </button>
        {!pidiendo && (
          <button onClick={aprobar} disabled={ocupado}
            className="bg-accent text-white rounded-full px-7 py-3 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {ocupado ? "Aprobando…" : "Aprobar"}
          </button>
        )}
      </div>
    </>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: string; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="text-[16px] shrink-0">{icono}</span>
      <div className="min-w-0">
        <div className="text-[12px] text-hint">{etiqueta}</div>
        <div className="text-[13.5px] font-bold truncate">{valor}</div>
      </div>
    </div>
  );
}

function Chip({ icono, etiqueta, valor, color }: {
  icono: string; etiqueta: string; valor: string; color: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[12.5px] text-sub">
        <span>{icono}</span>{etiqueta}
      </div>
      <span className={`inline-block mt-1.5 text-[12.5px] font-bold rounded-full px-3 py-1 ${color}`}>
        {valor}
      </span>
    </div>
  );
}

function genero(v: string | null): string {
  if (!v || v === "todos") return "Todos";
  if (v === "femenino") return "Mujeres";
  if (v === "masculino") return "Hombres";
  return v;
}

function edad(min: number | null, max: number | null): string {
  if (!min && !max) return "Todos";
  if (min && max) return `${min} - ${max} años`;
  if (min) return `Desde ${min} años`;
  return `Hasta ${max} años`;
}

// 10000 → "10K". El mínimo siempre existe (default 0); el máximo es opcional.
function seguidores(min: number, max: number | null): string {
  const k = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n));
  if (!min && !max) return "Sin cantidad específica";
  if (min && max) return `${k(min)} - ${k(max)}`;
  if (min) return `+${k(min)}`;
  return `Hasta ${k(max as number)}`;
}
