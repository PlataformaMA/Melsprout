"use client";

import { useRef, useState } from "react";
import {
  guardarRetoRuta, guardarRetoComunidad, borrarRetoComunidad, TIPOS_RETO,
  type RetoRuta, type RetoComunidadAdmin,
} from "@/lib/retos-admin-actions";

const inputC = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";

// ————— Reto de una clase de la ruta —————
export function FormRetoRuta({ reto, onCerrar, onGuardado }: {
  reto: RetoRuta; onCerrar: () => void; onGuardado: () => void;
}) {
  const [texto, setTexto] = useState(reto.texto);
  const [instrucciones, setInstrucciones] = useState(reto.instrucciones);
  const [tipo, setTipo] = useState(reto.tipo);
  const [xp, setXp] = useState(String(reto.xp));
  const [activo, setActivo] = useState(reto.estado !== "oculto");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    setGuardando(true); setError("");
    const r = await guardarRetoRuta({
      claseId: reto.claseId, texto, instrucciones, tipo,
      xp: Number(xp) || 0, activo,
    });
    setGuardando(false);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-[92] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[560px] shadow-2xl my-6">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-lg leading-tight">Reto de la clase</h2>
            <p className="text-[12.5px] text-sub truncate">{reto.claseTitulo}</p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none shrink-0">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12.5px] font-bold text-sub">¿Qué se le pide? *</label>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={220}
              placeholder="Publica tu primer video con la estructura de la clase"
              className={`${inputC} mt-1.5 resize-none`} />
            <div className="text-[11px] text-hint text-right mt-1">{texto.length}/220</div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-sub">Instrucciones (opcional)</label>
            <textarea value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} rows={3} maxLength={600}
              placeholder="Explícale paso a paso lo que tiene que entregar…"
              className={`${inputC} mt-1.5 resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12.5px] font-bold text-sub">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${inputC} mt-1.5`}>
                {TIPOS_RETO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">Puntos (XP)</label>
              <input type="number" min={0} value={xp} onChange={(e) => setXp(e.target.value)} className={`${inputC} mt-1.5`} />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[13.5px] font-semibold cursor-pointer">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-accent w-4 h-4" />
            Visible para las alumnas
          </label>

          <div className="bg-bg rounded-xl px-3.5 py-2.5 text-[12.5px] text-sub">
            {reto.entregas} {reto.entregas === 1 ? "entrega" : "entregas"}
            {reto.porRevisar > 0 && <b className="text-pink"> · {reto.porRevisar} por revisar</b>}
          </div>

          {error && <p className="text-[13px] text-pink">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border">
          <button onClick={onCerrar} className="rounded-xl border border-border px-4 py-2.5 text-[13.5px] font-bold text-sub hover:bg-bg transition">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando || !texto.trim()}
            className="rounded-xl bg-accent text-white px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {guardando ? "Guardando…" : "Guardar reto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ————— Reto de la comunidad —————
export function FormRetoComunidad({ reto, onCerrar, onGuardado }: {
  reto: RetoComunidadAdmin | null; onCerrar: () => void; onGuardado: () => void;
}) {
  const [titulo, setTitulo] = useState(reto?.titulo || "");
  const [descripcion, setDescripcion] = useState(reto?.descripcion || "");
  const [emoji, setEmoji] = useState(reto?.emoji || "🎯");
  const [dias, setDias] = useState(String(reto?.dias ?? 7));
  const [xpDia, setXpDia] = useState(String(reto?.xpDia ?? 30));
  const [xpBonus, setXpBonus] = useState(String(reto?.xpBonus ?? 0));
  const [iniciaAt, setIniciaAt] = useState(reto?.iniciaAt ? reto.iniciaAt.slice(0, 16) : "");
  const [activo, setActivo] = useState(reto?.activo ?? true);
  const [portada, setPortada] = useState<string | null>(reto?.portada || null);
  const [portadaNueva, setPortadaNueva] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fotoRef = useRef<HTMLInputElement>(null);
  const nuevo = !reto;

  function elegirPortada(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (fotoRef.current) fotoRef.current.value = "";
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("La portada pasa de 2 MB."); return; }
    const r = new FileReader();
    r.onload = () => { setPortadaNueva(r.result as string); setPortada(r.result as string); setError(""); };
    r.readAsDataURL(f);
  }

  async function guardar() {
    setGuardando(true); setError("");
    const r = await guardarRetoComunidad({
      id: reto?.id, titulo, descripcion, emoji,
      dias: Number(dias) || 7, xpDia: Number(xpDia) || 0, xpBonus: Number(xpBonus) || 0,
      iniciaAt, activo, portadaDataUrl: portadaNueva || undefined,
    });
    setGuardando(false);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
    onCerrar();
  }

  async function borrar() {
    if (!reto) return;
    if (!confirm(`¿Borrar el reto «${reto.titulo}»? No se puede deshacer.`)) return;
    const r = await borrarRetoComunidad(reto.id);
    if ("error" in r) { setError(r.error); return; }
    onGuardado();
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-[92] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[560px] shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-extrabold text-lg">
            {nuevo ? "Nuevo reto de comunidad" : "Ajustes del reto"}
          </h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12.5px] font-bold text-sub">Portada</label>
            <button type="button" onClick={() => fotoRef.current?.click()}
              className="w-full mt-1.5 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 transition overflow-hidden aspect-[16/9] grid place-items-center bg-bg">
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

          <div className="grid grid-cols-[70px_1fr] gap-3">
            <div>
              <label className="text-[12.5px] font-bold text-sub">Emoji</label>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2}
                className={`${inputC} mt-1.5 text-center text-lg`} />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">Título *</label>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} className={`${inputC} mt-1.5`} />
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-sub">Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} maxLength={400}
              className={`${inputC} mt-1.5 resize-none`} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12.5px] font-bold text-sub">Días</label>
              <input type="number" min={1} value={dias} onChange={(e) => setDias(e.target.value)} className={`${inputC} mt-1.5`} />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">XP por día</label>
              <input type="number" min={0} value={xpDia} onChange={(e) => setXpDia(e.target.value)} className={`${inputC} mt-1.5`} />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-sub">XP bonus</label>
              <input type="number" min={0} value={xpBonus} onChange={(e) => setXpBonus(e.target.value)} className={`${inputC} mt-1.5`} />
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-sub">Fecha de inicio</label>
            <input type="datetime-local" value={iniciaAt} onChange={(e) => setIniciaAt(e.target.value)} className={`${inputC} mt-1.5`} />
            <p className="text-[11.5px] text-hint mt-1">Desde esa fecha empieza a correr la cuenta de días.</p>
          </div>

          <label className="flex items-center gap-2.5 text-[13.5px] font-semibold cursor-pointer">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-accent w-4 h-4" />
            Visible en la comunidad
          </label>

          {!nuevo && (
            <div className="bg-bg rounded-xl px-3.5 py-2.5 text-[12.5px] text-sub">
              {reto.inscritos} {reto.inscritos === 1 ? "persona inscrita" : "personas inscritas"}
            </div>
          )}

          {error && <p className="text-[13px] text-pink">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 px-6 py-4 border-t border-border">
          {!nuevo && <button onClick={borrar} className="text-[13px] font-bold text-pink mr-auto">Borrar reto</button>}
          <button onClick={onCerrar} className="rounded-xl border border-border px-4 py-2.5 text-[13.5px] font-bold text-sub hover:bg-bg transition">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando || !titulo.trim()}
            className="rounded-xl bg-accent text-white px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {guardando ? "Guardando…" : nuevo ? "Crear reto" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
