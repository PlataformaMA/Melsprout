"use client";

import { MiEnlaceEmbajador } from "@/components/MiEnlaceEmbajador";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { createClient } from "@/lib/supabase/client";
import { urlParaSubir, registrarEntrega, urlDeArchivo } from "@/lib/creador-campanias";
import { fechaCorta, fechaYHora, dinero } from "@/lib/formato-campanias";
import type { DetalleColaboracion, Entrega } from "@/lib/creador-campanias";

// El detalle de una colaboración activa: dónde viene el producto, qué falta
// entregar y qué dijo la marca del material.

export function ColaboracionVista({
  nombre, avatarUrl, xp, racha, colaboracion,
}: {
  nombre: string; avatarUrl: string | null; xp: number; racha: number;
  colaboracion: DetalleColaboracion;
}) {
  const c = colaboracion;
  const [entregando, setEntregando] = useState(false);
  const [hilo, setHilo] = useState<"guion" | "video" | null>(null);

  const comentarios = (sobre: string) => c.comentarios.filter((m) => m.sobre === sobre);
  const entregasDe = (tipo: string) => c.entregas.filter((e) => e.tipo === tipo);

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="campanias" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5 pb-16">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <Link href="/app/campanias"
            className="inline-flex items-center gap-2 text-sub text-[14px] font-semibold hover:text-accent transition">
            <span aria-hidden>←</span> Volver a mis campañas
          </Link>

          {/* ————— Encabezado ————— */}
          <div className="grid gap-5 md:grid-cols-[1fr_320px] md:items-start mt-3">
            <div>
              <Estado estado={c.estado} />
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">{c.marca}</h1>
              {c.producto && <p className="text-sub text-[17px] mt-1">{c.producto}</p>}
              {c.entregable && <p className="text-[15px] mt-1.5">{c.entregable}</p>}
            </div>
            {c.portada && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.portada} alt="" className="w-full h-[130px] rounded-2xl object-cover" />
            )}
          </div>

          {/* ————— La ficha de una línea ————— */}
          <div className="bg-surface border border-border rounded-2xl mt-5 shadow-sm grid sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Celda icono={<IcoTienda />} titulo="Marca">
              <span className="flex items-center gap-2">
                {c.marcaLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.marcaLogo} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-accent-soft text-accent grid place-items-center text-[10px] font-extrabold">
                    {iniciales(c.marca)}
                  </span>
                )}
                {c.marca}
              </span>
            </Celda>
            <Celda icono={<IcoCalendario />} titulo="Fecha de inicio">{fechaCorta(c.fechaInicio)}</Celda>
            <Celda icono={<IcoCalendario />} titulo="Fecha de entrega">{fechaCorta(c.fechaEntrega)}</Celda>
            <Celda icono={<IcoDinero />} titulo="Compensación">{dinero(c.compensacion, c.moneda)}</Celda>
            <Celda icono={<IcoPulso />} titulo="Estatus"><Estado estado={c.estado} /></Celda>
          </div>

          {/* ————— Envío ————— */}
          {(c.direccion || c.guia || c.pasos.preparacion) && <Envio c={c} />}

          {/* En una campaña de afiliados lo que trabaja es su enlace: no hay
              guion ni video que subir, así que esa parte sobra y en su lugar
              va lo que de verdad necesita. */}
          {c.esAfiliados && <MiEnlaceEmbajador campaniaId={c.campaniaId} />}

          {/* ————— Entregables ————— */}
          <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 mt-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-accent mt-0.5"><IcoDocumento /></span>
              <div>
                {/* En afiliados nadie le exige un video: su trabajo es el
                    enlace. Pero el contenido que haga sí puede compartirlo, y
                    el programa lo contempla ("contenido voluntario"). */}
                <h2 className="font-display font-extrabold text-[19px]">
                  {c.esAfiliados ? "Comparte tu contenido" : "Entrega de contenido"}
                </h2>
                <p className="text-sub text-[13.5px] mt-0.5">
                  {c.esAfiliados
                    ? "Opcional: sube lo que publiques para que el equipo lo vea y te dé retroalimentación. No hay entregables obligatorios."
                    : "Completa los entregables de la campaña. Asegúrate de cumplir con las fechas establecidas."}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-5">
              {!c.esAfiliados && (
              <Entregable
                n={1}
                titulo="Guion"
                opcional
                texto="Puedes compartir tu guion con el equipo para recibir comentarios antes de grabar."
                estado={c.guion}
                entregas={entregasDe("guion")}
                comentarios={comentarios("guion")}
                colaboracionId={c.id}
                onVerComentarios={() => setHilo("guion")}
              >
                <SubirGuion colaboracionId={c.id} />
              </Entregable>
              )}

              <Entregable
                n={c.esAfiliados ? 1 : 2}
                titulo={c.esAfiliados ? "Tu video" : "Video final"}
                opcional={c.esAfiliados}
                texto={c.esAfiliados
                  ? "Si grabas algo recomendando el curso y quieres compartirlo, súbelo aquí."
                  : "Sube aquí el video de tu campaña. Asegúrate de cumplir con las especificaciones acordadas."}
                estado={c.entregaFinal}
                entregas={entregasDe("video")}
                comentarios={comentarios("video")}
                colaboracionId={c.id}
                onVerComentarios={() => setHilo("video")}
              >
                <button onClick={() => setEntregando(true)}
                  className="w-full border-2 border-dashed border-accent/35 bg-accent-soft/25 rounded-2xl py-8 px-4 text-center hover:bg-accent-soft/50 transition">
                  <span className="w-12 h-12 rounded-full bg-accent-soft grid place-items-center mx-auto text-accent">
                    <IcoSubir />
                  </span>
                  <div className="font-display font-extrabold text-[15px] mt-3">
                    {c.entregas.some((e) => e.tipo === "video") ? "Subir video con correcciones" : "Subir video"}
                  </div>
                  <div className="text-sub text-[13px] mt-1">Arrastra y suelta tu archivo aquí o haz clic para seleccionar</div>
                  <div className="text-hint text-[12.5px] mt-2">Formato: MP4, MOV · Máx. 500 MB</div>
                  <div className="text-hint text-[12.5px]">Video vertical (9:16)</div>
                </button>
              </Entregable>
            </div>
          </section>
        </div>
      </main>

      {entregando && (
        <ModalEntregar colaboracionId={c.id} onCerrar={() => setEntregando(false)} />
      )}
      {hilo && (
        <ModalComentarios
          colaboracionId={c.id}
          sobre={hilo}
          marca={c.marca}
          comentarios={comentarios(hilo)}
          onCerrar={() => setHilo(null)}
        />
      )}
    </div>
  );
}

