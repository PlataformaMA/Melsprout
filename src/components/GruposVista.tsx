"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { proponerGrupo, apoyarGrupo, alternarMembresia, type Grupo } from "@/lib/grupos-actions";

const META = 10;   // debe coincidir con META_APOYOS del servidor

export function GruposVista({ propuestas, mios, otros }: { propuestas: Grupo[]; mios: Grupo[]; otros: Grupo[] }) {
  const router = useRouter();
  const [abrirModal, setAbrirModal] = useState(false);
  const [busca, setBusca] = useState("");

  const filtra = (lista: Grupo[]) =>
    !busca.trim() ? lista : lista.filter((g) => g.nombre.toLowerCase().includes(busca.trim().toLowerCase()));

  const props = filtra(propuestas), tus = filtra(mios), mas = filtra(otros);
  const vacio = !props.length && !tus.length && !mas.length;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <button onClick={() => setAbrirModal(true)}
          className="flex items-center justify-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:border-accent/40 transition shrink-0">
          <span className="text-accent text-lg leading-none">+</span> Proponer un grupo
        </button>
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar grupos o solicitudes…"
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-[13.5px] outline-none focus:border-accent transition" />
      </div>

      {vacio && (
        <div className="bg-surface border border-border rounded-3xl p-8 sm:p-10 text-center shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octi.png" alt="" className="w-20 sm:w-24 mx-auto" />
          <h3 className="font-display font-extrabold text-lg mt-3">
            {busca ? "Nada con ese nombre" : "Todavía no hay grupos"}
          </h3>
          <p className="text-sub text-[13.5px] mt-2 max-w-sm mx-auto leading-snug">
            {busca ? "Prueba con otra palabra." : "Propón el primero: si junta los apoyos suficientes, se crea y quienes lo apoyaron entran contigo."}
          </p>
        </div>
      )}

      {props.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display font-extrabold text-lg">Solicitudes de grupos</h2>
          <p className="text-[13px] text-sub mb-3">Apoya las ideas que te gustaría ver en la comunidad.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {props.map((g) => <TarjetaPropuesta key={g.id} grupo={g} onCambio={() => router.refresh()} />)}
          </div>
        </section>
      )}

      {tus.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display font-extrabold text-lg">Tus grupos</h2>
          <p className="text-[13px] text-sub mb-3">Comunidades a las que perteneces.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tus.map((g) => <TarjetaGrupo key={g.id} grupo={g} />)}
          </div>
        </section>
      )}

      {mas.length > 0 && (
        <section>
          <h2 className="font-display font-extrabold text-lg">Más grupos</h2>
          <p className="text-[13px] text-sub mb-3">Descubre comunidades y únete.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mas.map((g) => <TarjetaGrupo key={g.id} grupo={g} conBotonUnirse />)}
          </div>
        </section>
      )}

      {abrirModal && <ModalProponer onCerrar={() => setAbrirModal(false)} onCreado={() => { setAbrirModal(false); router.refresh(); }} />}
    </>
  );
}

