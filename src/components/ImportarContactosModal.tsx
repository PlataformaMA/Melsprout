"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  cursosParaImportar, importarContactos,
  type FilaImportar, type RolImportar, type ResultadoFila,
} from "@/lib/importar-actions";

const ROLES: { id: RolImportar; nombre: string }[] = [
  { id: "alumna", nombre: "Estudiante" },
  { id: "instructor", nombre: "Instructor" },
  { id: "admin", nombre: "Administrador" },
];

const inputC = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";
const TANDA = 25;

const PLANTILLA = "nombre,email,telefono\nAna López,ana@ejemplo.com,+52 81 1234 5678\n";

// ————— Lectura del CSV en el navegador —————

// Separa un CSV respetando comillas. Acepta coma, punto y coma o tabulador
// (Excel en español exporta con punto y coma).
function parsearCsv(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "");
  const primera = t.split(/\r?\n/)[0] || "";
  const sep = [",", ";", "\t"].sort((a, b) => primera.split(b).length - primera.split(a).length)[0];

  const filas: string[][] = [];
  let fila: string[] = [], celda = "", enComillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (enComillas) {
      if (c === '"' && t[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') enComillas = false;
      else celda += c;
    } else if (c === '"') enComillas = true;
    else if (c === sep) { fila.push(celda); celda = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      fila.push(celda); filas.push(fila); fila = []; celda = "";
    } else celda += c;
  }
  if (celda.length || fila.length) { fila.push(celda); filas.push(fila); }
  return filas.map((f) => f.map((x) => x.trim())).filter((f) => f.some((x) => x));
}

type Lectura = { filas: FilaImportar[]; sinCorreo: number; repetidas: number };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Encuentra qué columna es qué. Primero por encabezado; si no hay, adivina.
function interpretar(tabla: string[][]): Lectura {
  if (!tabla.length) return { filas: [], sinCorreo: 0, repetidas: 0 };

  const cab = tabla[0].map(norm);
  const tieneCabecera = !cab.some((x) => x.includes("@"));
  const buscar = (...claves: string[]) => cab.findIndex((h) => claves.some((k) => h === k || h.includes(k)));

  let iEmail = -1, iNombre = -1, iApellido = -1, iTel = -1;
  if (tieneCabecera) {
    iEmail = buscar("email", "correo", "mail", "e-mail");
    iNombre = buscar("nombre completo", "full name", "fullname", "nombre", "name", "first");
    iApellido = buscar("apellido", "last name", "lastname", "surname");
    iTel = buscar("telefono", "tel", "whatsapp", "celular", "phone", "movil");
  }
  const datos = tieneCabecera ? tabla.slice(1) : tabla;

  // Sin encabezado (o sin encontrarlo): la columna con arrobas es el correo.
  if (iEmail < 0) {
    const ancho = Math.max(...datos.map((f) => f.length));
    for (let c = 0; c < ancho; c++) {
      if (datos.filter((f) => (f[c] || "").includes("@")).length > datos.length / 2) { iEmail = c; break; }
    }
  }
  if (iNombre < 0) iNombre = [0, 1, 2].find((c) => c !== iEmail && c !== iTel) ?? -1;
  if (iTel < 0) {
    const ancho = Math.max(...datos.map((f) => f.length));
    for (let c = 0; c < ancho; c++) {
      if (c === iEmail || c === iNombre || c === iApellido) continue;
      if (datos.filter((f) => /\d{6,}/.test((f[c] || "").replace(/\D/g, ""))).length > datos.length / 2) { iTel = c; break; }
    }
  }

  const vistos = new Set<string>();
  let sinCorreo = 0, repetidas = 0;
  const filas: FilaImportar[] = [];
  for (const f of datos) {
    const email = (iEmail >= 0 ? f[iEmail] || "" : "").toLowerCase();
    if (!email.includes("@")) { sinCorreo++; continue; }
    if (vistos.has(email)) { repetidas++; continue; }
    vistos.add(email);
    const nombre = [iNombre >= 0 ? f[iNombre] : "", iApellido >= 0 ? f[iApellido] : ""].filter(Boolean).join(" ").trim();
    filas.push({ nombre, email, telefono: iTel >= 0 ? f[iTel] || "" : "" });
  }
  return { filas, sinCorreo, repetidas };
}

// ————— Modal —————

