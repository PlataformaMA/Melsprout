"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarMisDatos } from "@/lib/creador-campanias";
import type { DatosCreador, Seleccion } from "@/lib/creador-campanias";

// Te seleccionaron para una campaña: el aviso y, en seguida, los datos que la
// marca necesita para mandarte el producto y pagarte.
//
// «Lo haré después» se recuerda por campaña en este navegador. No se guarda en
// la base a propósito: si entra desde el celular, vale la pena volver a
// pedírselo — sin esos datos no se le puede pagar.

export function ModalSeleccionado({ seleccion, datos }: {
  seleccion: Seleccion | null;
  datos: DatosCreador | null;
}) {
  const clave = seleccion ? `melsprout_seleccion_${seleccion.colaboracionId}` : "";
  const [cerrado, setCerrado] = useState(() => {
    if (typeof window === "undefined" || !clave) return true;
    try { return localStorage.getItem(clave) === "1"; } catch { return false; }
  });
  const [paso, setPaso] = useState<"aviso" | "datos">("aviso");

  if (!seleccion || cerrado) return null;

  function despues() {
    try { localStorage.setItem(clave, "1"); } catch { /* modo privado */ }
    setCerrado(true);
  }

  if (paso === "datos") {
    return (
      <FormularioDatos
        datos={datos}
        campania={seleccion.campania}
        onListo={() => setCerrado(true)}
        onCerrar={despues}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/45 grid place-items-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl p-7 sm:p-8 max-w-md w-full text-center relative shadow-2xl my-6">
        <button onClick={despues} className="absolute top-4 right-4 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>

        <span className="w-20 h-20 rounded-full bg-accent-soft grid place-items-center mx-auto text-accent">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3.5 20.5 6-15 9 9z" /><path d="M14 4.5v.01M18.5 7v.01M20.5 11.5v.01M16 11v.01" />
          </svg>
        </span>

        <h3 className="font-display text-3xl font-extrabold mt-4">¡Felicidades!</h3>
        <p className="text-sub text-[14.5px] mt-2">Has sido seleccionado para la campaña</p>
        <p className="font-display text-xl font-extrabold text-accent mt-1">{seleccion.campania}</p>
        <p className="text-sub text-[13.5px] mt-3 leading-snug">
          Nuestro equipo se comunicará contigo para iniciar el proceso. Mientras tanto,
          necesitamos la siguiente información para empezar:
        </p>

        <div className="bg-bg rounded-2xl mt-5 divide-y divide-border text-left">
          <Fila icono={<IcoPersona />} titulo="Información personal"
            texto="Nombre completo, contacto y dirección de envío." />
          <Fila icono={<IcoTarjeta />} titulo="Datos de pago"
            texto="Para la compensación de la campaña." />
        </div>

        <button onClick={() => setPaso("datos")}
          className="w-full mt-5 bg-accent text-white rounded-xl py-3.5 text-[15px] font-extrabold hover:brightness-110 transition">
          Completar información
        </button>
        <button onClick={despues} className="block mx-auto mt-3 text-sub text-[13.5px] hover:text-ink transition">
          Lo haré después
        </button>
      </div>
    </div>
  );
}

function Fila({ icono, titulo, texto }: { icono: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <span className="w-10 h-10 rounded-xl bg-surface grid place-items-center text-accent shrink-0">{icono}</span>
      <div className="min-w-0 flex-1">
        <div className="font-display font-extrabold text-[14px]">{titulo}</div>
        <div className="text-sub text-[12.5px] leading-snug mt-0.5">{texto}</div>
      </div>
      <span className="text-hint shrink-0" aria-hidden>›</span>
    </div>
  );
}

// ————————————————— El formulario —————————————————

export function FormularioDatos({ datos, campania, onListo, onCerrar }: {
  datos: DatosCreador | null;
  campania?: string;
  onListo: () => void;
  onCerrar?: () => void;
}) {
  const [v, setV] = useState<DatosCreador>(datos ?? {
    razonSocial: "", clabe: "", correo: "", nombreCompleto: "", direccion: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  const set = (k: keyof DatosCreador) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV({ ...v, [k]: e.target.value });

  async function continuar() {
    setGuardando(true);
    setError("");
    const r = await guardarMisDatos(v);
    setGuardando(false);
    if ("error" in r) { setError(r.error); return; }
    onListo();
    // Al terminar cae en «Campañas», que es donde va a seguir el proceso.
    router.push("/app/campanias");
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/45 grid place-items-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl p-6 sm:p-7 max-w-md w-full relative shadow-2xl my-6">
        {onCerrar && (
          <button onClick={onCerrar} className="absolute top-4 right-4 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>
        )}
        {campania && (
          <p className="text-sub text-[13px] pr-8">Para tu campaña con <b className="text-ink">{campania}</b></p>
        )}

        <div className="space-y-4 mt-4">
          <Campo label="Razón social">
            <input value={v.razonSocial} onChange={set("razonSocial")}
              placeholder="Nombre de la empresa o persona física con actividad empresarial"
              className="w-full bg-accent-soft/40 border border-transparent focus:border-accent rounded-xl px-3.5 py-3 text-[14px] outline-none" />
          </Campo>

          <Campo label="Cuenta clave interbancaria (CLABE)">
            <input value={v.clabe} onChange={set("clabe")} inputMode="numeric" maxLength={18}
              placeholder="18 dígitos"
              className="w-full bg-accent-soft/40 border border-transparent focus:border-accent rounded-xl px-3.5 py-3 text-[14px] outline-none" />
          </Campo>

          <Campo label="Correo electrónico">
            <ConIcono icono={<IcoSobre />}>
              <input value={v.correo} onChange={set("correo")} type="email" inputMode="email"
                placeholder="tucorreo@ejemplo.com"
                className="w-full bg-transparent text-[14px] outline-none" />
            </ConIcono>
          </Campo>

          <Campo label="Nombre completo">
            <ConIcono icono={<IcoPersona />}>
              <input value={v.nombreCompleto} onChange={set("nombreCompleto")}
                placeholder="Tu nombre completo"
                className="w-full bg-transparent text-[14px] outline-none" />
            </ConIcono>
          </Campo>

          <Campo label="Dirección de entrega de producto">
            <ConIcono icono={<IcoPin />}>
              <input value={v.direccion} onChange={set("direccion")}
                placeholder="Calle, número, colonia, ciudad, estado y código postal"
                className="w-full bg-transparent text-[14px] outline-none" />
            </ConIcono>
          </Campo>
        </div>

        {error && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-4">{error}</p>}

        <button onClick={continuar} disabled={guardando}
          className="w-full mt-6 bg-accent text-white rounded-xl py-3.5 text-[15px] font-extrabold hover:brightness-110 transition disabled:opacity-60">
          {guardando ? "Guardando…" : "Continuar"}
        </button>
        <p className="text-hint text-[11.5px] text-center mt-2.5 leading-snug">
          Tus datos solo los ve el equipo de Melsprout para pagarte y mandarte el producto.
        </p>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13.5px] font-bold mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ConIcono({ icono, children }: { icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 bg-accent-soft/40 border border-transparent focus-within:border-accent rounded-xl px-3.5 py-3">
      <span className="text-hint shrink-0">{icono}</span>
      {children}
    </span>
  );
}

const ICO = {
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round",
} as const;

function IcoPersona() { return <svg {...ICO}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>; }
function IcoTarjeta() { return <svg {...ICO}><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10.5h18M6.5 14.5h3" /></svg>; }
function IcoSobre() { return <svg {...ICO}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m3.8 7 8.2 6 8.2-6" /></svg>; }
function IcoPin() { return <svg {...ICO}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
