"use client";

import { useRef, useState } from "react";
import { guardarVivo, borrarVivo, type ClaseVivoAdmin } from "@/lib/vivo-admin-actions";
import { ZONAS } from "@/lib/opciones-admin";

const inputC = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";

// Alta y edición de una clase en vivo, con su fecha y su enlace.
export function FormVivoClase({
  clase, mundos, onCerrar, onGuardado,
}: {
  clase: ClaseVivoAdmin | null;
  mundos: { id: string; nombre: string }[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const inicio = clase ? new Date(clase.iniciaAt) : null;
  const [titulo, setTitulo] = useState(clase?.titulo || "");
  const [descripcion, setDescripcion] = useState(clase?.descripcion || "");
  const [categoria, setCategoria] = useState(clase?.categoria || "");
  const [instructor, setInstructor] = useState(clase?.instructor || "Melissa");
  const [rol, setRol] = useState(clase?.instructorRol || "");
  const [nivel, setNivel] = useState(clase?.nivel || "");
  const [moduloId, setModuloId] = useState(clase?.moduloId || "");
  const [fecha, setFecha] = useState(inicio ? inicio.toISOString().slice(0, 10) : "");
  const [hora, setHora] = useState(inicio ? inicio.toTimeString().slice(0, 5) : "");
  const [duracion, setDuracion] = useState(String(clase?.duracionMin ?? 60));
  const [zona, setZona] = useState(clase?.zonaHoraria || "America/Mexico_City");
  const [streamUrl, setStreamUrl] = useState(clase?.streamUrl || "");
  const [grabacionUrl, setGrabacionUrl] = useState(clase?.grabacionUrl || "");
  const [xp, setXp] = useState(String(clase?.xp ?? 50));
  const [portada, setPortada] = useState<string | null>(clase?.portada || null);
  const [portadaNueva, setPortadaNueva] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fotoRef = useRef<HTMLInputElement>(null);
  const nueva = !clase;

  function elegirPortada(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (fotoRef.current) fotoRef.current.value = "";
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("La portada pasa de 2 MB."); return; }
    const r = new FileReader();
    r.onload = () => { setPortadaNueva(r.result as string); setPortada(r.result as string); setError(""); };
    r.readAsDataURL(f);
  }

  async function guardar(publicar: boolean) {
    setGuardando(true); setError("");
    const r = await guardarVivo({
      id: clase?.id, titulo, descripcion, categoria, instructor, instructorRol: rol,
      nivel, moduloId, fecha, hora, duracionMin: Number(duracion) || 60, zonaHoraria: zona,
      streamUrl, grabacionUrl, xp: Number(xp) || 50, activo: publicar,
      portadaDataUrl: portadaNueva || undefined,
    });
    setGuardando(false);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
    onCerrar();
  }

  async function borrar() {
    if (!clase) return;
    if (!confirm(`¿Borrar la clase «${clase.titulo}»? No se puede deshacer.`)) return;
    const r = await borrarVivo(clase.id);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-[92] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[620px] shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-extrabold text-lg">
            {nueva ? "Nueva clase en vivo" : "Información de la clase"}
          </h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12.5px] font-bold text-sub">Imagen de portada</label>
            <button type="button" onClick={() => fotoRef.current?.click()}
              className="w-full mt-1.5 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 transition overflow-hidden aspect-video grid place-items-center bg-bg">
              {portada ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portada} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-center px-4">
                  <span className="block text-[13.5px] font-bold text-accent">Subir imagen</span>
                  <span className="block text-[11.5px] text-hint mt-0.5">JPG, PNG o WEBP · máx. 2 MB</span>
                </span>
              )}
            </button>
            <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={elegirPortada} />
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-sub">Título de la clase *</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={100} className={`${inputC} mt-1.5`} />
            <div className="text-[11px] text-hint text-right mt-1">{titulo.length}/100</div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-sub">Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} maxLength={300}
              className={`${inputC} mt-1.5 resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12.5px] font-bold text-sub">Instructor</label>
              <input value={instructor} onChange={(e) => setInstructor(e.target.value)} className={`${inputC} mt-1.5`} />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">Profesión</label>
              <input value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Creadora de contenido" className={`${inputC} mt-1.5`} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[12.5px] font-bold text-sub">Nivel</label>
              <input value={nivel} onChange={(e) => setNivel(e.target.value)} placeholder="Starter" className={`${inputC} mt-1.5`} />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">Mundo</label>
              <select value={moduloId} onChange={(e) => setModuloId(e.target.value)} className={`${inputC} mt-1.5`}>
                <option value="">Sin mundo</option>
                {mundos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">Categoría</label>
              <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Instagram" className={`${inputC} mt-1.5`} />
            </div>
          </div>

          {/* Detalles de la clase */}
          <div className="pt-2 border-t border-border">
            <h3 className="font-display font-extrabold text-[15px] mb-3">Detalles de la clase</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12.5px] font-bold text-sub">Fecha *</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputC} mt-1.5`} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-sub">Hora *</label>
                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={`${inputC} mt-1.5`} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-sub">Duración estimada (min) *</label>
                <input type="number" min={5} value={duracion} onChange={(e) => setDuracion(e.target.value)} className={`${inputC} mt-1.5`} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-sub">Zona horaria *</label>
                <select value={zona} onChange={(e) => setZona(e.target.value)} className={`${inputC} mt-1.5`}>
                  {ZONAS.map((z) => <option key={z.id} value={z.id}>{z.texto}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[12.5px] font-bold text-sub">Enlace de la clase *</label>
              <input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="Ej. https://meet.google.com/abc-defg-hij" className={`${inputC} mt-1.5`} />
              <p className="text-[11.5px] text-hint mt-1">Añade el enlace donde se llevará a cabo la clase en vivo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[12.5px] font-bold text-sub">Enlace de la grabación</label>
                <input value={grabacionUrl} onChange={(e) => setGrabacionUrl(e.target.value)}
                  placeholder="Se pone después de la clase" className={`${inputC} mt-1.5`} />
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-sub">XP por asistir</label>
                <input type="number" min={0} value={xp} onChange={(e) => setXp(e.target.value)} className={`${inputC} mt-1.5`} />
              </div>
            </div>
          </div>

          {!nueva && clase && (
            <div className="bg-bg rounded-xl px-3.5 py-2.5 text-[12.5px] text-sub">
              {clase.asistentes} {clase.asistentes === 1 ? "persona asistió" : "personas asistieron"}
            </div>
          )}

          {error && <p className="text-[13px] text-pink">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 px-6 py-4 border-t border-border">
          {!nueva && <button onClick={borrar} className="text-[13px] font-bold text-pink mr-auto">Borrar clase</button>}
          <button onClick={() => guardar(false)} disabled={guardando || !titulo.trim()}
            className="rounded-xl border border-border px-4 py-2.5 text-[13.5px] font-bold text-sub hover:bg-bg transition disabled:opacity-50">
            Guardar borrador
          </button>
          <button onClick={() => guardar(true)} disabled={guardando || !titulo.trim()}
            className="rounded-xl bg-accent text-white px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {guardando ? "Guardando…" : "Publicar clase"}
          </button>
        </div>
      </div>
    </div>
  );
}
