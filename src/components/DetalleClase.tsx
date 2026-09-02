"use client";

import { useEffect, useState } from "react";
import { recursosDeClase, alternarVisibilidad, type ClaseAdmin, type RecursoClase } from "@/lib/clases-admin-actions";
import { AvatarInstructor } from "@/components/Instructor";
import { getComentariosClase, ocultarComentarioClase, type ComentarioClase } from "@/lib/clase-social-actions";

const num = (n: number) => n.toLocaleString("es-MX");

function dur(min: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${m} min` : `${m} minutos`;
}

// Detalle de una clase: el video, sus recursos y cómo va con las alumnas.
export function DetalleClase({ clase, onCerrar, onCambio }: {
  clase: ClaseAdmin; onCerrar: () => void; onCambio: () => void;
}) {
  const [tab, setTab] = useState<"info" | "recursos" | "comentarios">("info");
  const [coments, setComents] = useState<ComentarioClase[] | null>(null);
  const [recursos, setRecursos] = useState<RecursoClase[] | null>(null);
  const [visible, setVisible] = useState(clase.estado !== "oculta");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    recursosDeClase(clase.id).then(setRecursos);
    getComentariosClase(clase.id).then(setComents);
  }, [clase.id]);

  const finalizacion = clase.iniciaron ? Math.round((clase.completaron / clase.iniciaron) * 100) : 0;

  async function cambiarVisibilidad() {
    setGuardando(true);
    const r = await alternarVisibilidad(clase.id, !visible);
    setGuardando(false);
    if ("error" in r) { alert(r.error); return; }
    setVisible(!visible);
    onCambio();
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[900px] shadow-2xl my-6">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div className="min-w-0">
            {clase.nivel && (
              <span className="inline-block text-[11.5px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-0.5 mb-1.5">
                {clase.nivel}
              </span>
            )}
            <h2 className="font-display font-extrabold text-lg leading-tight">{clase.titulo}</h2>
            <div className="flex items-center gap-2 mt-2">
              <AvatarInstructor nombre={clase.instructor} size={26} />
              <span className="text-[13px] text-sub">
                {clase.instructor}{clase.instructorRol ? ` · ${clase.instructorRol}` : ""}
              </span>
            </div>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none shrink-0">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-6 px-6 py-5">
          <div className="min-w-0">
            <div className="rounded-2xl overflow-hidden bg-black aspect-video grid place-items-center">
              {clase.tieneVideo ? (
                <VideoDeClase claseId={clase.id} />
              ) : (
                <span className="text-white/70 text-[13.5px] px-4 text-center">Esta clase todavía no tiene video.</span>
              )}
            </div>

            <div className="flex gap-6 border-b border-border mt-4 mb-4">
              {([
                ["info", "Descripción"],
                ["recursos", `Recursos (${recursos?.length ?? 0})`],
                ["comentarios", `Comentarios (${coments?.length ?? 0})`],
              ] as const).map(([id, txt]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`pb-2.5 text-[13.5px] font-bold transition -mb-px border-b-2 ${
                    tab === id ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
                  }`}>{txt}</button>
              ))}
            </div>

            {tab === "info" ? (
              <div className="text-[13.5px] text-sub leading-relaxed space-y-2">
                <p>Duración total: <b className="text-text">{dur(clase.duracionMin)}</b>.</p>
                <p>Mundo: <b className="text-text">{clase.mundo}</b>.</p>
                <p>
                  {clase.tieneSubtitulos
                    ? "Tiene subtítulos generados automáticamente."
                    : "Todavía no tiene subtítulos."}
                </p>
              </div>
            ) : tab === "comentarios" ? (
              coments === null ? (
                <p className="text-[13.5px] text-hint">Cargando comentarios…</p>
              ) : coments.length === 0 ? (
                <p className="text-[13.5px] text-hint">Nadie ha comentado esta clase.</p>
              ) : (
                <div className="space-y-3">
                  {coments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      {c.autorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.autorAvatar} alt={c.autorNombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center text-[11px] font-bold shrink-0">
                          {c.autorNombre.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1 bg-bg rounded-2xl px-3 py-2">
                        <div className="font-bold text-[12.5px]">{c.autorNombre}</div>
                        <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{c.texto}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm("¿Ocultar este comentario?")) return;
                          const r = await ocultarComentarioClase(c.id);
                          if ("error" in r) { alert(r.error); return; }
                          setComents(await getComentariosClase(clase.id));
                        }}
                        className="text-[11.5px] font-bold text-sub hover:text-pink shrink-0">Ocultar</button>
                    </div>
                  ))}
                </div>
              )
            ) : recursos === null ? (
              <p className="text-[13.5px] text-hint">Cargando recursos…</p>
            ) : recursos.length === 0 ? (
              <p className="text-[13.5px] text-hint">Esta clase no tiene recursos para descargar.</p>
            ) : (
              <div className="space-y-2">
                {recursos.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-bg border border-border rounded-2xl px-3.5 py-2.5">
                    <span className="w-9 h-9 rounded-xl bg-accent-soft grid place-items-center text-[14px] shrink-0">📄</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[13px] truncate">{r.titulo}</div>
                      <div className="text-[11.5px] text-hint">{r.tipo || "Archivo"}{r.peso ? ` · ${r.peso}` : ""}</div>
                    </div>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-[12.5px] font-bold text-accent shrink-0">Abrir</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna de datos */}
          <aside className="space-y-4">
            <section className="bg-bg border border-border rounded-2xl p-4">
              <h3 className="font-display font-extrabold text-[13.5px] mb-2.5">Información general</h3>
              <dl className="space-y-2 text-[12.5px]">
                {([
                  ["Mundo", clase.mundo],
                  ["Nivel", clase.nivel || "—"],
                  ["Duración", dur(clase.duracionMin)],
                  ["Recursos", `${clase.recursos}`],
                  ["Calificación", clase.calificacion ? `${clase.calificacion} ★ (${clase.votos})` : "Sin votos"],
                  ["Video", clase.tieneVideo ? "Sí" : "Todavía no"],
                  ["Estado", visible ? (clase.tieneVideo ? "Publicada" : "Borrador") : "Oculta"],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-sub">{k}</dt>
                    <dd className="font-semibold text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="bg-bg border border-border rounded-2xl p-4">
              <h3 className="font-display font-extrabold text-[13.5px] mb-2.5">Progreso de las alumnas</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 rounded-full bg-border/60 overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${clase.avd}%` }} />
                </div>
                <b className="text-[12.5px] shrink-0">{clase.avd}%</b>
              </div>
              <p className="text-[11.5px] text-hint mb-3">Promedio del video que llegan a ver.</p>
              <dl className="space-y-2 text-[12.5px]">
                {([
                  ["La empezaron", num(clase.iniciaron)],
                  ["La terminaron", num(clase.completaron)],
                  ["Tasa de finalización", `${finalizacion}%`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-sub">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <button onClick={cambiarVisibilidad} disabled={guardando}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold text-sub hover:bg-bg transition disabled:opacity-50">
              {guardando ? "Guardando…" : visible ? "Ocultar de la plataforma" : "Mostrar en la plataforma"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

// El enlace del video no viaja en la tabla: se pide solo al abrir el detalle.
function VideoDeClase({ claseId }: { claseId: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/admin/video?clase=${encodeURIComponent(claseId)}`)
      .then((r) => (r.ok ? r.json() : { url: "" }))
      .then((j) => { if (vivo) setUrl(j.url || ""); })
      .catch(() => { if (vivo) setUrl(""); });
    return () => { vivo = false; };
  }, [claseId]);

  if (url === null) return <span className="text-white/60 text-[13px]">Cargando video…</span>;
  if (!url) return <span className="text-white/60 text-[13px]">No pudimos cargar el video.</span>;

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return yt ? (
    <iframe src={`https://www.youtube.com/embed/${yt[1]}`} title="Clase" allowFullScreen className="w-full h-full" />
  ) : (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video src={url} controls preload="metadata" className="w-full h-full" />
  );
}
