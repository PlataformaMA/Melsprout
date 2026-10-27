"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fechaCorta, pesoArchivo } from "@/lib/formato-campanias";
import {
  guardarFichaMarca, urlParaSubirArchivoMarca, registrarArchivoMarca,
  urlDeArchivoMarca, borrarArchivoMarca, archivosDeMarca,
} from "@/lib/mkt-admin";
import type { MarcaFicha, ArchivoMarca } from "@/lib/mkt-admin";

// La ficha de una marca: lo que el equipo necesita para trabajar con ella.
// Cada bloque se edita por separado para no tener un formulario gigante que
// haya que llenar entero para cambiar un teléfono.

const REDES = [
  ["instagram", "Instagram", "📷"],
  ["tiktok", "TikTok", "🎵"],
  ["youtube", "YouTube", "▶️"],
  ["facebook", "Facebook", "👍"],
] as const;

const TIPOS_ARCHIVO = [
  ["contrato", "Contrato"],
  ["factura", "Factura"],
  ["bancario", "Datos bancarios"],
  ["otro", "Otro"],
] as const;

export function MktMarcaFicha({ m }: { m: MarcaFicha }) {
  const [ficha, setFicha] = useState(m);
  const [archivos, setArchivos] = useState<ArchivoMarca[]>(m.archivos);

  return (
    <>
      <Link href="/app/admin/marketplace/marcas"
        className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-4 py-2 text-[13.5px] font-bold text-accent hover:bg-accent-soft transition">
        ← Volver
      </Link>

      <header className="flex items-start gap-4 flex-wrap mt-4">
        {ficha.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ficha.logoUrl} alt="" className="w-[110px] h-[110px] rounded-2xl object-contain bg-surface border border-border p-3 shrink-0" />
        ) : (
          <span className="w-[110px] h-[110px] rounded-2xl bg-accent-soft text-accent grid place-items-center text-2xl font-extrabold shrink-0">
            {ficha.nombre.slice(0, 2).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{ficha.nombre}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold rounded-full px-2.5 py-1 ${
              !ficha.aprobada ? "bg-accent-soft text-accent"
                : ficha.activa ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>
              {!ficha.aprobada ? "En revisión" : ficha.activa ? "Activa" : "Pausada"}
            </span>
          </div>
          {ficha.lema && <p className="text-[14px] text-sub mt-1">{ficha.lema}</p>}
          {ficha.categoria && (
            <span className="inline-block mt-2 text-[12px] font-bold text-accent bg-accent-soft rounded-full px-3 py-1">
              {ficha.categoria}
            </span>
          )}
        </div>

        <div className="flex gap-6 sm:gap-8 shrink-0 sm:border-l border-border sm:pl-6">
          <Num icono="📣" n={ficha.campanias} t="Campañas" />
          <Num icono="👥" n={ficha.creadores} t="Creadores" />
          <Num icono="⭐" n={ficha.calificacion ?? "—"} t="Calificación" />
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-3 mt-5 items-start">
        <div className="space-y-3">
          <Bloque titulo="Información general" ficha={ficha} onGuardado={setFicha}
            campos={[
              ["nombre", "Nombre de la marca", "texto"],
              ["categoria", "Categoría", "texto"],
              ["pais", "País", "texto"],
              ["sitio", "Sitio web", "texto"],
              ["lema", "Lema", "texto"],
              ["descripcion", "Descripción", "largo"],
            ]} />

          <BloqueRedes ficha={ficha} onGuardado={setFicha} />

          <Bloque titulo="Dirección" ficha={ficha} onGuardado={setFicha}
            campos={[["direccion", "Dirección", "largo"]]} />
        </div>

        <div className="space-y-3">
          <Archivos marcaId={ficha.id} archivos={archivos} onCambio={setArchivos} />

          <Bloque titulo="Contacto" ficha={ficha} onGuardado={setFicha}
            campos={[
              ["contactoNombre", "Nombre de contacto", "texto"],
              ["contactoCorreo", "Correo", "texto"],
              ["contactoTelefono", "Teléfono", "texto"],
              ["contactoCargo", "Cargo", "texto"],
            ]}
            extra={ficha.correoDueno
              ? `Cuenta de la empresa: ${ficha.correoDueno}`
              : "Esta marca todavía no tiene una cuenta de empresa asociada."} />
        </div>
      </div>
    </>
  );
}

type Campo = [keyof MarcaFicha, string, "texto" | "largo"];

function Bloque({ titulo, ficha, campos, extra, onGuardado }: {
  titulo: string;
  ficha: MarcaFicha;
  campos: Campo[];
  extra?: string;
  onGuardado: (f: MarcaFicha) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  function abrir() {
    const b: Record<string, string> = {};
    for (const [k] of campos) b[k as string] = (ficha[k] as string) || "";
    setBorrador(b);
    setError("");
    setEditando(true);
  }

  async function guardar() {
    setOcupado(true);
    setError("");
    const r = await guardarFichaMarca(ficha.id, borrador);
    setOcupado(false);
    if ("error" in r) { setError(r.error); return; }
    onGuardado({ ...ficha, ...borrador } as MarcaFicha);
    setEditando(false);
  }

  return (
    <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-extrabold text-[15.5px]">{titulo}</h2>
        {!editando && (
          <button onClick={abrir}
            className="flex items-center gap-1.5 bg-bg border border-border rounded-xl px-3 py-1.5 text-[12.5px] font-bold text-sub hover:text-accent hover:border-accent/40 transition">
            ✎ Editar
          </button>
        )}
      </div>

      {editando ? (
        <div className="mt-4 space-y-3">
          {campos.map(([k, etiqueta, tipo]) => (
            <label key={k as string} className="block">
              <span className="text-[12.5px] text-hint block mb-1">{etiqueta}</span>
              {tipo === "largo" ? (
                <textarea value={borrador[k as string] ?? ""} rows={3}
                  onChange={(e) => setBorrador({ ...borrador, [k as string]: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-accent resize-none" />
              ) : (
                <input value={borrador[k as string] ?? ""}
                  onChange={(e) => setBorrador({ ...borrador, [k as string]: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl px-3.5 h-10 text-[13.5px] outline-none focus:border-accent" />
              )}
            </label>
          ))}
          {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-xl px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditando(false)} disabled={ocupado}
              className="rounded-xl px-4 py-2 text-[13px] font-bold text-sub hover:bg-bg transition disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={ocupado}
              className="bg-accent text-white rounded-xl px-4 py-2 text-[13px] font-bold hover:brightness-110 transition disabled:opacity-50">
              {ocupado ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <dl className="mt-3.5 space-y-3">
          {campos.map(([k, etiqueta]) => {
            const v = (ficha[k] as string) || null;
            return (
              <div key={k as string}>
                <dt className="text-[12px] text-hint">{etiqueta}</dt>
                <dd className="text-[13.5px] mt-0.5 break-words">
                  {k === "sitio" && v ? (
                    <a href={v.startsWith("http") ? v : `https://${v}`} target="_blank" rel="noreferrer"
                      className="text-accent font-semibold">{v} ↗</a>
                  ) : v ? (
                    <span className="whitespace-pre-wrap">{v}</span>
                  ) : (
                    <span className="text-hint">Sin dato</span>
                  )}
                </dd>
              </div>
            );
          })}
          {extra && <p className="text-[12px] text-hint pt-1 border-t border-border">{extra}</p>}
        </dl>
      )}
    </section>
  );
}

function BloqueRedes({ ficha, onGuardado }: {
  ficha: MarcaFicha; onGuardado: (f: MarcaFicha) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);

  async function guardar() {
    setOcupado(true);
    // Las vacías no se guardan: así la red desaparece de la ficha en vez de
    // quedar como un renglón sin nada.
    const limpias = Object.fromEntries(
      Object.entries(borrador).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]),
    );
    const r = await guardarFichaMarca(ficha.id, { redes: limpias });
    setOcupado(false);
    if ("error" in r) { alert(r.error); return; }
    onGuardado({ ...ficha, redes: limpias });
    setEditando(false);
  }

  const puestas = REDES.filter(([k]) => ficha.redes[k]);

  return (
    <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-extrabold text-[15.5px]">Redes sociales</h2>
        {!editando && (
          <button onClick={() => { setBorrador({ ...ficha.redes }); setEditando(true); }}
            className="flex items-center gap-1.5 bg-bg border border-border rounded-xl px-3 py-1.5 text-[12.5px] font-bold text-sub hover:text-accent hover:border-accent/40 transition">
            ✎ Editar
          </button>
        )}
      </div>

      {editando ? (
        <div className="mt-4 space-y-3">
          {REDES.map(([k, nombre, icono]) => (
            <label key={k} className="flex items-center gap-2.5">
              <span className="w-7 text-center">{icono}</span>
              <span className="text-[13px] w-[72px] shrink-0">{nombre}</span>
              <input value={borrador[k] ?? ""} placeholder="@usuario"
                onChange={(e) => setBorrador({ ...borrador, [k]: e.target.value })}
                className="flex-1 min-w-0 bg-bg border border-border rounded-xl px-3 h-10 text-[13.5px] outline-none focus:border-accent" />
            </label>
          ))}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditando(false)} disabled={ocupado}
              className="rounded-xl px-4 py-2 text-[13px] font-bold text-sub hover:bg-bg transition disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={ocupado}
              className="bg-accent text-white rounded-xl px-4 py-2 text-[13px] font-bold hover:brightness-110 transition disabled:opacity-50">
              {ocupado ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      ) : puestas.length === 0 ? (
        <p className="text-[13px] text-hint mt-3">Esta marca todavía no tiene redes registradas.</p>
      ) : (
        <ul className="mt-3.5 space-y-2.5">
          {puestas.map(([k, nombre, icono]) => (
            <li key={k} className="flex items-center gap-3 text-[13.5px]">
              <span className="w-7 text-center">{icono}</span>
              <span className="text-sub w-[72px] shrink-0">{nombre}</span>
              <span className="font-semibold truncate">{ficha.redes[k]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Archivos({ marcaId, archivos, onCambio }: {
  marcaId: string; archivos: ArchivoMarca[]; onCambio: (a: ArchivoMarca[]) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<string>("contrato");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function subir(archivo: File) {
    setError("");
    setSubiendo(true);
    const permiso = await urlParaSubirArchivoMarca(marcaId, archivo.name, archivo.size);
    if ("error" in permiso) { setSubiendo(false); setError(permiso.error); return; }

    // El archivo va del navegador directo al bucket: por una acción del
    // servidor no cabe, y de paso no pasa dos veces por la red.
    const { error: eSubida } = await createClient()
      .storage.from("marcas").uploadToSignedUrl(permiso.ruta, permiso.token, archivo);
    if (eSubida) {
      setSubiendo(false);
      setError("No se pudo subir. Revisa tu conexión e inténtalo otra vez.");
      return;
    }

    const r = await registrarArchivoMarca(marcaId, tipo, permiso.ruta, archivo.name, archivo.size);
    setSubiendo(false);
    if ("error" in r) { setError(r.error); return; }
    onCambio(await archivosDeMarca(marcaId));
  }

  async function abrir(a: ArchivoMarca) {
    const url = await urlDeArchivoMarca(marcaId, a.ruta);
    if (!url) { setError("No se pudo abrir el archivo."); return; }
    window.open(url, "_blank", "noopener");
  }

  async function borrar(a: ArchivoMarca) {
    const r = await borrarArchivoMarca(a.id);
    if ("error" in r) { setError(r.error); return; }
    onCambio(archivos.filter((x) => x.id !== a.id));
  }

  return (
    <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display font-extrabold text-[15.5px]">Archivos de la marca</h2>
        <div className="flex items-center gap-2">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}
            className="bg-bg border border-border rounded-xl px-2.5 h-9 text-[12.5px] font-semibold outline-none cursor-pointer">
            {TIPOS_ARCHIVO.map(([k, txt]) => <option key={k} value={k}>{txt}</option>)}
          </select>
          <button onClick={() => entrada.current?.click()} disabled={subiendo}
            className="bg-accent-soft text-accent rounded-xl px-3 py-2 text-[12.5px] font-bold hover:bg-accent hover:text-white transition disabled:opacity-50">
            {subiendo ? "Subiendo…" : "+ Subir archivo"}
          </button>
        </div>
      </div>

      <input ref={entrada} type="file" className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (entrada.current) entrada.current.value = "";
          if (f) subir(f);
        }} />

      {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-xl px-3 py-2 mt-3">{error}</p>}

      {archivos.length === 0 ? (
        <p className="text-[13px] text-hint mt-3.5">
          Todavía no hay papeles de esta marca. Aquí van el contrato, la factura y los datos bancarios.
        </p>
      ) : (
        <ul className="mt-3.5 divide-y divide-border">
          {archivos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <span className="w-9 h-9 rounded-xl bg-accent-soft grid place-items-center text-[15px] shrink-0">
                {a.tipo === "bancario" ? "💳" : a.tipo === "contrato" ? "📝" : "📄"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold truncate">{a.nombre}</div>
                <div className="text-[11.5px] text-hint">
                  {[pesoArchivo(a.peso), fechaCorta(a.fecha)].filter(Boolean).join(" · ")}
                </div>
              </div>
              <button onClick={() => abrir(a)} title="Abrir"
                className="shrink-0 text-accent text-[15px] px-2 hover:scale-110 transition">⤓</button>
              <button onClick={() => borrar(a)} title="Borrar"
                className="shrink-0 text-hint text-[15px] px-2 hover:text-pink transition">✕</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Num({ icono, n, t }: { icono: string; n: number | string; t: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-extrabold flex items-center justify-center gap-1.5">
        <span className="text-[14px]">{icono}</span>{n}
      </div>
      <div className="text-[11.5px] text-hint">{t}</div>
    </div>
  );
}
