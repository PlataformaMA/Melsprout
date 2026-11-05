"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  urlParaSubirContrato, registrarContrato, firmarContrato,
} from "@/lib/contrato-imagen";
import type { Contrato } from "@/lib/contrato-imagen";

// El contrato de derechos de imagen, visto por los dos lados.
//
// La marca lo sube; la creadora lo firma. La misma tarjeta sirve para ambos
// porque es el mismo hecho mirado desde dos sillas, y así nadie ve un estado
// distinto del que ve el otro.

// `onCambio` existe para el modal de revisión, que guarda su propio estado
// y no se repinta con router.refresh(). En una página normal sobra.
export function ContratoImagen({ contrato, onCambio }: {
  contrato: Contrato | null;
  onCambio?: () => void;
}) {
  const [firmando, setFirmando] = useState(false);

  if (!contrato) return null;
  const { nombre, firmadoAt, firmadoPor, url, puedoSubir, puedoFirmar } = contrato;

  // Nadie puede hacer nada y no hay documento: no se enseña una caja vacía.
  if (!nombre && !puedoSubir) return null;

  return (
    <section className="border-t border-border mt-5 pt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent grid place-items-center shrink-0">
          <IcoDocumento />
        </span>

        <div className="min-w-0 flex-1">
          <h4 className="font-display font-extrabold text-[14px]">Contrato de derechos de imagen</h4>
          <p className="text-[12.5px] text-sub leading-snug mt-0.5">
            {firmadoAt
              ? `Firmado el ${fechaHora(firmadoAt)}${firmadoPor ? ` por ${firmadoPor}` : ""}.`
              : nombre
                ? "Pendiente de firma de la creadora."
                : "Todavía no se ha subido."}
          </p>
        </div>

        {url && (
          <div className="flex gap-2 shrink-0">
            <a href={url} target="_blank" rel="noreferrer"
              className="border border-border rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-sub hover:border-accent/40 hover:text-accent transition">
              👁 Ver
            </a>
            <a href={url} download={nombre || "contrato"}
              className="bg-accent text-white rounded-xl px-3.5 py-2 text-[12.5px] font-bold hover:brightness-110 transition">
              ⤓ Descargar
            </a>
          </div>
        )}
      </div>

      {nombre && (
        <p className="text-hint text-[11.5px] mt-2 truncate">{nombre}</p>
      )}

      {puedoSubir && <Subir colaboracionId={contrato.colaboracionId} hay={!!nombre} onCambio={onCambio} />}

      {puedoFirmar && (
        firmando
          ? <Firmar colaboracionId={contrato.colaboracionId} onCancelar={() => setFirmando(false)} onCambio={onCambio} />
          : (
            <button onClick={() => setFirmando(true)}
              className="w-full sm:w-auto mt-3.5 bg-accent text-white rounded-xl px-5 py-2.5 text-[13px] font-bold hover:brightness-110 transition">
              ✍️ Firmar contrato
            </button>
          )
      )}
    </section>
  );
}

// ————————————————— La marca lo sube —————————————————

function Subir({ colaboracionId, hay, onCambio }: {
  colaboracionId: string; hay: boolean; onCambio?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function elegido(archivo: File | undefined) {
    if (!archivo || ocupado) return;
    setOcupado(true);
    setError("");

    const permiso = await urlParaSubirContrato(colaboracionId, archivo.name, archivo.size);
    if ("error" in permiso) { setOcupado(false); setError(permiso.error); return; }

    const sub = await createClient()
      .storage.from("entregas").uploadToSignedUrl(permiso.ruta, permiso.token, archivo);
    if (sub.error) {
      setOcupado(false);
      setError("No se pudo subir. Revisa tu conexión e inténtalo otra vez.");
      return;
    }

    const r = await registrarContrato(colaboracionId, permiso.ruta, archivo.name);
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    if (input.current) input.current.value = "";
    onCambio?.();
    router.refresh();
  }

  return (
    <div className="mt-3.5">
      <button onClick={() => input.current?.click()} disabled={ocupado}
        className="border border-border rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-sub hover:border-accent/40 hover:text-accent transition disabled:opacity-60">
        {ocupado ? "Subiendo…" : hay ? "Reemplazar contrato" : "⤒ Subir contrato (PDF, DOC)"}
      </button>
      {hay && (
        <p className="text-hint text-[11.5px] leading-snug mt-1.5">
          Si lo reemplazas, la firma se borra: lo que ella firmó era el documento anterior.
        </p>
      )}
      <input ref={input} type="file" accept=".pdf,.doc,.docx" className="hidden"
        onChange={(e) => elegido(e.target.files?.[0])} />
      {error && <p className="text-[12px] text-pink bg-pink-soft rounded-lg px-2.5 py-2 mt-2 leading-snug">{error}</p>}
    </div>
  );
}

// ————————————————— La creadora lo firma —————————————————

function Firmar({ colaboracionId, onCancelar, onCambio }: {
  colaboracionId: string; onCancelar: () => void; onCambio?: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [acepto, setAcepto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function firmar() {
    setOcupado(true);
    setError("");
    const r = await firmarContrato(colaboracionId, nombre);
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    onCambio?.();
    router.refresh();
  }

  return (
    <div className="bg-bg border border-border rounded-2xl p-4 mt-3.5">
      <p className="text-[13px] text-sub leading-snug">
        Antes de firmar, ábrelo y léelo. Al firmar queda registrado tu nombre y la
        fecha sobre este documento.
      </p>

      <label className="block text-[13px] font-bold mt-3">Tu nombre completo</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)}
        placeholder="Como aparece en tu identificación"
        className="w-full bg-surface border border-border focus:border-accent rounded-xl px-3 py-2.5 text-[13px] outline-none mt-1.5" />

      <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
        <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-accent shrink-0" />
        <span className="text-[12.5px] text-sub leading-snug">
          Leí el contrato y autorizo el uso de mi imagen en los términos que ahí se describen.
        </span>
      </label>

      {error && <p className="text-[12px] text-pink bg-pink-soft rounded-lg px-2.5 py-2 mt-2.5 leading-snug">{error}</p>}

      <div className="flex gap-2 mt-3.5 flex-wrap">
        <button onClick={firmar} disabled={ocupado || !acepto || nombre.trim().length < 3}
          className="bg-accent text-white rounded-xl px-5 py-2.5 text-[13px] font-bold hover:brightness-110 transition disabled:opacity-50">
          {ocupado ? "Firmando…" : "Firmar"}
        </button>
        <button onClick={onCancelar} disabled={ocupado}
          className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-sub hover:bg-surface transition">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function IcoDocumento() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