// ————————————————— Envío del producto —————————————————

const PASOS = [
  { id: "preparacion", txt: "Preparando envío" },
  { id: "transito", txt: "En camino" },
  { id: "reparto", txt: "En reparto" },
  { id: "entregado", txt: "Entregado" },
] as const;

function Envio({ c }: { c: DetalleColaboracion }) {
  const [copiado, setCopiado] = useState(false);
  const fechas = c.pasos as Record<string, string | null>;
  // El paso actual es el último con fecha: lo que ya pasó, pasó.
  const actual = PASOS.reduce((ultimo, p, i) => (fechas[p.id] ? i : ultimo), -1);

  async function copiar() {
    if (!c.guia) return;
    try {
      await navigator.clipboard.writeText(c.guia);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sin permiso de portapapeles no se hace nada: el número está a la vista.
    }
  }

  return (
    <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 mt-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-accent mt-0.5"><IcoCamion /></span>
        <div>
          <h2 className="font-display font-extrabold text-[19px]">Envío del producto</h2>
          <p className="text-sub text-[13.5px] mt-0.5">Aquí puedes rastrear el envío de tu kit de productos.</p>
        </div>
      </div>

      <ol className="flex items-start mt-7 mb-2">
        {PASOS.map((p, i) => {
          const hecho = i <= actual;
          return (
            <li key={p.id} className="flex-1 flex flex-col items-center relative min-w-0">
              {i > 0 && (
                <span className={`absolute top-[17px] right-1/2 left-[-50%] h-[3px] ${
                  i <= actual ? "bg-accent" : "bg-border"}`} />
              )}
              <span className={`relative z-10 w-9 h-9 rounded-full grid place-items-center ${
                hecho ? "bg-accent text-white" : "bg-bg text-hint border border-border"}`}>
                {i === actual ? <IcoCamion /> : hecho ? <IcoPalomita /> : <IcoCaja />}
              </span>
              <span className={`text-[13px] font-bold mt-2 text-center px-1 ${hecho ? "" : "text-hint"}`}>
                {p.txt}
              </span>
              <span className="text-[12.5px] text-sub">{fechas[p.id] ? fechaCorta(fechas[p.id]) : "—"}</span>
            </li>
          );
        })}
      </ol>

      {(c.direccion || c.guia) && (
        <div className="bg-accent-soft/35 rounded-2xl p-4 mt-5 grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
          {c.direccion && (
            <div className="flex gap-2.5">
              <span className="text-accent shrink-0 mt-0.5"><IcoPin /></span>
              <div className="min-w-0">
                <div className="text-[13px] text-sub font-semibold">Dirección de entrega</div>
                <div className="text-[13.5px] font-semibold mt-0.5 whitespace-pre-line">{c.direccion}</div>
              </div>
            </div>
          )}
          {c.guia && (
            <div>
              <div className="text-[13px] text-sub font-semibold">Número de guía</div>
              <button onClick={copiar}
                className="flex items-center gap-2 text-[13.5px] font-semibold mt-0.5 hover:text-accent transition">
                {c.paqueteria ? `${c.paqueteria} ${c.guia}` : c.guia}
                <span className="text-hint">{copiado ? "✓" : <IcoCopiar />}</span>
              </button>
            </div>
          )}
          {c.guiaUrl && (
            <a href={c.guiaUrl} target="_blank" rel="noopener noreferrer"
              className="justify-self-start md:justify-self-end bg-accent-soft text-accent rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:brightness-95 transition whitespace-nowrap">
              Rastrear{c.paqueteria ? ` en ${c.paqueteria}` : ""} ↗
            </a>
          )}
        </div>
      )}
    </section>
  );
}