export function ImportarContactosModal({ onCerrar, onImportado }: { onCerrar: () => void; onImportado: () => void }) {
  const [paso, setPaso] = useState<"archivo" | "revisar" | "importando" | "listo">("archivo");
  const [cursos, setCursos] = useState<{ id: string; nombre: string }[]>([]);
  const [cursoId, setCursoId] = useState("");
  const [rol, setRol] = useState<RolImportar>("alumna");
  const [enviarCorreo, setEnviarCorreo] = useState(true);
  const [archivoNombre, setArchivoNombre] = useState("");
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [hechas, setHechas] = useState(0);
  const [resultados, setResultados] = useState<ResultadoFila[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { cursosParaImportar().then(setCursos); }, []);

  function leerArchivo(f: File) {
    setError("");
    setArchivoNombre(f.name);
    const r = new FileReader();
    r.onload = () => {
      const l = interpretar(parsearCsv(String(r.result || "")));
      if (!l.filas.length) { setError("No encontré ningún correo en el archivo. Revisa que tenga una columna de correo."); setLectura(null); return; }
      setLectura(l);
      setPaso("revisar");
    };
    r.readAsText(f, "utf-8");
  }

  async function importar() {
    if (!lectura) return;
    setPaso("importando"); setHechas(0); setResultados([]); setError("");
    const acumulado: ResultadoFila[] = [];
    for (let i = 0; i < lectura.filas.length; i += TANDA) {
      const tanda = lectura.filas.slice(i, i + TANDA);
      let r: Awaited<ReturnType<typeof importarContactos>>;
      try {
        r = await importarContactos({ filas: tanda, rol, cursoId: cursoId || null, enviarCorreo });
      } catch {
        r = { error: "Se perdió la conexión con el servidor." };
      }
      if ("error" in r) {
        setError(`${r.error} Se detuvo en la fila ${i + 1}; las anteriores sí quedaron.`);
        setResultados(acumulado); setPaso("listo"); onImportado();
        return;
      }
      acumulado.push(...r.resultados);
      setResultados([...acumulado]);
      setHechas(Math.min(i + TANDA, lectura.filas.length));
    }
    setPaso("listo");
    onImportado();
  }

  const resumen = useMemo(() => ({
    creadas: resultados.filter((r) => r.estado === "creada").length,
    existentes: resultados.filter((r) => r.estado === "existente").length,
    errores: resultados.filter((r) => r.estado === "error").length,
  }), [resultados]);

  const cursoNombre = cursos.find((c) => c.id === cursoId)?.nombre;

  function descargarResultados() {
    const lineas = ["email,estado,detalle", ...resultados.map((r) =>
      [r.email, r.estado, r.detalle].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + lineas.join("\n"));
    a.download = "resultado-importacion.csv";
    a.click();
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[640px] shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-extrabold text-lg">Importar contactos</h2>
          <button onClick={onCerrar} disabled={paso === "importando"} aria-label="Cerrar"
            className="text-sub hover:text-text text-xl leading-none disabled:opacity-40">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Paso 1: qué se les va a dar */}
          {(paso === "archivo" || paso === "revisar") && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12.5px] font-bold text-sub">Rol *</label>
                  <select value={rol} onChange={(e) => setRol(e.target.value as RolImportar)} className={`${inputC} mt-1.5`}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12.5px] font-bold text-sub">Curso al que entran</label>
                  <select value={cursoId} onChange={(e) => setCursoId(e.target.value)} className={`${inputC} mt-1.5`}>
                    <option value="">Ninguno (solo crear cuentas)</option>
                    {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-[13.5px] cursor-pointer">
                <input type="checkbox" checked={enviarCorreo} onChange={(e) => setEnviarCorreo(e.target.checked)} className="mt-0.5 accent-accent" />
                <span>
                  Enviar correo a las cuentas nuevas para que creen su contraseña
                  <span className="block text-[11.5px] text-hint">Quien ya tenía cuenta no recibe correo; solo se le da el acceso.</span>
                </span>
              </label>
            </>
          )}

          {/* Paso 1b: archivo */}
          {paso === "archivo" && (
            <div>
              <label className="text-[12.5px] font-bold text-sub">Archivo CSV *</label>
              <button type="button" onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) leerArchivo(f); }}
                className="w-full mt-1.5 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 transition bg-bg px-4 py-8 text-center">
                <span className="block text-[13.5px] font-bold text-accent">Elegir archivo o arrastrarlo aquí</span>
                <span className="block text-[11.5px] text-hint mt-1">
                  Columnas: <b>nombre</b>, <b>email</b> y <b>telefono</b> (opcional). Sirve el que exporta Excel, Google Sheets o Hotmart.
                </span>
                {archivoNombre && <span className="block text-[12px] text-sub mt-2">{archivoNombre}</span>}
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (fileRef.current) fileRef.current.value = ""; if (f) leerArchivo(f); }} />
              <a href={"data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + PLANTILLA)} download="plantilla-contactos.csv"
                className="inline-block mt-2 text-[12.5px] font-bold text-accent hover:underline">
                Descargar plantilla CSV
              </a>
            </div>
          )}

          {/* Paso 2: revisar */}
          {paso === "revisar" && lectura && (
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="bg-accent-soft text-accent font-bold rounded-full px-3 py-1">{lectura.filas.length} contactos</span>
                {lectura.repetidas > 0 && <span className="bg-bg text-sub rounded-full px-3 py-1">{lectura.repetidas} repetidos (se cuentan una vez)</span>}
                {lectura.sinCorreo > 0 && <span className="bg-amber-100 text-amber-700 rounded-full px-3 py-1">{lectura.sinCorreo} sin correo (se saltan)</span>}
                <button onClick={() => { setLectura(null); setPaso("archivo"); }} className="ml-auto text-accent font-bold hover:underline">Cambiar archivo</button>
              </div>
              <div className="mt-3 max-h-[260px] overflow-auto rounded-2xl border border-border">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-bg text-sub sticky top-0">
                    <tr><th className="text-left px-3 py-2 font-bold">Nombre</th><th className="text-left px-3 py-2 font-bold">Correo</th><th className="text-left px-3 py-2 font-bold">Teléfono</th></tr>
                  </thead>
                  <tbody>
                    {lectura.filas.slice(0, 200).map((f) => (
                      <tr key={f.email} className="border-t border-border">
                        <td className="px-3 py-1.5">{f.nombre || <span className="text-hint">—</span>}</td>
                        <td className="px-3 py-1.5">{f.email}</td>
                        <td className="px-3 py-1.5">{f.telefono || <span className="text-hint">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lectura.filas.length > 200 && <p className="text-[11.5px] text-hint px-3 py-2">… y {lectura.filas.length - 200} más.</p>}
              </div>
              <p className="text-[12px] text-hint leading-snug bg-bg rounded-xl px-3.5 py-2.5 mt-3">
                Se van a crear como <b>{ROLES.find((r) => r.id === rol)?.nombre}</b>
                {cursoNombre ? <> con acceso a <b>{cursoNombre}</b> (y a su grupo de comunidad)</> : <>, sin curso</>}.
                {enviarCorreo ? " A las cuentas nuevas les llega un correo para poner su contraseña." : " No se manda ningún correo."}
              </p>
            </div>
          )}

          {/* Paso 3: importando */}
          {paso === "importando" && lectura && (
            <div>
              <p className="text-[14px] font-bold">Importando… {hechas} de {lectura.filas.length}</p>
              <div className="h-2.5 bg-bg rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.round((hechas / lectura.filas.length) * 100)}%` }} />
              </div>
              <p className="text-[12px] text-hint mt-2">No cierres esta ventana. Si se mandan correos, va un poquito más lento.</p>
            </div>
          )}

          {/* Paso 4: listo */}
          {paso === "listo" && (
            <div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green/10 rounded-2xl py-3"><b className="text-xl text-green">{resumen.creadas}</b><span className="block text-[11.5px] text-sub">cuentas nuevas</span></div>
                <div className="bg-accent-soft rounded-2xl py-3"><b className="text-xl text-accent">{resumen.existentes}</b><span className="block text-[11.5px] text-sub">ya existían</span></div>
                <div className={`rounded-2xl py-3 ${resumen.errores ? "bg-red-100" : "bg-bg"}`}><b className={`text-xl ${resumen.errores ? "text-red-600" : "text-hint"}`}>{resumen.errores}</b><span className="block text-[11.5px] text-sub">con error</span></div>
              </div>
              <div className="mt-3 max-h-[240px] overflow-auto rounded-2xl border border-border">
                <table className="w-full text-[12.5px]">
                  <tbody>
                    {resultados.map((r, i) => (
                      <tr key={`${r.email}-${i}`} className="border-t border-border first:border-t-0">
                        <td className="px-3 py-1.5 whitespace-nowrap">{r.email}</td>
                        <td className="px-3 py-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            r.estado === "creada" ? "bg-green/10 text-green" : r.estado === "existente" ? "bg-accent-soft text-accent" : "bg-red-100 text-red-600"
                          }`}>{r.estado}</span>
                        </td>
                        <td className="px-3 py-1.5 text-sub">{r.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={descargarResultados} className="mt-2 text-[12.5px] font-bold text-accent hover:underline">Descargar resultado en CSV</button>
            </div>
          )}

          {error && <p className="text-[13px] text-pink">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          {paso === "listo" ? (
            <button onClick={onCerrar} className="rounded-xl bg-accent text-white px-5 py-2.5 text-[14px] font-bold hover:brightness-110 transition">Cerrar</button>
          ) : (
            <>
              <button onClick={onCerrar} disabled={paso === "importando"}
                className="rounded-xl border border-border px-5 py-2.5 text-[14px] font-bold text-sub hover:bg-bg transition disabled:opacity-50">Cancelar</button>
              <button onClick={importar} disabled={paso !== "revisar"}
                className="rounded-xl bg-accent text-white px-5 py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-50">
                {paso === "importando" ? "Importando…" : `Importar${lectura ? ` ${lectura.filas.length}` : ""}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
