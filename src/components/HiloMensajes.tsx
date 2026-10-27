"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fechaCorta, pesoArchivo } from "@/lib/formato-campanias";
import {
  enviarMensaje, mensajesDe, urlParaAdjunto, urlDeAdjunto, marcarLeidos,
} from "@/lib/mensajes-marca";
import type { Mensaje } from "@/lib/mensajes-marca";

// El hilo con sus mensajes y la caja para escribir. Lo usan el panel del
// equipo y el portal de la empresa: es la misma conversación vista desde los
// dos lados, así que solo cambia de qué lado caen los globos.

export function HiloMensajes({ marcaId, inicial, yoSoy }: {
  marcaId: string;
  inicial: Mensaje[];
  yoSoy: "equipo" | "marca";
}) {
  const [mensajes, setMensajes] = useState(inicial);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const entrada = useRef<HTMLInputElement>(null);
  const fondo = useRef<HTMLDivElement>(null);

  // Al abrir el hilo se marca como leído. Cuando se cambia de conversación,
  // quien usa este componente le pasa key={marcaId} y React lo vuelve a
  // montar: así el estado arranca limpio sin tener que sincronizarlo a mano.
  useEffect(() => {
    marcarLeidos(marcaId);
  }, [marcaId]);

  useEffect(() => {
    fondo.current?.scrollIntoView({ block: "end" });
  }, [mensajes]);

  async function mandar() {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setError("");
    const r = await enviarMensaje(marcaId, t);
    setEnviando(false);
    if ("error" in r) { setError(r.error); return; }
    setTexto("");
    setMensajes(await mensajesDe(marcaId));
  }

  async function adjuntar(archivo: File) {
    setEnviando(true);
    setError("");
    const permiso = await urlParaAdjunto(marcaId, archivo.name, archivo.size);
    if ("error" in permiso) { setEnviando(false); setError(permiso.error); return; }

    // Del navegador directo al bucket: por una acción del servidor no cabe.
    const { error: eSubida } = await createClient()
      .storage.from("mensajes").uploadToSignedUrl(permiso.ruta, permiso.token, archivo);
    if (eSubida) {
      setEnviando(false);
      setError("No se pudo subir el archivo. Revisa tu conexión.");
      return;
    }

    const r = await enviarMensaje(marcaId, texto.trim(), [
      { ruta: permiso.ruta, nombre: archivo.name, peso: archivo.size },
    ]);
    setEnviando(false);
    if ("error" in r) { setError(r.error); return; }
    setTexto("");
    setMensajes(await mensajesDe(marcaId));
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4">
        {mensajes.length === 0 ? (
          <div className="h-full grid place-items-center text-center py-10">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-accent-soft grid place-items-center text-2xl mx-auto">💬</div>
              <p className="text-[13.5px] text-sub mt-3 max-w-xs mx-auto leading-snug">
                Todavía no hay mensajes. Escribe el primero aquí abajo.
              </p>
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div key={m.id}>
              {esOtroDia(mensajes[i - 1]?.fecha, m.fecha) && (
                <div className="text-center my-4">
                  <span className="text-[11.5px] text-hint bg-bg border border-border rounded-full px-3 py-1">
                    {diaDe(m.fecha)}
                  </span>
                </div>
              )}
              <Globo m={m} mio={m.autorTipo === yoSoy} marcaId={marcaId} />
            </div>
          ))
        )}
        <div ref={fondo} />
      </div>

      {error && (
        <p className="text-[12.5px] text-pink bg-pink-soft mx-4 sm:mx-5 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="border-t border-border p-3 sm:p-4 flex items-end gap-2">
        <button onClick={() => entrada.current?.click()} disabled={enviando}
          title="Adjuntar archivo"
          className="shrink-0 w-11 h-11 rounded-xl bg-bg border border-border grid place-items-center text-[16px] text-sub hover:text-accent hover:border-accent/40 transition disabled:opacity-50">
          📎
        </button>
        <input ref={entrada} type="file" className="hidden"
          accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (entrada.current) entrada.current.value = "";
            if (f) adjuntar(f);
          }} />

        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={1}
          onKeyDown={(e) => {
            // Enter manda; Shift+Enter hace salto de línea.
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); mandar(); }
          }}
          placeholder="Escribe un mensaje…"
          className="flex-1 min-w-0 bg-bg border border-border rounded-xl px-3.5 py-3 text-[13.5px] outline-none focus:border-accent resize-none max-h-32" />

        <button onClick={mandar} disabled={enviando || !texto.trim()}
          className="shrink-0 w-11 h-11 rounded-xl bg-accent text-white grid place-items-center text-[15px] hover:brightness-110 transition disabled:opacity-40">
          ➤
        </button>
      </div>
    </div>
  );
}

