"use client";

import { useEffect, useRef, useState } from "react";
import {
  guardarClase, borrarClaseAdmin, recursosDeClase, subirRecurso, borrarRecurso,
  type ClaseAdmin, type MundoAdmin, type RecursoClase,
} from "@/lib/clases-admin-actions";

// Alta y edición de una clase, con su portada y sus recursos.
export function FormClase({
  clase, mundos, onCerrar, onGuardado,
}: {
  clase: ClaseAdmin | null;      // null = clase nueva
  mundos: MundoAdmin[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [titulo, setTitulo] = useState(clase?.titulo || "");
  const [moduloId, setModuloId] = useState(clase?.moduloId || mundos[0]?.id || "");
  const [instructor, setInstructor] = useState(clase?.instructor || "Melissa");
  const [rol, setRol] = useState(clase?.instructorRol || "");
  const [nivel, setNivel] = useState(clase?.nivel || "");
  const [duracion, setDuracion] = useState(String(clase?.duracionMin ?? ""));
  const [videoUrl, setVideoUrl] = useState("");
  const [portada, setPortada] = useState<string | null>(clase?.portada || null);
  const [portadaNueva, setPortadaNueva] = useState<string | null>(null);
  const [recursos, setRecursos] = useState<RecursoClase[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fotoRef = useRef<HTMLInputElement>(null);
  const archRef = useRef<HTMLInputElement>(null);

  const inputC = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";
  const nueva = !clase;

  useEffect(() => {
    if (clase) recursosDeClase(clase.id).then(setRecursos);
    if (clase?.tieneVideo) {
      fetch(`/api/admin/video?clase=${encodeURIComponent(clase.id)}`)
        .then((r) => (r.ok ? r.json() : { url: "" }))
        .then((j) => setVideoUrl(j.url || ""))
        .catch(() => {});
    }
  }, [clase]);

  function elegirPortada(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (fotoRef.current) fotoRef.current.value = "";
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("La portada pasa de 2 MB."); return; }
    const r = new FileReader();
    r.onload = () => { setPortadaNueva(r.result as string); setPortada(r.result as string); setError(""); };
    r.readAsDataURL(f);
  }

  async function agregarRecurso(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (archRef.current) archRef.current.value = "";
    if (!f || !clase) return;
    if (f.size > 25 * 1024 * 1024) { setError("El archivo pasa de 25 MB."); return; }
    setSubiendo(true); setError("");
    const dataUrl: string = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(f);
    });
    const out = await subirRecurso(clase.id, f.name, dataUrl);
    setSubiendo(false);
    if ("error" in out) { setError(out.error); return; }
    setRecursos(await recursosDeClase(clase.id));
    onGuardado();
  }

  async function quitarRecurso(id: string) {
    if (!clase) return;
    const r = await borrarRecurso(id);
    if ("error" in r) { setError(r.error); return; }
    setRecursos(await recursosDeClase(clase.id));
    onGuardado();
  }

  async function guardar(publicar: boolean) {
    setGuardando(true); setError("");
    const r = await guardarClase({
      id: clase?.id,
      titulo, moduloId, instructor, instructorRol: rol, nivel,
      duracionMin: Number(duracion) || 0,
      videoUrl,
      portadaDataUrl: portadaNueva || undefined,
      activo: publicar,
    });
    setGuardando(false);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
    onCerrar();
  }

  async function borrar() {
    if (!clase) return;
    if (!confirm(`¿Borrar la clase «${clase.titulo}»? No se puede deshacer.`)) return;
    const r = await borrarClaseAdmin(clase.id);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-[92] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[620px] shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-extrabold text-lg">
            {nueva ? "Nueva clase" : "Información de la clase"}
          </h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Portada */}
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
              <label className="text-[12.5px] font-bold text-sub">Mundo *</label>
              <select value={moduloId} onChange={(e) => setModuloId(e.target.value)} className={`${inputC} mt-1.5`}>
                {mundos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">Duración (min)</label>
              <input type="number" min={0} value={duracion} onChange={(e) => setDuracion(e.target.value)} className={`${inputC} mt-1.5`} />
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-sub">Enlace del video</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" className={`${inputC} mt-1.5`} />
            <p className="text-[11.5px] text-hint mt-1">Sin video, la clase queda como borrador y no se puede abrir.</p>
          </div>

          {/* Recursos */}
          <div>
            <label className="text-[12.5px] font-bold text-sub">Recursos descargables</label>
            {nueva ? (
              <p className="text-[12.5px] text-hint mt-1.5">Guarda la clase primero y luego le subes sus recursos.</p>
            ) : (
              <>
                <div className="space-y-2 mt-1.5">
                  {recursos.length === 0 && <p className="text-[12.5px] text-hint">Todavía no tiene recursos.</p>}
                  {recursos.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 bg-bg border border-border rounded-xl px-3 py-2">
                      <span className="text-[14px] shrink-0">📄</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold truncate">{r.titulo}</div>
                        <div className="text-[11px] text-hint">{r.tipo}{r.peso ? ` · ${r.peso}` : ""}</div>
                      </div>
                      <button onClick={() => quitarRecurso(r.id)} aria-label="Quitar"
                        className="text-sub hover:text-pink text-lg leading-none shrink-0">×</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => archRef.current?.click()} disabled={subiendo}
                  className="mt-2.5 text-[12.5px] font-bold text-accent bg-accent-soft rounded-xl px-3.5 py-2 hover:brightness-95 transition disabled:opacity-50">
                  {subiendo ? "Subiendo…" : "⬆ Subir recurso"}
                </button>
                <input ref={archRef} type="file" className="hidden" onChange={agregarRecurso} />
              </>
            )}
          </div>

          {error && <p className="text-[13px] text-pink">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 px-6 py-4 border-t border-border">
          {!nueva && (
            <button onClick={borrar} className="text-[13px] font-bold text-pink mr-auto">Borrar clase</button>
          )}
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
