"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { createClient } from "@/lib/supabase/client";
import type { RetoDef, PasoReto } from "@/lib/retos";
import { guardarReto, subirImagenReto, type RetoGuardado } from "@/lib/retos-actions";

type Perfil = { full_name: string | null; avatar_url: string | null; racha: number; gemas: number };

// Convierte un archivo de imagen a dataURL (sin recortar).
function imagenADataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

export function RetoVista({
  reto,
  perfil,
  guardado,
  siguienteHref = "/app/ruta",
}: {
  reto: RetoDef;
  perfil: Perfil;
  guardado: RetoGuardado;
  siguienteHref?: string;
}) {
  const router = useRouter();
  const [resp, setResp] = useState<Record<string, string>>(guardado?.respuestas || {});
  const [archivoUrl, setArchivoUrl] = useState<string | null>(guardado?.archivo_url ?? null);
  const [videoNombre, setVideoNombre] = useState<string>("");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState<"borrador" | "publicado" | null>(null);
  const [modal, setModal] = useState<"guardado" | "publicado" | "enviado" | "rechazado" | null>(
    guardado?.revision === "rechazado" ? "rechazado" : null
  );
  const [error, setError] = useState("");
  const [paso, setPaso] = useState(0);
  const [reintentar, setReintentar] = useState(false);

  // Estado del envío: si ya se publicó, mostramos su estado y NO dejamos re-contestar
  // (salvo que esté "rechazado" → puede volver a intentar).
  const enviado = guardado?.estado === "publicado";
  const revision = guardado?.revision ?? null;
  const mostrarEstado = enviado && !reintentar;
  const cerrarModal = () => { setModal(null); router.refresh(); };

  const total = reto.pasos.length;
  const esUltimo = paso >= total - 1;
  const pasoActual = reto.pasos[paso];

  const set = (id: string, v: string) => setResp((p) => ({ ...p, [id]: v }));

  async function subirArchivo(paso: PasoReto, file: File) {
    setError("");
    if (paso.archivoImagen) {
      setSubiendo(true);
      try {
        const dataUrl = await imagenADataUrl(file);
        const r = await subirImagenReto(reto.claseId, dataUrl);
        if ("error" in r) setError(r.error);
        else setArchivoUrl(r.url);
      } catch {
        setError("No se pudo procesar la imagen.");
      }
      setSubiendo(false);
    } else {
      // Video: se sube de verdad al almacenamiento (bucket "retos").
      const mb = file.size / (1024 * 1024);
      if (mb > 50) {
        setError(`El video pesa ${mb.toFixed(0)} MB. El máximo es 50 MB (graba un clip más corto o baja la calidad).`);
        return;
      }
      setSubiendo(true);
      try {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
        const path = `${reto.claseId}/${paso.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("retos").upload(path, file, { upsert: true });
        if (upErr) {
          setError("No se pudo subir el video. Intenta de nuevo.");
        } else {
          const { data } = supabase.storage.from("retos").getPublicUrl(path);
          setArchivoUrl(data.publicUrl);
          setVideoNombre(`${file.name} · ${mb.toFixed(1)} MB ✓`);
          set(paso.id, data.publicUrl);
        }
      } catch {
        setError("No se pudo subir el video.");
      }
      setSubiendo(false);
    }
  }

  async function guardar(estado: "borrador" | "publicado") {
    setError("");
    // Al PUBLICAR, exigir que todos los pasos estén completos (no publicar vacío).
    if (estado === "publicado") {
      const faltan = reto.pasos.filter((p) => {
        if (p.tipo === "archivo") return !archivoUrl && !videoNombre;
        return !(resp[p.id] || "").trim();
      });
      if (faltan.length > 0) {
        // Lleva al primer paso incompleto y avisa.
        const idxFalta = reto.pasos.findIndex((p) => p.id === faltan[0].id);
        if (idxFalta >= 0) setPaso(idxFalta);
        setError(`Completa todos los pasos antes de publicar (te falta: “${faltan[0].titulo}”).`);
        return;
      }
    }
    setGuardando(estado);
    const revisa = reto.revisa ?? "equipo";
    const r = await guardarReto(reto.claseId, resp, estado, archivoUrl, reto.xp, revisa);
    setGuardando(null);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    // Borrador → "guardado"; publicar 'sola' → "publicado" (comunidad); 'equipo' → "enviado" (revisión 48h).
    // El refresh se hace al CERRAR el popup (si no, borra el popup antes de verlo).
    setModal(estado === "borrador" ? "guardado" : revisa === "sola" ? "publicado" : "enviado");
  }

  const nombre = perfil.full_name || "Creador";

  return (
    <div className="min-h-screen bg-bg flex">
      <style>{`
        @keyframes octiBob { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-7px) } }
        @keyframes octiPop { 0%{ transform: scale(.82) rotate(-4deg) } 60%{ transform: scale(1.06) } 100%{ transform: scale(1) } }
        .octi-bob { animation: octiBob 3s ease-in-out infinite; }
        .octi-pop { animation: octiPop .45s cubic-bezier(.34,1.56,.64,1), octiBob 3s ease-in-out .45s infinite; }
      `}</style>
      <AppSidebar active="retos" />

      <div className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5">
          {/* Barra superior */}
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <Counter icon="🔥" valor={perfil.racha} />
            <Counter icon="💎" valor={perfil.gemas} />
            <CampanaNotificaciones />
            <button className="hidden" aria-hidden>
              <BellIcon />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            </button>
            <UserMenu avatarUrl={perfil.avatar_url} nombre={nombre} />
          </header>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] mb-4">
            <Link href="/app/retos" className="text-accent font-semibold hover:underline">{reto.modulo}</Link>
            <span className="text-hint">›</span>
            <span className="text-sub">Reto</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            {/* ——— Columna principal (flujo paso a paso) ——— */}
            <div className="max-w-[620px]">
              <div>
                <h1 className="font-display text-2xl sm:text-[26px] font-extrabold leading-tight">
                  {reto.titulo} <span>{reto.emoji}</span>
                </h1>
                <p className="text-sub mt-1.5 text-[14px]">{reto.descripcion}</p>
              </div>

              {/* Instrucciones: qué se espera y cómo se evalúa. Sin esto las
                  respuestas salen ambiguas — para el alumno y para quien revisa. */}
              {reto.instrucciones && <Instrucciones texto={reto.instrucciones} />}

              {/* Octi ARRIBA (banner): guía + recompensa (móvil y desktop) */}
              <div className="mt-5 rounded-3xl p-4 sm:p-5 border border-accent/15 shadow-sm relative overflow-hidden" style={{ background: "linear-gradient(160deg,#F3F0FF,#FBFAFF)" }}>
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={esUltimo ? "fin" : paso} src="/octi.png" alt="Octi" className="octi-pop shrink-0 w-16 sm:w-24" />
                  <div className="relative flex-1 bg-white text-accent text-[13px] sm:text-[14px] font-semibold rounded-2xl px-4 py-3 leading-snug shadow-sm">
                    {mostrarEstado
                      ? "¡Ya enviaste este reto! Aquí abajo ves en qué estado va. 💜"
                      : esUltimo
                      ? "¡Vas increíble! Revisa tu último paso y publícalo. Estoy súper orgulloso de ti 🎉"
                      : pasoActual.octi || "Tú puedes con esto. Un paso a la vez. 💜"}
                    <span className="absolute -left-1.5 top-5 w-3 h-3 bg-white rotate-45" />
                  </div>
                </div>
                {!mostrarEstado && (
                  <div className="flex items-center justify-end gap-2.5 mt-3">
                    <span className="text-[11.5px] sm:text-[12.5px] font-bold text-accent text-right">Al completarlo y publicarlo en la comunidad ganarás:</span>
                    <span className="flex items-center gap-1.5 bg-accent text-white text-[13px] font-extrabold rounded-full pl-1.5 pr-3 py-1 shrink-0">
                      <span className="w-6 h-6 rounded-full bg-white/25 grid place-items-center text-[13px]">⭐</span>+{reto.xp} XP
                    </span>
                  </div>
                )}
              </div>

              {mostrarEstado ? (
                <EstadoReto revision={revision} respuestas={resp} pasos={reto.pasos} archivoUrl={archivoUrl} xp={reto.xp} onReintentar={() => setReintentar(true)} />
              ) : (
              <>
              {/* Progreso del flujo */}
              <div className="mt-6 mb-5">
                <div className="flex items-center justify-between text-[12px] mb-2">
                  <span className="font-bold text-accent">Paso {paso + 1} de {total}</span>
                  <span className="text-hint">{Math.round(((paso + 1) / total) * 100)}%</span>
                </div>
                <div className="flex gap-1.5">
                  {reto.pasos.map((_, i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#EEEBF6]">
                      <div className={`h-full rounded-full transition-all ${i <= paso ? "bg-accent" : ""}`} style={{ width: i <= paso ? "100%" : "0%" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarjeta del paso actual (una a la vez, con aire) */}
              <div className="bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-8 h-8 rounded-full bg-accent text-white grid place-items-center text-[14px] font-bold shrink-0">{paso + 1}</span>
                  <h3 className="font-display font-extrabold text-lg">{pasoActual.titulo}</h3>
                </div>
                {pasoActual.subtitulo && <p className="text-[13.5px] text-sub leading-relaxed mb-5 pl-11">{pasoActual.subtitulo}</p>}

                <div className={pasoActual.subtitulo ? "" : "mt-4"}>
                  {pasoActual.tipo === "archivo" ? (
                    <FileField paso={pasoActual} archivoUrl={archivoUrl} videoNombre={videoNombre} subiendo={subiendo} onFile={(f) => subirArchivo(pasoActual, f)} />
                  ) : pasoActual.tipo === "texto" ? (
                    <div>
                      <input
                        type="text"
                        maxLength={pasoActual.max}
                        value={resp[pasoActual.id] || ""}
                        onChange={(e) => set(pasoActual.id, e.target.value)}
                        placeholder={pasoActual.placeholder}
                        className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-[14px] outline-none focus:border-accent"
                      />
                      {pasoActual.max && <div className="text-right text-[12px] text-hint mt-1.5">{(resp[pasoActual.id] || "").length}/{pasoActual.max}</div>}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        maxLength={pasoActual.max}
                        rows={5}
                        value={resp[pasoActual.id] || ""}
                        onChange={(e) => set(pasoActual.id, e.target.value)}
                        placeholder={pasoActual.placeholder}
                        className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-[14px] outline-none focus:border-accent resize-none"
                      />
                      {pasoActual.max && <div className="text-right text-[12px] text-hint mt-1.5">{(resp[pasoActual.id] || "").length}/{pasoActual.max}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* Tips (discretos, debajo del paso) */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 px-1">
                <span className="text-[12px] font-bold text-accent">💡 {reto.tips.titulo}</span>
                {reto.tips.items.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-[12.5px] text-sub">
                    <CheckCircle /> {t}
                  </span>
                ))}
              </div>

              {error && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-4">{error}</p>}

              {/* Navegación del flujo */}
              <div className="flex items-center justify-between gap-3 mt-7">
                <button
                  onClick={() => setPaso((p) => Math.max(0, p - 1))}
                  disabled={paso === 0}
                  className="flex items-center gap-2 text-[14px] font-semibold text-sub rounded-xl px-4 py-3 hover:bg-surface disabled:opacity-0 transition"
                >
                  ‹ Anterior
                </button>

                {!esUltimo ? (
                  <button
                    onClick={() => setPaso((p) => Math.min(total - 1, p + 1))}
                    className="flex items-center gap-2 bg-accent text-white rounded-xl px-7 py-3 text-[14px] font-bold hover:brightness-110 transition shadow-sm"
                  >
                    Siguiente ›
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => guardar("borrador")}
                      disabled={guardando !== null}
                      className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 text-[14px] font-semibold hover:bg-bg disabled:opacity-60 transition"
                    >
                      <BookmarkIcon /> {guardando === "borrador" ? "Guardando…" : "Borrador"}
                    </button>
                    <button
                      onClick={() => guardar("publicado")}
                      disabled={guardando !== null}
                      className="flex items-center gap-2 bg-accent text-white rounded-xl px-5 py-3 text-[14px] font-bold hover:brightness-110 disabled:opacity-60 transition shadow-sm"
                    >
                      <UploadIcon /> {guardando === "publicado" ? "Publicando…" : "Publicar"}
                    </button>
                  </div>
                )}
              </div>
              </>
              )}
            </div>

            {/* ——— Columna derecha ——— */}
            <aside className="space-y-5 lg:sticky lg:top-5 self-start">
              {/* Sobre este reto */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FlagIcon />
                  <h2 className="font-display font-extrabold">Sobre este reto</h2>
                </div>
                <div className="space-y-3">
                  {reto.sobre.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13px] text-sub">
                      <span className="text-hint shrink-0 mt-0.5"><MiniDot /></span>
                      <span>{b}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[13px] text-accent font-bold pt-1">
                    <GemIcon /> Recompensa: +{reto.xp} XP
                  </div>
                </div>
              </section>

              {/* Ejemplo de publicación */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <h2 className="font-display font-extrabold mb-4">{reto.ejemplo.tituloCard}</h2>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[13px] font-bold">VL</span>
                  <div>
                    <div className="font-bold text-[14px] leading-tight">{reto.ejemplo.autor}</div>
                    <div className="text-[12px] text-sub">{reto.ejemplo.rol}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {reto.ejemplo.bloques.map((bl, i) => (
                    <div key={i}>
                      <div className="text-accent font-bold text-[14px]">{bl.titulo}</div>
                      {bl.texto && <p className="text-[13px] text-sub mt-0.5 leading-relaxed">{bl.texto}</p>}
                      {bl.video && (
                        <div className="mt-2 rounded-xl overflow-hidden bg-gradient-to-br from-[#E9D8FD] to-[#F3E8FF] aspect-video grid place-items-center relative">
                          <span className="w-12 h-12 rounded-full bg-white/90 grid place-items-center text-accent text-xl shadow">▶</span>
                          <span className="absolute top-2 right-2 bg-black/60 text-white text-[11px] rounded px-1.5 py-0.5">0:26</span>
                        </div>
                      )}
                      {bl.imagen && (
                        <div className="mt-2 rounded-xl bg-[#1f2937] text-white/90 p-3 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-white/20" />
                            <div className="flex gap-3 text-center">
                              <div><div className="font-bold">342</div><div className="opacity-70">Publicaciones</div></div>
                              <div><div className="font-bold">12.8K</div><div className="opacity-70">Seguidores</div></div>
                              <div><div className="font-bold">1,024</div><div className="opacity-70">Seguidos</div></div>
                            </div>
                          </div>
                          <div className="mt-2 font-semibold">Melissa Arria | Marketing para Creadores</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border text-[13px] text-sub">
                  <span className="flex items-center gap-1.5"><HeartOutline /> 128</span>
                  <span className="flex items-center gap-1.5"><ChatIcon /> 32</span>
                  <span className="flex items-center gap-1.5 ml-auto"><BookmarkIcon /> Guardar</span>
                </div>
              </section>

              {/* Consejo de hoy */}
              <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-accent">💡</span>
                  <h2 className="font-display font-extrabold">Consejo de hoy</h2>
                </div>
                <p className="text-[13px] text-sub leading-relaxed">{reto.consejo}</p>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Modales de estado del reto (guardado / publicado / enviado / rechazado) */}
      {modal && (() => {
        const info = {
          guardado: { titulo: "¡Reto guardado! 🎉", sub: "Tu avance se guardó. Puedes completarlo más tarde." },
          publicado: { titulo: "¡Reto Publicado! 🎉", sub: "Tu reto fue publicado en la comunidad. ¡Bien hecho!" },
          enviado: { titulo: "¡Reto Enviado! 🎉", sub: "Tu reto fue enviado correctamente. Ahora nuestro equipo lo revisará. Tiempo estimado: 48 horas." },
          rechazado: { titulo: "¡Reto Rechazado!", sub: "Casi lo logras. Solo necesitas mejorar algunos puntos. Comentarios del equipo:" },
        }[modal];
        const rechazado = modal === "rechazado";
        return (
          <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={cerrarModal}>
            <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={cerrarModal} className="absolute top-4 right-4 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/octi.png" alt="Octi" width={124} height={124} className={`mx-auto octi-pop ${rechazado ? "grayscale opacity-90" : ""}`} />
              <h3 className={`font-display text-2xl font-extrabold mt-2 ${rechazado ? "text-pink" : ""}`}>{info.titulo}</h3>
              <p className="text-sub text-[14px] mt-1.5 leading-relaxed">{info.sub}</p>

              {rechazado && (
                <div className="mt-3 bg-bg border border-border rounded-xl px-4 py-3 text-[13px] text-sub text-left whitespace-pre-wrap">
                  {guardado?.revision_comentario || "Tu equipo dejará aquí sus comentarios. Ajusta lo necesario y vuelve a intentarlo. 💜"}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-6">
                {rechazado ? (
                  <button onClick={() => { setModal(null); setReintentar(true); }} className="flex items-center justify-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 text-[14px] font-semibold hover:bg-bg transition">
                    <MapMini /> Volver a intentar
                  </button>
                ) : (
                  <Link href="/app/ruta" className="flex items-center justify-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 text-[14px] font-semibold hover:bg-bg transition">
                    <MapMini /> Volver al camino
                  </Link>
                )}
                <Link href={siguienteHref} className="flex items-center justify-center gap-2 bg-accent text-white rounded-xl px-4 py-3 text-[14px] font-bold hover:brightness-110 transition">
                  Ver siguiente clase ›
                </Link>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ————————————— Subcomponentes —————————————
// Muestra el ESTADO de un reto ya enviado (enviado/en revisión, aprobado, rechazado)
// en vez del formulario, para que no se vuelva a contestar.
function EstadoReto({
  revision, respuestas, pasos, archivoUrl, xp, onReintentar,
}: {
  revision: "aprobado" | "rechazado" | null;
  respuestas: Record<string, string>;
  pasos: PasoReto[];
  archivoUrl: string | null;
  xp: number;
  onReintentar: () => void;
}) {
  const info =
    revision === "aprobado"
      ? { emoji: "✅", titulo: "¡Reto aprobado!", sub: `Ganaste +${xp} XP. ¡Excelente trabajo!`, clase: "bg-green-soft border-green/30 text-green" }
      : revision === "rechazado"
      ? { emoji: "✕", titulo: "Reto rechazado", sub: "Revisa lo enviado y vuelve a intentarlo. ¡Tú puedes!", clase: "bg-pink-soft border-pink/30 text-pink" }
      : { emoji: "⏳", titulo: "Enviado · En revisión", sub: "El equipo lo revisará en las próximas 48h. Te avisaremos. 💜", clase: "bg-accent-soft border-accent/30 text-accent" };

  return (
    <div className="mt-6">
      <div className={`rounded-2xl border p-5 ${info.clase}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0">{info.emoji}</span>
          <div>
            <div className="font-display font-extrabold text-lg leading-tight">{info.titulo}</div>
            <div className="text-[13px] opacity-90 mt-0.5">{info.sub}</div>
          </div>
        </div>
      </div>

      {/* Lo que enviaste (solo lectura) */}
      <div className="mt-5 bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-extrabold text-[15px]">Tu respuesta enviada</h3>
        {pasos.map((p) => (
          <div key={p.id}>
            <div className="text-[13px] font-bold text-text">{p.titulo}</div>
            {p.tipo === "archivo" ? (
              archivoUrl ? (
                <a href={archivoUrl} target="_blank" rel="noreferrer" className="text-[13px] text-accent font-semibold hover:underline">Ver archivo subido ↗</a>
              ) : (
                <span className="text-[13px] text-hint">Sin archivo</span>
              )
            ) : (
              <p className="text-[13px] text-sub whitespace-pre-wrap leading-relaxed">{respuestas[p.id] || "—"}</p>
            )}
          </div>
        ))}
      </div>

      {revision === "rechazado" && (
        <button onClick={onReintentar} className="mt-5 flex items-center gap-2 bg-accent text-white rounded-xl px-5 py-3 text-[14px] font-bold hover:brightness-110 transition shadow-sm">
          <UploadIcon /> Volver a intentar
        </button>
      )}
    </div>
  );
}