function Globo({ m, mio, marcaId }: { m: Mensaje; mio: boolean; marcaId: string }) {
  return (
    <div className="flex gap-2.5 mb-4">
      <span className={`w-9 h-9 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0 ${
        m.autorTipo === "equipo" ? "bg-accent-soft text-accent" : "bg-pink-soft text-pink"}`}>
        {iniciales(m.autorNombre)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <b className="text-[13.5px]">{m.autorNombre}</b>
          <span className="text-[11.5px] text-hint">{hora(m.fecha)}</span>
          {mio && <span className="text-[11px] text-hint">· tú</span>}
        </div>

        <div className={`inline-block max-w-full mt-1 rounded-2xl px-3.5 py-2.5 ${
          m.autorTipo === "equipo" ? "bg-accent-soft/60" : "bg-bg border border-border"}`}>
          {m.texto && (
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{m.texto}</p>
          )}

          {m.creador && (
            <div className="bg-surface border border-border rounded-xl p-3 mt-2 flex items-center gap-3">
              {m.creador.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.creador.avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-accent-soft shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-display font-extrabold text-[13.5px] truncate">{m.creador.nombre}</div>
                {m.creador.usuario && <div className="text-[12px] text-hint truncate">@{m.creador.usuario}</div>}
                {(m.creador.ciudad || m.creador.pais) && (
                  <div className="text-[12px] text-sub truncate">
                    {[m.creador.ciudad, m.creador.pais].filter(Boolean).join(", ")}
                  </div>
                )}
                {m.creador.redes.length > 0 && (
                  <div className="text-[11.5px] text-hint mt-0.5 capitalize truncate">
                    {m.creador.redes.join(" · ")}
                  </div>
                )}
              </div>
            </div>
          )}

          {m.adjuntos.map((a) => (
            <button key={a.ruta}
              onClick={async () => {
                const url = await urlDeAdjunto(marcaId, a.ruta);
                if (url) window.open(url, "_blank", "noopener");
              }}
              className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-3 py-2 mt-2 w-full text-left hover:border-accent/40 transition">
              <span className="text-[15px] shrink-0">📄</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold truncate">{a.nombre}</span>
                {a.peso ? <span className="block text-[11px] text-hint">{pesoArchivo(a.peso)}</span> : null}
              </span>
              <span className="text-accent shrink-0">⤓</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function iniciales(nombre: string): string {
  return nombre.split(/\s+/).slice(0, 2).map((p) => p[0] || "").join("").toUpperCase() || "··";
}

// La hora se arma en el navegador: el servidor vive en UTC y aquí saldría
// con horas de más.
function hora(iso: string): string {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";
  return f.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}

function esOtroDia(antes: string | undefined, ahora: string): boolean {
  if (!antes) return true;
  return new Date(antes).toDateString() !== new Date(ahora).toDateString();
}

function diaDe(iso: string): string {
  const f = new Date(iso);
  const hoy = new Date();
  if (f.toDateString() === hoy.toDateString()) return `Hoy, ${fechaCorta(iso)}`;
  const ayer = new Date(hoy.getTime() - 86400000);
  if (f.toDateString() === ayer.toDateString()) return `Ayer, ${fechaCorta(iso)}`;
  return fechaCorta(iso);
}