// ————— Propuesta con su barra de apoyos —————
function TarjetaPropuesta({ grupo, onCambio }: { grupo: Grupo; onCambio: () => void }) {
  const [apoyos, setApoyos] = useState(grupo.apoyos);
  const [yoApoye, setYoApoye] = useState(grupo.yoApoye);
  const [pendiente, startTransition] = useTransition();
  const pct = Math.min(100, Math.round((apoyos / grupo.meta) * 100));

  function apoyar() {
    const antes = { apoyos, yoApoye };
    setYoApoye(!yoApoye);
    setApoyos((n) => n + (yoApoye ? -1 : 1));
    startTransition(async () => {
      const r = await apoyarGrupo(grupo.id);
      if ("error" in r) { setApoyos(antes.apoyos); setYoApoye(antes.yoApoye); alert(r.error); return; }
      setApoyos(r.apoyos); setYoApoye(r.yoApoye);
      if (r.activado) onCambio();
    });
  }

  return (
    <article className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-accent-soft grid place-items-center text-xl shrink-0">{grupo.emoji}</span>
        <div className="min-w-0">
          <h3 className="font-display font-extrabold text-[14.5px] leading-tight">{grupo.nombre}</h3>
          <p className="text-[12.5px] text-sub leading-snug mt-1 line-clamp-2">{grupo.descripcion}</p>
        </div>
      </div>

      {grupo.proponente && (
        <div className="flex items-center gap-2 mt-3">
          {grupo.proponente.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={grupo.proponente.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-accent-soft text-accent grid place-items-center text-[9px] font-bold">
              {grupo.proponente.nombre.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="text-[11.5px] text-sub truncate">
            Propuesto por <b className="text-text">{grupo.proponente.nombre}</b> · Nivel {grupo.proponente.nivel}
          </span>
        </div>
      )}

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-[11.5px] font-semibold text-sub mb-1.5">
          <span>👥 {apoyos} / {grupo.meta} apoyos</span>
          <span className="text-accent">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#EEEBF6] overflow-hidden mb-3">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={apoyar} disabled={pendiente}
          className={`w-full rounded-xl py-2 text-[13px] font-bold transition disabled:opacity-60 ${
            yoApoye ? "bg-accent-soft text-accent" : "bg-accent text-white hover:brightness-110"
          }`}>
          {yoApoye ? "✓ Ya lo apoyaste" : "👍 Apoyar"}
        </button>
      </div>
    </article>
  );
}

// ————— Grupo ya activo —————
function TarjetaGrupo({ grupo, conBotonUnirse }: { grupo: Grupo; conBotonUnirse?: boolean }) {
  const router = useRouter();
  const [soyMiembro, setSoyMiembro] = useState(grupo.soyMiembro);
  const [miembros, setMiembros] = useState(grupo.miembros);
  const [pendiente, startTransition] = useTransition();

  function unirse(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await alternarMembresia(grupo.id);
      if ("error" in r) { alert(r.error); return; }
      setSoyMiembro(r.soyMiembro); setMiembros(r.miembros);
      router.refresh();
    });
  }

  return (
    <Link href={`/app/comunidad/grupo/${grupo.id}`}
      className="group block bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:border-accent/30 hover:shadow-md transition">
      <div className="relative aspect-[16/7] grid place-items-center"
        style={{ background: "linear-gradient(120deg,#7C3AED,#4F46E5 60%,#2563EB)" }}>
        {grupo.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={grupo.portada} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-80">{grupo.emoji}</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-extrabold text-[15px] leading-tight">{grupo.nombre}</h3>
        <p className="text-[13px] text-sub mt-1 line-clamp-2 leading-snug">{grupo.descripcion}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[12.5px] font-semibold text-sub">👥 {miembros} miembros</span>
          {conBotonUnirse && (
            <button onClick={unirse} disabled={pendiente}
              className={`ml-auto rounded-xl px-3.5 py-1.5 text-[12.5px] font-bold transition disabled:opacity-60 ${
                soyMiembro ? "bg-accent-soft text-accent" : "border border-accent/40 text-accent hover:bg-accent-soft"
              }`}>
              {soyMiembro ? "✓ Eres miembro" : "Unirme"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ————— Modal: proponer un grupo —————
function ModalProponer({ onCerrar, onCreado }: { onCerrar: () => void; onCreado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [portada, setPortada] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();

  async function subir(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no debe pasar de 5 MB."); return; }
    setSubiendo(true); setError("");
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const ruta = `grupos/${Date.now()}.${ext}`;
      const { error: e } = await supabase.storage.from("retos").upload(ruta, file, { upsert: true });
      if (e) setError("No se pudo subir la imagen.");
      else setPortada(supabase.storage.from("retos").getPublicUrl(ruta).data.publicUrl);
    } finally { setSubiendo(false); }
  }

  function crear() {
    setError("");
    startTransition(async () => {
      const r = await proponerGrupo({ nombre, descripcion, portada: portada || undefined });
      if ("error" in r) { setError(r.error); return; }
      onCreado();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[520px] bg-surface rounded-3xl shadow-2xl p-5 sm:p-6 my-auto">
        <div className="flex items-start gap-3 mb-5">
          <span className="w-11 h-11 rounded-xl bg-accent-soft grid place-items-center text-lg shrink-0">✏️</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-extrabold leading-tight">Proponer un nuevo grupo</h2>
            <p className="text-[13px] text-sub mt-0.5 leading-snug">Comparte tu idea con la comunidad y consigue apoyos para crear tu grupo.</p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="w-8 h-8 grid place-items-center rounded-lg text-hint hover:bg-bg transition">✕</button>
        </div>

        <label className="block text-[13px] font-semibold mb-1.5">Nombre del grupo <span className="text-pink">*</span></label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60}
          placeholder="Ej. Fotografía creativa"
          className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-accent transition mb-4" />

        <label className="block text-[13px] font-semibold mb-1.5">Descripción del grupo <span className="text-pink">*</span></label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={250} rows={3}
          placeholder="Cuéntanos de qué tratará el grupo, qué tipo de contenido se compartirá y qué lo hace especial."
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-accent transition resize-none" />
        <div className="text-[11.5px] text-hint text-right mt-1 mb-4">{descripcion.length}/250</div>

        <label className="block text-[13px] font-semibold mb-1.5">Imagen de portada <span className="text-hint font-normal">(opcional)</span></label>
        <label className="block border border-dashed border-accent/40 rounded-xl bg-accent-soft/40 px-4 py-5 text-center cursor-pointer hover:bg-accent-soft transition mb-4">
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); }} />
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portada} alt="" className="max-h-28 rounded-lg mx-auto" />
          ) : (
            <>
              <div className="text-[13px] font-semibold text-accent">🖼 {subiendo ? "Subiendo…" : "Subir imagen"}</div>
              <div className="text-[11.5px] text-sub mt-1">JPG, PNG o WEBP · máx. 5 MB · recomendado 1200 × 600 px</div>
            </>
          )}
        </label>

        <p className="text-[12px] text-sub bg-accent-soft/50 border border-accent/10 rounded-xl px-3.5 py-2.5 leading-snug">
          ℹ️ Cuando alcance <b className="text-accent">{META} apoyos</b>, el grupo se creará y todos los que lo apoyaron serán los primeros miembros.
        </p>

        {error && <p className="text-[12.5px] text-pink mt-3">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onCerrar} className="rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-sub hover:bg-bg transition">Cancelar</button>
          <button onClick={crear} disabled={pendiente || subiendo}
            className="bg-accent text-white rounded-xl px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 disabled:opacity-60 transition">
            {pendiente ? "Creando…" : "Proponer grupo"}
          </button>
        </div>
      </div>
    </div>
  );
}