function FileField({ paso, archivoUrl, videoNombre, subiendo, onFile }: {
  paso: PasoReto; archivoUrl: string | null; videoNombre: string; subiendo: boolean; onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tieneImagen = paso.archivoImagen && archivoUrl;
  const tieneVideo = !paso.archivoImagen && videoNombre;

  return (
    <div>
      <input ref={inputRef} type="file" accept={paso.acepta} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {tieneImagen ? (
        <div className="flex items-center gap-3 border border-border rounded-xl p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={archivoUrl!} alt="captura" className="w-20 h-20 rounded-lg object-cover" />
          <div className="flex-1 text-[13px] text-sub">Captura subida ✓</div>
          <button onClick={() => inputRef.current?.click()} className="text-[13px] text-accent font-semibold">Cambiar</button>
        </div>
      ) : tieneVideo ? (
        <div className="flex items-center gap-3 border border-border rounded-xl p-3">
          <span className="w-12 h-12 rounded-lg bg-accent/10 text-accent grid place-items-center">🎬</span>
          <div className="flex-1 text-[13px] text-sub truncate">{videoNombre}</div>
          <button onClick={() => inputRef.current?.click()} className="text-[13px] text-accent font-semibold">Cambiar</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={subiendo}
          className="w-full border border-dashed border-accent/40 bg-accent-soft/40 rounded-xl p-5 flex items-center gap-3 hover:bg-accent-soft transition disabled:opacity-60">
          <span className="w-11 h-11 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0"><UploadIcon /></span>
          <div className="text-left">
            <div className="font-bold text-[14px]">{subiendo ? "Subiendo…" : "Sube tu archivo aquí"}</div>
            {paso.ayudaArchivo && <div className="text-[12px] text-sub">{paso.ayudaArchivo}</div>}
          </div>
        </button>
      )}
    </div>
  );
}

function Counter({ icon, valor }: { icon: string; valor: number }) {
  return (
    <span className="flex items-center gap-1.5 text-[14px] font-bold">
      <span>{icon}</span>
      <span>{valor}</span>
    </span>
  );
}

// ————————————— Iconos —————————————
// Las instrucciones se guardan como texto plano; aquí las volvemos una lista
// compacta. Volcarlas tal cual ocupaba media pantalla y nadie las leía.
function parsearInstrucciones(texto: string) {
  const [cuerpo, ...resto] = texto.split(/^[─-]{5,}$/m);
  const nota = resto.join("\n").trim();
  const lineas = cuerpo.trim().split("\n");

  const intro: string[] = [];
  const puntos: { n: string; titulo: string; desc: string[] }[] = [];
  for (const l of lineas) {
    const m = l.match(/^\s*(\d+)\.\s*(.+)$/);
    if (m) puntos.push({ n: m[1], titulo: m[2].trim(), desc: [] });
    else if (puntos.length) { if (l.trim()) puntos[puntos.length - 1].desc.push(l.trim()); }
    else if (l.trim()) intro.push(l.trim());
  }
  return { intro: intro.join(" "), puntos, nota };
}

function Instrucciones({ texto }: { texto: string }) {
  const { intro, puntos, nota } = parsearInstrucciones(texto);
  return (
    <section className="mt-5 rounded-2xl border border-blue/25 bg-blue/[0.05] px-4 py-3.5 sm:px-5 sm:py-4">
      <h2 className="flex items-center gap-2 font-display font-extrabold text-[14px] text-blue">
        📋 Qué se espera de ti
      </h2>

      {intro && <p className="text-[13px] text-sub leading-snug mt-1.5">{intro}</p>}

      {puntos.length > 0 && (
        <ol className="mt-3 grid sm:grid-cols-2 gap-x-5 gap-y-2">
          {puntos.map((p) => (
            <li key={p.n} className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue/15 text-blue grid place-items-center text-[11px] font-extrabold mt-0.5">
                {p.n}
              </span>
              <p className="text-[13px] leading-snug min-w-0">
                <b className="text-text">{p.titulo}.</b>{" "}
                <span className="text-sub">{p.desc.join(" ")}</span>
              </p>
            </li>
          ))}
        </ol>
      )}

      {nota && (
        <p className="text-[12px] text-hint leading-snug mt-3 pt-2.5 border-t border-blue/15">
          {nota.replace(/\s*\n\s*/g, " ")}
        </p>
      )}
    </section>
  );
}

function BellIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" /></svg>; }
function HeartOutline() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>; }
function CheckCircle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>; }
function FlagIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4M4 4h13l-2 4 2 4H4" /></svg>; }
function MiniDot() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" strokeLinecap="round" /></svg>; }
function GemIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="#7c3aed"><path d="M6 3h12l3 5-9 13L3 8z" /></svg>; }
function ChatIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" /></svg>; }
function BookmarkIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4z" /></svg>; }
function UploadIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>; }
function MapMini() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>; }
