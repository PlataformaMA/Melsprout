"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fechaYHora, pesoArchivo } from "@/lib/formato-campanias";
import {
  entregasDe, comentariosDe, urlDeEntrega, revisarEntrega,
  comentarEntrega, urlParaCaptura,
} from "@/lib/revision-entregas";
import type { Entrega, ComentarioEntrega } from "@/lib/revision-entregas";

// Revisar lo que entregó la creadora: verlo, bajarlo y decidir. Si hay que
// corregir, se le mandan los comentarios con capturas marcadas, que es como
// de verdad se piden los cambios de un video.

const TIPOS: Record<string, string> = {
  video: "Video final",
  guion: "Guion",
  extra: "Material extra",
};

export function ModalRevisarVideo({ colaboracionId, creador, onCerrar }: {
  colaboracionId: string;
  creador: string;
  onCerrar: () => void;
}) {
  const [entregas, setEntregas] = useState<Entrega[] | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioEntrega[]>([]);
  const [vista, setVista] = useState<"video" | "comentarios">("video");
  const [urlVideo, setUrlVideo] = useState<string | null>(null);
  const [error, setError] = useState("");

  // La carga va en un efecto porque es lo que el modal hace al abrirse; no
  // hay un clic después del cual pudiera colgarse.
  useEffect(() => {
    let vivo = true;
    (async () => {
      const [e, c] = await Promise.all([
        entregasDe(colaboracionId),
        comentariosDe(colaboracionId, "video"),
      ]);
      if (!vivo) return;
      setEntregas(e);
      setComentarios(c);
    })();
    return () => { vivo = false; };
  }, [colaboracionId]);

  const video = entregas?.find((e) => e.tipo === "video") ?? null;
  const extras = entregas?.filter((e) => e.tipo !== "video") ?? [];

  async function ver(e: Entrega) {
    const url = await urlDeEntrega(colaboracionId, e.ruta);
    if (!url) { setError("No se pudo abrir el archivo."); return; }
    setUrlVideo(url);
  }

  async function bajar(e: Entrega) {
    const url = await urlDeEntrega(colaboracionId, e.ruta);
    if (!url) { setError("No se pudo abrir el archivo."); return; }
    window.open(url, "_blank", "noopener");
  }

  async function aprobar() {
    if (!video) return;
    setError("");
    const r = await revisarEntrega(colaboracionId, video.id, true);
    if ("error" in r) { setError(r.error); return; }
    setEntregas((lista) =>
      (lista || []).map((x) => (x.id === video.id ? { ...x, estado: "aprobado" } : x)));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4"
      onClick={onCerrar}>
      <div onClick={(ev) => ev.stopPropagation()}
        className="bg-surface rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <header className="flex items-start gap-3 p-5 border-b border-border sticky top-0 bg-surface rounded-t-3xl">
          <span className="w-11 h-11 rounded-2xl bg-accent-soft grid place-items-center text-[18px] shrink-0">
            {vista === "video" ? "▶️" : "💬"}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-extrabold text-[18px]">
              {vista === "video" ? "Video final" : "Comentarios del video final"}
            </h2>
            <p className="text-[13px] text-sub">
              {vista === "video" ? creador : "Revisa las correcciones y comentarios."}
            </p>
          </div>
          {video?.estado === "aprobado" && (
            <span className="shrink-0 text-[12px] font-bold text-green bg-green/10 rounded-full px-3 py-1.5">
              ✓ Video aprobado
            </span>
          )}
          <button onClick={onCerrar} aria-label="Cerrar"
            className="shrink-0 text-hint text-[18px] hover:text-text transition">✕</button>
        </header>

        <div className="flex gap-5 px-5 pt-3 border-b border-border">
          {([["video", "Entrega"], ["comentarios", `Comentarios${comentarios.length ? ` (${comentarios.length})` : ""}`]] as const)
            .map(([k, txt]) => (
              <button key={k} onClick={() => setVista(k)}
                className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 ${
                  vista === k ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"}`}>
                {txt}
              </button>
            ))}
        </div>

        <div className="p-5">
          {error && <p className="text-[13px] text-pink bg-pink-soft rounded-xl px-3.5 py-3 mb-4">{error}</p>}

          {entregas === null ? (
            <p className="text-[13.5px] text-sub text-center py-10">Cargando…</p>
          ) : vista === "video" ? (
            <Entregas video={video} extras={extras} urlVideo={urlVideo}
              onVer={ver} onBajar={bajar} onAprobar={aprobar}
              onPedirCambios={() => setVista("comentarios")} />
          ) : (
            <Comentarios colaboracionId={colaboracionId} lista={comentarios}
              onNuevos={setComentarios} />
          )}
        </div>
      </div>
    </div>
  );
}

function Entregas({ video, extras, urlVideo, onVer, onBajar, onAprobar, onPedirCambios }: {
  video: Entrega | null;
  extras: Entrega[];
  urlVideo: string | null;
  onVer: (e: Entrega) => void;
  onBajar: (e: Entrega) => void;
  onAprobar: () => void;
  onPedirCambios: () => void;
}) {
  if (!video) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-bg grid place-items-center text-2xl mx-auto">🎬</div>
        <h3 className="font-display font-extrabold text-[15px] mt-3">Todavía no sube su video</h3>
        <p className="text-[13.5px] text-sub mt-1.5 max-w-sm mx-auto leading-snug">
          Cuando la creadora suba la entrega final, la vas a poder ver y aprobar desde aquí.
        </p>
        {extras.length > 0 && <Extras lista={extras} onBajar={onBajar} />}
      </div>
    );
  }

  return (
    <>
      {video.estado === "aprobado" && (
        <div className="flex items-start gap-3 bg-green/10 rounded-2xl p-4 mb-4">
          <span className="text-[18px] shrink-0">✅</span>
          <div>
            <b className="text-[14px] text-green block">¡Video aprobado!</b>
            <span className="text-[13px] text-sub">Esta colaboración quedó marcada como entregada.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Dato etiqueta="TIPO" valor={TIPOS[video.tipo] || video.tipo} />
        <Dato etiqueta="ENTREGADO" valor={fechaYHora(video.fecha)} />
        <Dato etiqueta="FORMATO" valor={`.${video.nombre.split(".").pop() || "—"}`} />
      </div>

      {urlVideo ? (
        <video src={urlVideo} controls className="w-full rounded-2xl mt-4 bg-black max-h-[46vh]" />
      ) : (
        <button onClick={() => onVer(video)}
          className="w-full mt-4 bg-bg border border-border rounded-2xl p-8 text-center hover:border-accent/40 transition">
          <span className="w-14 h-14 rounded-full bg-accent text-white grid place-items-center text-xl mx-auto">▶</span>
          <span className="block text-[13.5px] font-bold mt-3">Previsualizar</span>
        </button>
      )}

      <div className="flex items-center gap-3 bg-bg border border-border rounded-2xl p-3.5 mt-3 flex-wrap">
        <span className="text-[16px] shrink-0">📄</span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-bold truncate">{video.nombre}</div>
          {video.peso ? <div className="text-[12px] text-hint">{pesoArchivo(video.peso)}</div> : null}
        </div>
        <button onClick={() => onBajar(video)}
          className="shrink-0 bg-accent-soft text-accent rounded-xl px-4 py-2 text-[12.5px] font-bold hover:bg-accent hover:text-white transition">
          ⤓ Descargar
        </button>
      </div>

      {extras.length > 0 && <Extras lista={extras} onBajar={onBajar} />}

      {video.estado !== "aprobado" && (
        <div className="border-t border-border mt-5 pt-4">
          <b className="text-[14px] block">¿Todo en orden?</b>
          <p className="text-[13px] text-sub mt-0.5">
            Revisa el video y decide si quieres aprobarlo o mandar comentarios.
          </p>
          <div className="flex justify-end gap-2.5 mt-3.5 flex-wrap">
            <button onClick={onPedirCambios}
              className="border border-border rounded-full px-5 py-2.5 text-[13.5px] font-bold text-sub hover:border-accent/40 hover:text-accent transition">
              💬 Enviar comentarios
            </button>
            <button onClick={onAprobar}
              className="bg-accent text-white rounded-full px-6 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
              ✓ Aprobar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Extras({ lista, onBajar }: { lista: Entrega[]; onBajar: (e: Entrega) => void }) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <b className="text-[12px] text-hint tracking-wide">MATERIALES EXTRAS</b>
        <span className="text-[11.5px] text-hint bg-bg border border-border rounded-full px-2.5 py-0.5">
          {lista.length} {lista.length === 1 ? "archivo" : "archivos"}
        </span>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {lista.map((e) => (
          <li key={e.id} className="flex items-center gap-3 py-2.5">
            <span className="text-[15px] shrink-0">{e.tipo === "guion" ? "📝" : "📎"}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold truncate">{e.nombre}</div>
              <div className="text-[11.5px] text-hint">
                {[TIPOS[e.tipo] || e.tipo, pesoArchivo(e.peso)].filter(Boolean).join(" · ")}
              </div>
            </div>
            <button onClick={() => onBajar(e)} className="shrink-0 text-accent text-[15px] px-2">⤓</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Comentarios({ colaboracionId, lista, onNuevos }: {
  colaboracionId: string;
  lista: ComentarioEntrega[];
  onNuevos: (c: ComentarioEntrega[]) => void;
}) {
  const [texto, setTexto] = useState("");
  const [pendientes, setPendientes] = useState<{ ruta: string; nombre: string; peso: number | null }[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  async function subirCaptura(archivo: File) {
    setOcupado(true);
    setError("");
    const permiso = await urlParaCaptura(colaboracionId, archivo.name, archivo.size);
    if ("error" in permiso) { setOcupado(false); setError(permiso.error); return; }

    const { error: eSubida } = await createClient()
      .storage.from("entregas").uploadToSignedUrl(permiso.ruta, permiso.token, archivo);
    setOcupado(false);
    if (eSubida) { setError("No se pudo subir la imagen."); return; }
    setPendientes((p) => [...p, { ruta: permiso.ruta, nombre: archivo.name, peso: archivo.size }]);
  }

  async function mandar() {
    setOcupado(true);
    setError("");
    const r = await comentarEntrega(colaboracionId, "video", texto, pendientes);
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    setTexto("");
    setPendientes([]);
    onNuevos(await comentariosDe(colaboracionId, "video"));
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <b className="text-[14px] block">Capturas con correcciones</b>
        <p className="text-[12.5px] text-sub mt-0.5">
          Márcale en la imagen qué cambiar: se entiende mejor que escribirlo.
        </p>

        <button onClick={() => entrada.current?.click()} disabled={ocupado}
          className="w-full mt-3 border-2 border-dashed border-border rounded-2xl p-7 text-center hover:border-accent/50 transition disabled:opacity-50">
          <span className="w-11 h-11 rounded-xl bg-accent-soft grid place-items-center text-[18px] mx-auto">🖼️</span>
          <span className="block text-[13.5px] font-bold mt-2.5">
            {ocupado ? "Subiendo…" : "Subir imagen"}
          </span>
          <span className="block text-[12px] text-hint mt-0.5">PNG, JPG o WEBP · Máx. 10 MB</span>
        </button>
        <input ref={entrada} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (entrada.current) entrada.current.value = "";
            if (f) subirCaptura(f);
          }} />

        {pendientes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {pendientes.map((a) => (
              <li key={a.ruta} className="flex items-center gap-2.5 bg-bg border border-border rounded-xl px-3 py-2">
                <span className="text-[14px]">🖼️</span>
                <span className="text-[12.5px] font-bold truncate flex-1 min-w-0">{a.nombre}</span>
                <button onClick={() => setPendientes((p) => p.filter((x) => x.ruta !== a.ruta))}
                  className="text-hint hover:text-pink transition shrink-0">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col min-h-0">
        <b className="text-[14px] block">Comentarios</b>

        <div className="flex gap-2 mt-3">
          <input value={texto} onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") mandar(); }}
            placeholder="Escribe un mensaje…"
            className="flex-1 min-w-0 bg-bg border border-border rounded-xl px-3.5 h-11 text-[13.5px] outline-none focus:border-accent" />
          <button onClick={mandar} disabled={ocupado || (!texto.trim() && pendientes.length === 0)}
            className="shrink-0 w-11 h-11 rounded-xl bg-accent text-white grid place-items-center hover:brightness-110 transition disabled:opacity-40">
            ➤
          </button>
        </div>

        {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-xl px-3 py-2 mt-2">{error}</p>}

        <ul className="mt-3 space-y-2.5 overflow-y-auto max-h-[38vh]">
          {lista.length === 0 ? (
            <li className="text-[13px] text-sub py-6 text-center">
              Todavía no hay comentarios en este video.
            </li>
          ) : (
            lista.map((c) => (
              <li key={c.id} className="bg-accent-soft/50 rounded-2xl p-3.5">
                <div className="flex items-baseline gap-2">
                  <b className="text-[13px]">{c.autorNombre}</b>
                  <span className="text-[11.5px] text-hint">{fechaYHora(c.fecha)}</span>
                </div>
                {c.texto && (
                  <p className="text-[13px] leading-relaxed mt-1 whitespace-pre-wrap break-words">{c.texto}</p>
                )}
                {c.adjuntos.length > 0 && (
                  <p className="text-[12px] text-sub mt-1.5">
                    📎 {c.adjuntos.length} {c.adjuntos.length === 1 ? "captura" : "capturas"}
                  </p>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="bg-bg border border-border rounded-xl px-3 py-2.5 min-w-0">
      <div className="text-[10.5px] text-hint tracking-wide">{etiqueta}</div>
      <div className="text-[13px] font-bold truncate">{valor}</div>
    </div>
  );
}