// ————————————————— Un entregable —————————————————

function Entregable({
  n, titulo, opcional, texto, estado, entregas, comentarios, colaboracionId, onVerComentarios, children,
}: {
  n: number; titulo: string; opcional?: boolean; texto: string; estado: string;
  entregas: Entrega[];
  comentarios: DetalleColaboracion["comentarios"];
  colaboracionId: string;
  onVerComentarios: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="bg-bg/60 border border-border rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full bg-accent text-white grid place-items-center text-[13px] font-extrabold shrink-0">
            {n}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-display font-extrabold text-[15.5px]">
                {titulo}{opcional && <span className="text-sub font-semibold"> (opcional)</span>}
              </h3>
              <EstadoEntrega estado={estado} />
            </div>
            <p className="text-sub text-[13px] leading-snug mt-1">{texto}</p>
          </div>
        </div>

        {entregas.length > 0 && (
          <ul className="space-y-2 mt-3.5">
            {entregas.map((e) => (
              <li key={e.id}>
                <Archivo colaboracionId={colaboracionId} ruta={e.ruta}
                  nombre={e.nombre || "Archivo"} pie={`Subido el ${fechaCorta(e.fecha)}`} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3.5">{children}</div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <h4 className="font-display font-extrabold text-[14.5px]">Comentarios</h4>
        {comentarios.length === 0 ? (
          <p className="text-hint text-[13px] mt-2">Todavía no hay comentarios sobre esta pieza.</p>
        ) : (
          <button onClick={onVerComentarios}
            className="w-full flex items-center gap-2.5 bg-bg rounded-xl px-3.5 py-3 mt-2.5 text-left hover:bg-accent-soft/40 transition">
            <span className="text-accent shrink-0"><IcoGlobo /></span>
            <span className="text-[13.5px] font-semibold flex-1 min-w-0">
              {comentarios.length === 1
                ? `Tienes 1 comentario de ${comentarios[0].autor}`
                : `Tienes ${comentarios.length} comentarios`}
            </span>
            <span className="text-hint" aria-hidden>›</span>
          </button>
        )}
      </div>
    </div>
  );
}

function EstadoEntrega({ estado }: { estado: string }) {
  const m: Record<string, { txt: string; clase: string }> = {
    no_empezado: { txt: "Pendiente", clase: "bg-amber-100 text-amber-700" },
    en_proceso: { txt: "En revisión", clase: "bg-accent-soft text-accent" },
    aprobado: { txt: "Aprobado", clase: "bg-green/10 text-green" },
    por_corregir: { txt: "Por corregir", clase: "bg-pink-soft text-pink" },
  };
  const e = m[estado] ?? m.no_empezado;
  return (
    <span className={`text-[12.5px] font-bold rounded-full px-3 py-1 whitespace-nowrap ${e.clase}`}>● {e.txt}</span>
  );
}

// Un archivo del bucket privado: el enlace se firma al hacer clic, no antes.
function Archivo({ colaboracionId, ruta, nombre, pie }: {
  colaboracionId: string; ruta: string; nombre: string; pie?: string;
}) {
  const [abriendo, setAbriendo] = useState(false);

  async function abrir() {
    setAbriendo(true);
    const url = await urlDeArchivo(colaboracionId, ruta);
    setAbriendo(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button onClick={abrir} disabled={abriendo}
      className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-left hover:border-accent transition disabled:opacity-60">
      <span className="text-accent shrink-0"><IcoArchivo /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold truncate">{nombre}</span>
        {pie && <span className="block text-[12px] text-hint">{pie}</span>}
      </span>
      <span className="text-hint text-[12.5px] shrink-0">{abriendo ? "Abriendo…" : "Ver"}</span>
    </button>
  );
}

// ————————————————— Subir —————————————————

// La subida va directo del navegador al bucket con una URL firmada: un video
// de 500 MB no cabe en una server action.
async function subir(
  colaboracionId: string, tipo: string, archivo: File
): Promise<string | null> {
  const permiso = await urlParaSubir(colaboracionId, tipo, archivo.name, archivo.size);
  if ("error" in permiso) return permiso.error;

  const { error } = await createClient()
    .storage.from("entregas").uploadToSignedUrl(permiso.ruta, permiso.token, archivo);
  if (error) return "No se pudo subir el archivo. Revisa tu conexión e inténtalo otra vez.";

  const r = await registrarEntrega(colaboracionId, tipo, permiso.ruta, archivo.name, archivo.size);
  return "error" in r ? r.error : null;
}

function SubirGuion({ colaboracionId }: { colaboracionId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function elegido(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    const fallo = await subir(colaboracionId, "guion", archivo);
    setSubiendo(false);
    if (fallo) { setError(fallo); return; }
    router.refresh();
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-3.5 flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-accent-soft grid place-items-center text-accent shrink-0">
          <IcoArchivo />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">Subir guion (PDF, DOC, DOCX)</div>
          <div className="text-[12.5px] text-hint">Máx. 10 MB</div>
        </div>
        <button onClick={() => input.current?.click()} disabled={subiendo}
          className="shrink-0 flex items-center gap-2 bg-accent-soft text-accent rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:brightness-95 transition disabled:opacity-60">
          <IcoSubirChico /> {subiendo ? "Subiendo…" : "Subir archivo"}
        </button>
        <input ref={input} type="file" accept=".pdf,.doc,.docx" hidden
          onChange={(e) => { void elegido(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-2">{error}</p>}
    </>
  );
}

// ————————————————— Entregar el contenido —————————————————

function ModalEntregar({ colaboracionId, onCerrar }: {
  colaboracionId: string; onCerrar: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const extras = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<File[]>([]);
  const [otros, setOtros] = useState<File[]>([]);
  const [verExtras, setVerExtras] = useState(false);
  const [confirmo, setConfirmo] = useState(false);
  const [encima, setEncima] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function enviar() {
    if (!videos.length || !confirmo) return;
    setSubiendo(true);
    setError("");
    for (const v of videos) {
      const fallo = await subir(colaboracionId, "video", v);
      if (fallo) { setError(fallo); setSubiendo(false); return; }
    }
    for (const o of otros) {
      const fallo = await subir(colaboracionId, "extra", o);
      if (fallo) { setError(fallo); setSubiendo(false); return; }
    }
    setSubiendo(false);
    onCerrar();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 grid place-items-center p-4 overflow-y-auto" onClick={onCerrar}>
      <div className="bg-surface rounded-3xl w-full max-w-2xl shadow-2xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl font-extrabold">Entregar contenido de la campaña</h3>
            <p className="text-sub text-[13.5px] mt-1">Sube el archivo de tu contenido. No se requiere link del post.</p>
          </div>
          <span className="shrink-0 bg-bg text-sub text-[11.5px] font-bold rounded-full px-3 py-1.5 tracking-wide">
            {videos.length} SUBIDOS / 1 REQUERIDOS
          </span>
          <button onClick={onCerrar} className="shrink-0 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
            onDragLeave={() => setEncima(false)}
            onDrop={(e) => {
              e.preventDefault();
              setEncima(false);
              setVideos((v) => [...v, ...Array.from(e.dataTransfer.files)]);
            }}
            className={`w-full border-2 border-dashed rounded-2xl py-10 px-4 text-center transition ${
              encima ? "border-accent bg-accent-soft/60" : "border-accent/30 bg-accent-soft/25 hover:bg-accent-soft/45"}`}>
            <span className="w-14 h-14 rounded-2xl bg-accent-soft grid place-items-center mx-auto text-accent">
              <IcoVideo />
            </span>
            <div className="font-display font-extrabold text-[17px] mt-3">Sube tus videos</div>
            <div className="text-sub text-[13.5px] mt-1">Video / archivo para la marca · toca o arrastra tus archivos</div>
            <div className="text-hint text-[12.5px] mt-3">Formato: MP4, MOV · Máx. 500 MB</div>
            <div className="text-hint text-[12.5px]">Video vertical (9:16)</div>
          </button>
          <input ref={input} type="file" accept=".mp4,.mov,video/mp4,video/quicktime" multiple hidden
            onChange={(e) => { setVideos((v) => [...v, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />

          {videos.map((v, i) => (
            <Elegido key={`${v.name}-${i}`} archivo={v} quitar={() => setVideos((l) => l.filter((_, j) => j !== i))} />
          ))}

          <div className="border border-border rounded-2xl">
            <button onClick={() => setVerExtras((x) => !x)}
              className="w-full flex items-center gap-2 px-4 py-3.5 text-[14px] font-semibold">
              <span className="text-accent">+</span> Agregar archivos extras (opcional)
              <span className="ml-auto text-hint" aria-hidden>{verExtras ? "▴" : "▾"}</span>
            </button>
            {verExtras && (
              <div className="px-4 pb-4 space-y-2">
                <button onClick={() => extras.current?.click()}
                  className="w-full border border-dashed border-border rounded-xl py-3 text-[13.5px] text-sub hover:border-accent transition">
                  Elegir archivos
                </button>
                <input ref={extras} type="file" multiple hidden
                  onChange={(e) => { setOtros((v) => [...v, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
                {otros.map((o, i) => (
                  <Elegido key={`${o.name}-${i}`} archivo={o} quitar={() => setOtros((l) => l.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-bg rounded-2xl px-4 py-3.5 flex items-center gap-2.5 text-[13.5px] text-sub">
            <span className="text-accent shrink-0"><IcoInfo /></span>
            <span>¿Necesitas tips para grabar el mejor contenido? Lee nuestra guía</span>
            <Link href="/app/ruta" className="ml-auto text-accent font-bold shrink-0">Ver ↗</Link>
          </div>

          <label className="flex items-start gap-3 text-[14px] cursor-pointer pt-1">
            <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[var(--accent,#6D4AFF)] shrink-0" />
            Confirmo que el contenido cumple con las especificaciones del brief.
          </label>

          {error && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="border-t border-border p-5 flex items-center justify-end gap-3">
          <button onClick={onCerrar} disabled={subiendo}
            className="rounded-xl px-5 py-3 text-[14px] font-semibold text-sub hover:bg-bg transition">
            Cancelar
          </button>
          <button onClick={enviar} disabled={!videos.length || !confirmo || subiendo}
            className="flex items-center gap-2 bg-accent text-white rounded-xl px-6 py-3 text-[14px] font-extrabold hover:brightness-110 transition disabled:opacity-45 disabled:cursor-not-allowed">
            {subiendo ? "Subiendo…" : "Completa todas las piezas"} <span aria-hidden>➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Elegido({ archivo, quitar }: { archivo: File; quitar: () => void }) {
  const mb = archivo.size / (1024 * 1024);
  return (
    <div className="flex items-center gap-3 bg-bg rounded-xl px-3.5 py-2.5">
      <span className="text-accent shrink-0"><IcoArchivo /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold truncate">{archivo.name}</span>
        <span className="block text-[12px] text-hint">{mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(archivo.size / 1024)} KB`}</span>
      </span>
      <button onClick={quitar} className="text-hint hover:text-pink text-[18px] shrink-0" aria-label="Quitar">✕</button>
    </div>
  );
}

// ————————————————— Comentarios —————————————————

function ModalComentarios({ colaboracionId, sobre, marca, comentarios, onCerrar }: {
  colaboracionId: string; sobre: string; marca: string;
  comentarios: DetalleColaboracion["comentarios"];
  onCerrar: () => void;
}) {
  const capturas = comentarios.flatMap((m) => m.adjuntos);
  const primera = comentarios[0];

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 grid place-items-center p-4 overflow-y-auto" onClick={onCerrar}>
      <div className="bg-surface rounded-3xl w-full max-w-4xl shadow-2xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-accent-soft grid place-items-center text-accent shrink-0">
            <IcoGlobo />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl font-extrabold">
              Comentarios {sobre === "guion" ? "del guion" : "del video final"}
            </h3>
            <p className="text-sub text-[13.5px] mt-0.5">Revisa las correcciones y comentarios de {marca}.</p>
          </div>
          <button onClick={onCerrar} className="shrink-0 text-hint hover:text-sub text-xl" aria-label="Cerrar">✕</button>
        </div>

        <div className="px-6 pb-6 grid gap-4 lg:grid-cols-2">
          {capturas.length > 0 && (
            <div className="bg-bg/60 border border-border rounded-2xl p-4">
              <h4 className="font-display font-extrabold text-[15px]">Capturas con correcciones</h4>
              <p className="text-hint text-[12.5px] mt-0.5">
                {capturas.length} {capturas.length === 1 ? "archivo" : "archivos"}
                {primera && ` · Subidos el ${fechaCorta(primera.fecha)}`}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3.5">
                {capturas.map((a) => (
                  <Archivo key={a.ruta} colaboracionId={colaboracionId} ruta={a.ruta} nombre={a.nombre} />
                ))}
              </div>
            </div>
          )}

          <div className={`space-y-3 ${capturas.length ? "" : "lg:col-span-2"}`}>
            {comentarios.map((m) => (
              <div key={m.id} className={`rounded-2xl p-4 ${
                m.autorTipo === "creador" ? "bg-accent-soft/40" : "bg-bg/60 border border-border"}`}>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center text-[11px] font-extrabold shrink-0">
                    {iniciales(m.autor)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-extrabold text-[14px]">{m.autor}</div>
                    <div className="text-hint text-[12px]">{fechaYHora(m.fecha)}</div>
                  </div>
                </div>
                {m.texto && (
                  <p className="text-[13.5px] leading-relaxed mt-2.5 whitespace-pre-line">{m.texto}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ————————————————— Piezas —————————————————

function Celda({ icono, titulo, children }: {
  icono: React.ReactNode; titulo: string; children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 flex gap-3 min-w-0">
      <span className="text-hint shrink-0 mt-0.5">{icono}</span>
      <div className="min-w-0">
        <div className="text-[12.5px] text-sub font-semibold">{titulo}</div>
        <div className="text-[14px] font-bold mt-1 truncate">{children}</div>
      </div>
    </div>
  );
}

function Estado({ estado }: { estado: string }) {
  const m: Record<string, { txt: string; clase: string; punto: string }> = {
    activa: { txt: "Activa", clase: "bg-green/10 text-green", punto: "bg-green" },
    en_revision: { txt: "En revisión", clase: "bg-accent-soft text-accent", punto: "bg-accent" },
    completada: { txt: "Completada", clase: "bg-bg text-sub border border-border", punto: "bg-hint" },
    cancelada: { txt: "Cancelada", clase: "bg-bg text-hint border border-border", punto: "bg-hint" },
  };
  const e = m[estado] ?? m.activa;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold rounded-full px-3 py-1 ${e.clase}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.punto}`} /> {e.txt}
    </span>
  );
}

function iniciales(texto: string): string {
  return texto.split(/\s+/).slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase();
}

const ICO = {
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round",
} as const;

function IcoTienda() { return <svg {...ICO}><path d="M4 9.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M3.5 9.5 5 4.5h14l1.5 5" /></svg>; }
function IcoCalendario() { return <svg {...ICO}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /></svg>; }
function IcoDinero() { return <svg {...ICO}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M14.3 9.8c0-1-1-1.6-2.3-1.6s-2.3.6-2.3 1.5 1 1.4 2.3 1.6 2.3.7 2.3 1.6-1 1.5-2.3 1.5-2.3-.6-2.3-1.6" /></svg>; }
function IcoPulso() { return <svg {...ICO}><path d="M3 12.5h3.5l2-5 3 10 2.5-7 1.5 2H21" /></svg>; }
function IcoCamion() { return <svg {...ICO} width={18} height={18}><path d="M2.5 7.5h10v8h-10z" /><path d="M12.5 10.5h3.6l2.9 3v2h-6.5z" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="16" cy="17.5" r="1.8" /></svg>; }
function IcoCaja() { return <svg {...ICO} width={17} height={17}><path d="M4 8.5 12 5l8 3.5V17l-8 3.5L4 17z" /><path d="M4 8.5 12 12l8-3.5M12 12v8.5" /></svg>; }
function IcoPalomita() { return <svg {...ICO} width={17} height={17} strokeWidth={2.6}><path d="m5 12.5 4.5 4.5L19 7" /></svg>; }
function IcoDocumento() { return <svg {...ICO}><path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z" /><path d="M14 3.5v4h4" /><path d="M9 13h6M9 16.5h4" /></svg>; }
function IcoArchivo() { return <svg {...ICO} width={18} height={18}><path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z" /><path d="M14 3.5v4h4" /></svg>; }
function IcoPin() { return <svg {...ICO} width={18} height={18}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function IcoCopiar() { return <svg {...ICO} width={16} height={16}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 5.5H6a1.5 1.5 0 0 0-1.5 1.5v9.5" /></svg>; }
function IcoSubir() { return <svg {...ICO} width={22} height={22} strokeWidth={2.2}><path d="M12 19.5V5M12 5l-5 5M12 5l5 5" /></svg>; }
function IcoSubirChico() { return <svg {...ICO} width={16} height={16} strokeWidth={2.2}><path d="M12 18V6M12 6l-4.5 4.5M12 6l4.5 4.5" /></svg>; }
function IcoVideo() { return <svg {...ICO} width={26} height={26}><rect x="3" y="6.5" width="12.5" height="11" rx="2.5" /><path d="m15.5 11 5-3v8l-5-3z" /></svg>; }
function IcoGlobo() { return <svg {...ICO}><path d="M21 14a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /></svg>; }
function IcoInfo() { return <svg {...ICO} width={18} height={18}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8.2v.1" /></svg>; }
