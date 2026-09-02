"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cerrarSesion } from "@/lib/auth-actions";
import type { RetoRow, RetoTipo } from "@/lib/retos-db";
import type { PasoReto } from "@/lib/retos";
import {
  crearReto,
  actualizarReto,
  borrarReto,
  marcarAdmin,
  revisarReto,
  moderarComentario,
  borrarComentario,
  type RetoInput,
  type UsuarioAdmin,
  type Avance,
  type ComentarioAdmin,
} from "@/lib/admin-actions";
import { crearClaseVivo, actualizarClaseVivo, borrarClaseVivo, type ClaseVivo, type ClaseVivoInput } from "@/lib/vivo-actions";
import { SuperadminResumen } from "@/components/SuperadminResumen";
import { CrearUsuarioModal } from "@/components/CrearUsuarioModal";
import { crearModulo, actualizarModulo, borrarModulo, crearClase, actualizarClase, borrarClase, setVideoClaseDB, getVentaCurso, guardarVentaCurso, type ClaseInput, type VentaCurso } from "@/lib/cursos-actions";
import { generarSubtitulos, revisarSubtitulos, borrarSubtitulos } from "@/lib/subtitulos-actions";
import type { ModuloRow, ClaseRow } from "@/lib/cursos-db";
import { createClient } from "@/lib/supabase/client";

const TIPOS: { v: RetoTipo; label: string }[] = [
  { v: "semanal", label: "Semanal" },
  { v: "grupal", label: "Grupal" },
  { v: "personal", label: "Personal" },
  { v: "curso", label: "De curso (liga a clase)" },
];
type FormReto = {
  id?: string;
  tipo: RetoTipo;
  clase_id: string;
  titulo: string;
  emoji: string;
  descripcion: string;
  intro: string;
  accion: string;
  xp: number;
  pasos: PasoReto[];
  tipsTitulo: string;
  tipsItems: string;
  consejo: string;
  activo: boolean;
};

const FORM_VACIO: FormReto = {
  tipo: "semanal", clase_id: "", titulo: "", emoji: "🎯", descripcion: "", intro: "",
  accion: "compartirlo", xp: 50, pasos: [{ id: "paso1", titulo: "", subtitulo: "", tipo: "textarea", placeholder: "", max: 500 }],
  tipsTitulo: "Tips:", tipsItems: "", consejo: "", activo: true,
};

function rowToForm(r: RetoRow): FormReto {
  return {
    id: r.id, tipo: r.tipo, clase_id: r.clase_id || "", titulo: r.titulo, emoji: r.emoji || "🎯",
    descripcion: r.descripcion || "", intro: r.intro || "", accion: r.accion || "compartirlo", xp: r.xp ?? 50,
    pasos: r.pasos && r.pasos.length ? r.pasos : FORM_VACIO.pasos,
    tipsTitulo: r.tips?.titulo || "Tips:", tipsItems: (r.tips?.items || []).join(", "), consejo: r.consejo || "", activo: r.activo,
  };
}

export function AdminPanel({ retos, usuarios, avances, comentarios, clasesVivo, cursos, adminEmail }: { retos: RetoRow[]; usuarios: UsuarioAdmin[]; avances: Avance[]; comentarios: ComentarioAdmin[]; clasesVivo: ClaseVivo[]; cursos: { modulos: ModuloRow[]; clases: ClaseRow[] }; adminEmail: string }) {
  const router = useRouter();
  const clasesLista = cursos.clases.map((c) => ({ id: c.id, titulo: c.titulo }));
  const [tab, setTab] = useState<AdminTab>("resumen");
  const [form, setForm] = useState<FormReto | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");

  function nuevo() { setForm({ ...FORM_VACIO }); setMsg(""); }
  function editar(r: RetoRow) { setForm(rowToForm(r)); setMsg(""); }

  async function guardar() {
    if (!form) return;
    setGuardando(true); setMsg("");
    const input: RetoInput = {
      tipo: form.tipo, clase_id: form.clase_id, titulo: form.titulo, emoji: form.emoji,
      descripcion: form.descripcion, intro: form.intro, accion: form.accion, xp: Number(form.xp) || 50,
      pasos: form.pasos.map((p, i) => ({ ...p, id: p.id || `paso${i + 1}` })),
      tips: { titulo: form.tipsTitulo, items: form.tipsItems.split(",").map((s) => s.trim()).filter(Boolean) },
      consejo: form.consejo, activo: form.activo,
    };
    const r = form.id ? await actualizarReto(form.id, input) : await crearReto(input);
    setGuardando(false);
    if ("error" in r) { setMsg(r.error); return; }
    setForm(null); router.refresh();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Borrar este reto? No se puede deshacer.")) return;
    const r = await borrarReto(id);
    if ("error" in r) { alert(r.error); return; }
    router.refresh();
  }

  const TIPO_COLOR: Record<string, string> = {
    semanal: "bg-accent-soft text-accent", grupal: "bg-blue-soft text-blue",
    personal: "bg-pink-soft text-pink", curso: "bg-amber-100 text-amber-700",
  };

  const TITULOS: Record<string, string> = { resumen: "Resumen", retos: "Retos", clases: "Clases y Recursos", vivo: "Clases en vivo", avances: "Revisión de retos", comentarios: "Comunidad", usuarios: "Estudiantes" };

  return (
    <div className="min-h-screen bg-bg flex">
      <AdminSidebar tab={tab} setTab={(t) => { setTab(t); setForm(null); }} adminEmail={adminEmail}
        counts={{ retos: retos.length, vivo: clasesVivo.length, avances: avances.length, comentarios: comentarios.length, usuarios: usuarios.length }} />

      <div className="flex-1 min-w-0">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-8 py-6">
          {/* Encabezado de sección */}
          {/* Barra superior móvil (la barra lateral se oculta en móvil) */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center text-white text-sm">⚙️</div>
              <span className="font-display font-extrabold">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/app/ruta" className="text-[12px] font-bold text-accent bg-accent-soft rounded-lg px-3 py-1.5">👁️ Ver app</Link>
              <form action={cerrarSesion}><button className="text-[12px] font-bold text-pink bg-pink-soft rounded-lg px-3 py-1.5">Salir</button></form>
            </div>
          </div>

          <div className="mb-5">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">{TITULOS[tab]}</h1>
            <p className="text-sub text-[12.5px]">Panel de administración · Melsprout</p>
          </div>

          <AdminTabsMovil tab={tab} setTab={(t) => { setTab(t); setForm(null); }} />

          {/* Subpestañas: lo que en el menú va junto, aquí se separa. */}
          {(tab === "clases" || tab === "vivo") && (
            <SubPestanas tab={tab} setTab={setTab} opciones={[["clases", "Clases"], ["vivo", "Clases en vivo"]]} />
          )}
          {(tab === "retos" || tab === "avances") && (
            <SubPestanas tab={tab} setTab={setTab} opciones={[["retos", "Retos"], ["avances", "Revisión de retos"]]} />
          )}

          {tab === "resumen" ? (
            <SuperadminResumen irA={(t) => setTab(t as AdminTab)} />
          ) : tab === "retos" ? (
            <div>
              {!form ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-extrabold text-lg">Retos</h2>
                    <button onClick={nuevo} className="bg-accent text-white rounded-xl px-4 py-2.5 text-[14px] font-bold hover:brightness-110 transition shadow-sm">
                      + Nuevo reto
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {retos.length === 0 && (
                      <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub">
                        <div className="text-3xl mb-2">🎯</div>
                        Aún no hay retos. Crea el primero con <b className="text-accent">“+ Nuevo reto”</b>.
                      </div>
                    )}
                    {retos.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3.5 shadow-sm hover:border-accent/30 transition">
                        <span className="w-11 h-11 rounded-2xl bg-bg grid place-items-center text-xl shrink-0">{r.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[14.5px] truncate">{r.titulo}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${TIPO_COLOR[r.tipo] || "bg-bg text-sub"}`}>{r.tipo}</span>
                            {r.clase_id && <span className="text-[11px] text-hint">clase {r.clase_id}</span>}
                            <span className="text-[11px] text-hint">+{r.xp} XP</span>
                            {!r.activo && <span className="text-[11px] text-amber-700 font-semibold">oculto</span>}
                          </div>
                        </div>
                        <button onClick={() => editar(r)} className="text-[13px] text-accent font-semibold px-2 py-1 rounded-lg hover:bg-accent-soft transition shrink-0">Editar</button>
                        <button onClick={() => eliminar(r.id)} className="text-[13px] text-red-500 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition shrink-0">Borrar</button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <RetoForm form={form} setForm={setForm} guardar={guardar} guardando={guardando} cancelar={() => setForm(null)} msg={msg} clases={clasesLista} />
              )}
            </div>
          ) : tab === "clases" ? (
            <CursosTab cursos={cursos} onCambio={() => router.refresh()} />
          ) : tab === "vivo" ? (
            <VivoTab clases={clasesVivo} onCambio={() => router.refresh()} />
          ) : tab === "avances" ? (
            <AvancesTab avances={avances} onCambio={() => router.refresh()} />
          ) : tab === "comentarios" ? (
            <ComentariosTab comentarios={comentarios} onCambio={() => router.refresh()} />
          ) : (
            <UsuariosTab usuarios={usuarios} onCreado={() => router.refresh()} />
          )}
        </div>
      </div>
    </div>
  );
}

// ————— Barra lateral del admin —————
type AdminTab = "resumen" | "retos" | "clases" | "vivo" | "avances" | "comentarios" | "usuarios";
function AdminSidebar({ tab, setTab, adminEmail, counts }: {
  tab: AdminTab; setTab: (t: AdminTab) => void; adminEmail: string;
  counts: { retos: number; vivo: number; avances: number; comentarios: number; usuarios: number };
}) {
  const items: { id: AdminTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "resumen", label: "Resumen", icon: <IcoCasa />, count: -1 },
    { id: "usuarios", label: "Estudiantes", icon: <IcoGente />, count: counts.usuarios },
    { id: "clases", label: "Clases y Recursos", icon: <IcoLibro />, count: -1 },
    { id: "retos", label: "Retos", icon: <IcoEscudo />, count: counts.retos },
    { id: "comentarios", label: "Comunidad", icon: <IcoComunidad />, count: counts.comentarios },
  ];
  // "Clases en vivo" y "Revisión de retos" viven dentro de su sección, así que
  // la pestaña sigue marcada aunque estemos en la subpestaña.
  const activo = (id: AdminTab) =>
    id === tab ||
    (id === "clases" && tab === "vivo") ||
    (id === "retos" && tab === "avances");
  return (
    <div className="hidden md:flex flex-col w-64 shrink-0 bg-surface border-r border-border min-h-screen sticky top-0 p-4">
      <div className="flex items-center gap-3 px-2 mb-7">
        <div className="w-10 h-10 rounded-2xl bg-accent grid place-items-center text-white font-display font-extrabold text-lg shrink-0">M</div>
        <div className="min-w-0">
          <div className="font-display font-extrabold leading-tight">Melsprout</div>
          <div className="text-[11.5px] text-sub">Superadmin</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {items.map((it) => (
          <button key={it.id} onClick={() => setTab(it.id)}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-semibold transition ${activo(it.id) ? "bg-accent-soft text-accent" : "text-[#6B7280] hover:bg-bg"}`}>
            <span className="shrink-0">{it.icon}</span>
            <span className="flex-1 text-left">{it.label}</span>
            {it.count >= 0 && <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${activo(it.id) ? "bg-accent text-white" : "bg-bg text-hint"}`}>{it.count}</span>}
          </button>
        ))}
        <div className="text-[11px] text-hint font-semibold px-3 pt-4 pb-1 uppercase">Próximamente</div>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-hint/70 cursor-default"><span>👥</span> Comunidad (retos grupales)</div>
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="text-[11px] text-hint px-3 truncate mb-2">{adminEmail}</div>
        <Link href="/app/ruta" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-sub hover:bg-bg transition">
          👁️ Ver como usuario
        </Link>
        <form action={cerrarSesion}>
          <button className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-pink hover:bg-pink-soft transition">
            🚪 Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

// Selector de sección para móvil (la barra lateral se oculta en móvil).
// ————— Iconos de la barra lateral (línea, como el diseño) —————
const traz = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IcoCasa() { return <svg width="20" height="20" viewBox="0 0 24 24" {...traz}><path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V15h-7v5.5H5A1.5 1.5 0 0 1 3.5 19z" /></svg>; }
function IcoGente() { return <svg width="20" height="20" viewBox="0 0 24 24" {...traz}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16.5 5.4a3 3 0 0 1 0 5.6M21 20a6 6 0 0 0-3.6-5.5" /></svg>; }
function IcoLibro() { return <svg width="20" height="20" viewBox="0 0 24 24" {...traz}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 0 4 21z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 1 20 21z" /></svg>; }
function IcoEscudo() { return <svg width="20" height="20" viewBox="0 0 24 24" {...traz}><path d="M12 3.5 5.5 6v5.5c0 4 2.8 7.4 6.5 8.9 3.7-1.5 6.5-4.9 6.5-8.9V6z" /><path d="m9.4 12.2 1.9 1.9 3.4-3.6" /></svg>; }
function IcoComunidad() { return <svg width="20" height="20" viewBox="0 0 24 24" {...traz}><circle cx="9.5" cy="8" r="3.2" /><path d="M3.5 20a6 6 0 0 1 12 0" /><path d="M18 6.5v4M20 8.5h-4" /></svg>; }
function IcoTabla() { return <svg width="20" height="20" viewBox="0 0 24 24" {...traz}><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 15v-3M12 15V9M16 15v-5" /></svg>; }
function IcoSenal() { return <svg width="20" height="20" viewBox="0 0 24 24" {...traz}><circle cx="12" cy="12" r="2.5" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" /></svg>; }

// Subpestañas dentro de una sección del menú.
function SubPestanas({ tab, setTab, opciones }: {
  tab: AdminTab; setTab: (t: AdminTab) => void; opciones: [AdminTab, string][];
}) {
  return (
    <div className="flex gap-5 border-b border-border mb-5">
      {opciones.map(([id, txt]) => (
        <button key={id} onClick={() => setTab(id)}
          className={`pb-2.5 text-[13.5px] font-bold transition -mb-px border-b-2 whitespace-nowrap ${
            tab === id ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
          }`}>
          {txt}
        </button>
      ))}
    </div>
  );
}

function AdminTabsMovil({ tab, setTab }: { tab: AdminTab; setTab: (t: AdminTab) => void }) {
  return (
    <div className="md:hidden flex flex-wrap gap-1 bg-surface border border-border rounded-2xl p-1 mb-5 shadow-sm">
      {([
        ["resumen", "Resumen"], ["usuarios", "Estudiantes"], ["clases", "Clases y Recursos"],
        ["retos", "Retos"], ["comentarios", "Comunidad"],
      ] as [AdminTab, string][]).map(([t, txt]) => (
        <button key={t} onClick={() => setTab(t)}
          className={`px-3 py-2 rounded-xl text-[13px] font-bold transition ${tab === t ? "bg-accent text-white" : "text-sub"}`}>
          {txt}
        </button>
      ))}
    </div>
  );
}

// ————— Avances (envíos de retos) —————
function AvancesTab({ avances, onCambio }: { avances: Avance[]; onCambio: () => void }) {
  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "aprobado" | "rechazado">("todos");
  const lista = filtro === "todos" ? avances : avances.filter((a) => a.revision === filtro);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="font-display font-extrabold text-lg mr-2">Avances</h2>
        {(["todos", "pendiente", "aprobado", "rechazado"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-[12px] font-bold rounded-full px-3 py-1.5 transition ${filtro === f ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
            {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub">
          <div className="text-3xl mb-2">📭</div>
          No hay envíos {filtro !== "todos" ? `(${filtro})` : "aún"}.
        </div>
      ) : (
        <div className="space-y-2.5">
          {lista.map((a) => (
            <AvanceFila key={`${a.userId}-${a.retoId}`} a={a} onCambio={onCambio} />
          ))}
        </div>
      )}
    </div>
  );
}

const REV_BADGE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700", aprobado: "bg-green/15 text-green", rechazado: "bg-red-100 text-red-600",
};

function AvanceFila({ a, onCambio }: { a: Avance; onCambio: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const esVideo = a.archivoUrl && /\.(mp4|mov|webm|quicktime)(\?|$)/i.test(a.archivoUrl);
  const esImagen = a.archivoUrl && /\.(png|jpe?g|webp)(\?|$)/i.test(a.archivoUrl);

  async function revisar(v: "aprobado" | "rechazado") {
    setCargando(true);
    const r = await revisarReto(a.userId, a.retoId, v);
    setCargando(false);
    if ("error" in r) { alert(r.error); return; }
    onCambio();
  }

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setAbierto((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <span className="w-10 h-10 rounded-xl bg-bg grid place-items-center text-lg shrink-0">{a.retoEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] truncate">{a.nombre}</div>
          <div className="text-[12px] text-sub truncate">{a.retoTitulo}</div>
        </div>
        <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${a.estado === "publicado" ? "bg-accent-soft text-accent" : "bg-bg text-sub"}`}>{a.estado}</span>
        <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${REV_BADGE[a.revision]}`}>{a.revision}</span>
        <span className={`text-hint transition-transform ${abierto ? "rotate-90" : ""}`}>›</span>
      </button>

      {abierto && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {/* Respuestas */}
          {Object.entries(a.respuestas).map(([k, v]) => (
            v && !/^https?:\/\//.test(v) ? (
              <div key={k}>
                <div className="text-[11px] font-bold text-hint uppercase">{k}</div>
                <p className="text-[13.5px] text-text whitespace-pre-wrap">{v}</p>
              </div>
            ) : null
          ))}
          {/* Archivo */}
          {esImagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.archivoUrl!} alt="envío" className="max-h-64 rounded-xl border border-border" />
          )}
          {esVideo && (
            <video src={a.archivoUrl!} controls className="max-h-72 rounded-xl border border-border w-full" />
          )}
          {a.archivoUrl && !esImagen && !esVideo && (
            <a href={a.archivoUrl} target="_blank" rel="noreferrer" className="text-accent text-[13px] font-semibold underline">Ver archivo enviado</a>
          )}

          {/* Acciones de revisión */}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => revisar("aprobado")} disabled={cargando || a.revision === "aprobado"}
              className="bg-green text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-50 transition">
              ✓ Aprobar
            </button>
            <button onClick={() => revisar("rechazado")} disabled={cargando || a.revision === "rechazado"}
              className="bg-surface border border-red-300 text-red-600 rounded-lg px-4 py-2 text-[13px] font-bold hover:bg-red-50 disabled:opacity-50 transition">
              ✕ Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ————— Formulario de reto —————
function RetoForm({ form, setForm, guardar, guardando, cancelar, msg, clases: clasesLista }: {
  clases: { id: string; titulo: string }[];
  form: FormReto; setForm: (f: FormReto) => void; guardar: () => void; guardando: boolean; cancelar: () => void; msg: string;
}) {
  const set = (patch: Partial<FormReto>) => setForm({ ...form, ...patch });
  const setPaso = (i: number, patch: Partial<PasoReto>) => {
    const pasos = form.pasos.map((p, j) => (j === i ? { ...p, ...patch } : p));
    setForm({ ...form, pasos });
  };
  const inputC = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-[14px] outline-none focus:border-accent";

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <h2 className="font-display font-extrabold text-lg">{form.id ? "Editar reto" : "Nuevo reto"}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-[13px] font-semibold">Tipo
          <select value={form.tipo} onChange={(e) => set({ tipo: e.target.value as RetoTipo })} className={inputC}>
            {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
        </label>
        {form.tipo === "curso" && (
          <label className="text-[13px] font-semibold">Clase ligada
            <select value={form.clase_id} onChange={(e) => set({ clase_id: e.target.value })} className={inputC}>
              <option value="">— elige clase —</option>
              {clasesLista.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
            </select>
          </label>
        )}
        <label className="text-[13px] font-semibold">Emoji
          <input value={form.emoji} onChange={(e) => set({ emoji: e.target.value })} className={inputC} />
        </label>
        <label className="text-[13px] font-semibold">XP
          <input type="number" value={form.xp} onChange={(e) => set({ xp: Number(e.target.value) })} className={inputC} />
        </label>
      </div>

      <label className="text-[13px] font-semibold block">Título
        <input value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} className={inputC} placeholder="Ej: Tu propósito y tu meta de 90 días" />
      </label>
      <label className="text-[13px] font-semibold block">Descripción
        <input value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} className={inputC} />
      </label>
      <label className="text-[13px] font-semibold block">Intro (banner)
        <input value={form.intro} onChange={(e) => set({ intro: e.target.value })} className={inputC} />
      </label>

      {/* Pasos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold">Pasos</span>
          <button onClick={() => setForm({ ...form, pasos: [...form.pasos, { id: `paso${form.pasos.length + 1}`, titulo: "", subtitulo: "", tipo: "textarea", placeholder: "", max: 500 }] })}
            className="text-[13px] text-accent font-semibold">+ Agregar paso</button>
        </div>
        <div className="space-y-3">
          {form.pasos.map((p, i) => (
            <div key={i} className="border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-accent">Paso {i + 1}</span>
                {form.pasos.length > 1 && <button onClick={() => setForm({ ...form, pasos: form.pasos.filter((_, j) => j !== i) })} className="text-[12px] text-red-500">Quitar</button>}
              </div>
              <input value={p.titulo} onChange={(e) => setPaso(i, { titulo: e.target.value })} className={inputC} placeholder="Título del paso" />
              <input value={p.subtitulo || ""} onChange={(e) => setPaso(i, { subtitulo: e.target.value })} className={inputC} placeholder="Subtítulo / instrucción" />
              <div className="grid grid-cols-2 gap-2">
                <select value={p.tipo} onChange={(e) => setPaso(i, { tipo: e.target.value as PasoReto["tipo"] })} className={inputC}>
                  <option value="textarea">Texto largo</option>
                  <option value="texto">Texto corto</option>
                  <option value="archivo">Archivo (imagen/video)</option>
                </select>
                <input value={p.placeholder || ""} onChange={(e) => setPaso(i, { placeholder: e.target.value })} className={inputC} placeholder="Placeholder" />
              </div>
              <input value={p.octi || ""} onChange={(e) => setPaso(i, { octi: e.target.value })} className={inputC} placeholder="🐙 Mensaje de Octi para este paso (opcional)" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-[13px] font-semibold">Tips (separados por coma)
          <input value={form.tipsItems} onChange={(e) => set({ tipsItems: e.target.value })} className={inputC} placeholder="Sé específico, Medible, Alcanzable" />
        </label>
        <label className="text-[13px] font-semibold">Consejo de Octi
          <input value={form.consejo} onChange={(e) => set({ consejo: e.target.value })} className={inputC} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-[13px] font-semibold">
        <input type="checkbox" checked={form.activo} onChange={(e) => set({ activo: e.target.checked })} /> Visible para usuarios
      </label>

      {msg && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2">{msg}</p>}

      <div className="flex gap-2">
        <button onClick={guardar} disabled={guardando} className="bg-accent text-white rounded-xl px-5 py-2.5 text-[14px] font-bold hover:brightness-110 disabled:opacity-60 transition">
          {guardando ? "Guardando…" : "Guardar reto"}
        </button>
        <button onClick={cancelar} className="bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] font-semibold">Cancelar</button>
      </div>
    </div>
  );
}

// ————— Cursos: módulos + clases + video —————
function CursosTab({ cursos, onCambio }: { cursos: { modulos: ModuloRow[]; clases: ClaseRow[] }; onCambio: () => void }) {
  const [nuevoMod, setNuevoMod] = useState("");
  const [creando, setCreando] = useState(false);
  const inputC = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent";

  async function agregarModulo() {
    if (!nuevoMod.trim()) return;
    setCreando(true);
    const r = await crearModulo(nuevoMod, "", "accent");
    setCreando(false);
    if ("error" in r) { alert(r.error); return; }
    setNuevoMod(""); onCambio();
  }

  return (
    <div>
      <p className="text-sub text-[13.5px] mb-4">Gestiona los módulos y clases del curso. Sube el video de cada clase (el alumno la completa al ver el <b>85%</b> → +100 XP).</p>
      {cursos.modulos.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[13px] text-amber-800 mb-4">
          Aún no hay módulos en la BD (la app muestra el demo). Corre el SQL <b>15_cursos.sql</b> para sembrar tu currículum, o crea módulos aquí.
        </div>
      )}

      <div className="flex gap-2 mb-5">
        <input value={nuevoMod} onChange={(e) => setNuevoMod(e.target.value)} placeholder="Nombre del nuevo módulo" className={inputC} />
        <button onClick={agregarModulo} disabled={creando} className="bg-accent text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-60 shrink-0">+ Módulo</button>
      </div>

      <div className="space-y-6">
        {cursos.modulos.map((m) => (
          <ModuloBloque key={m.id} modulo={m} clases={cursos.clases.filter((c) => c.modulo_id === m.id)} onCambio={onCambio} />
        ))}
      </div>
    </div>
  );
}

function ModuloBloque({ modulo, clases, onCambio }: { modulo: ModuloRow; clases: ClaseRow[]; onCambio: () => void }) {
  const [nombre, setNombre] = useState(modulo.nombre);
  const [nuevaClase, setNuevaClase] = useState("");
  const [editando, setEditando] = useState(false);
  const [venta, setVenta] = useState(false);
  const inputC = "bg-bg border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent";

  async function guardarNombre() { await actualizarModulo(modulo.id, nombre, modulo.descripcion, modulo.color); setEditando(false); onCambio(); }
  async function borrar() { if (!confirm(`¿Borrar el módulo «${modulo.nombre}» y sus clases?`)) return; const r = await borrarModulo(modulo.id); if ("error" in r) { alert(r.error); return; } onCambio(); }
  async function agregarClase() { if (!nuevaClase.trim()) return; const r = await crearClase(modulo.id, { titulo: nuevaClase }); if ("error" in r) { alert(r.error); return; } setNuevaClase(""); onCambio(); }

  return (
    <div className="border border-border rounded-2xl p-4 bg-surface shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {editando ? (
          <>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${inputC} flex-1 font-bold`} />
            <button onClick={guardarNombre} className="text-[12px] font-bold text-accent">Guardar</button>
          </>
        ) : (
          <>
            <h3 className="font-display font-extrabold flex-1">{modulo.nombre} <span className="text-[12px] text-hint font-normal">({clases.length})</span></h3>
            <button onClick={() => setEditando(true)} className="text-[12px] font-semibold text-accent">Renombrar</button>
            {modulo.especial && (
              <button onClick={() => setVenta((v) => !v)} className="text-[12px] font-semibold text-accent">
                {venta ? "Cerrar textos" : "Textos de venta"}
              </button>
            )}
            <button onClick={borrar} className="text-[12px] font-semibold text-red-500">Borrar</button>
          </>
        )}
      </div>
      {venta && <TextosVenta moduloId={modulo.id} />}

      <div className="space-y-2">
        {clases.map((c) => <ClaseCursoFila key={c.id} clase={c} onCambio={onCambio} />)}
      </div>
      <div className="flex gap-2 mt-3">
        <input value={nuevaClase} onChange={(e) => setNuevaClase(e.target.value)} placeholder="Título de nueva clase" className={`${inputC} flex-1`} />
        <button onClick={agregarClase} className="bg-surface border border-border rounded-lg px-3 py-2 text-[13px] font-semibold hover:bg-bg shrink-0">+ Clase</button>
      </div>
    </div>
  );
}

// Textos de la landing de un curso especial: la promesa, las listas y el precio.
function TextosVenta({ moduloId }: { moduloId: string }) {
  const [v, setV] = useState<VentaCurso | null>(null);
  const [estado, setEstado] = useState("");
  const inputC = "bg-bg border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent w-full";

  useEffect(() => { getVentaCurso(moduloId).then(setV); }, [moduloId]);
  if (!v) return <p className="text-[13px] text-hint py-3">Cargando textos…</p>;

  const set = (p: Partial<VentaCurso>) => setV({ ...v, ...p });
  // Las listas se editan como líneas: una por renglón.
  const lineas = (xs: string[]) => xs.join("\n");
  const aLista = (t: string) => t.split("\n");

  async function guardar() {
    setEstado("Guardando…");
    const r = await guardarVentaCurso(moduloId, v!);
    setEstado("error" in r ? r.error : "Guardado ✓");
    setTimeout(() => setEstado(""), 2500);
  }

  return (
    <div className="border border-border rounded-2xl p-4 bg-bg mb-3 space-y-3">
      <div>
        <label className="text-[12px] font-bold text-sub">La promesa (sale en la landing y en Detalles)</label>
        <textarea value={v.descripcion} onChange={(e) => set({ descripcion: e.target.value })} rows={3} className={`${inputC} mt-1 resize-none`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[12px] font-bold text-sub">Habilidades que obtendrás (una por línea)</label>
          <textarea value={lineas(v.habilidades)} onChange={(e) => set({ habilidades: aLista(e.target.value) })} rows={6} className={`${inputC} mt-1 resize-none`} />
        </div>
        <div>
          <label className="text-[12px] font-bold text-sub">Herramientas que aprenderás (una por línea)</label>
          <textarea value={lineas(v.herramientas)} onChange={(e) => set({ herramientas: aLista(e.target.value) })} rows={6} className={`${inputC} mt-1 resize-none`} />
        </div>
      </div>

      <div>
        <label className="text-[12px] font-bold text-sub">Nota del patrocinador (recuadro morado del certificado)</label>
        <textarea value={v.incluye} onChange={(e) => set({ incluye: e.target.value })} rows={2} className={`${inputC} mt-1 resize-none`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div><label className="text-[12px] font-bold text-sub">Nivel</label>
          <input value={v.nivel} onChange={(e) => set({ nivel: e.target.value })} className={`${inputC} mt-1`} /></div>
        <div><label className="text-[12px] font-bold text-sub">Semanas</label>
          <input type="number" value={v.semanas ?? ""} onChange={(e) => set({ semanas: e.target.value ? Number(e.target.value) : null })} className={`${inputC} mt-1`} /></div>
        <div><label className="text-[12px] font-bold text-sub">Series</label>
          <input type="number" value={v.series ?? ""} onChange={(e) => set({ series: e.target.value ? Number(e.target.value) : null })} className={`${inputC} mt-1`} /></div>
        <div><label className="text-[12px] font-bold text-sub">Precio</label>
          <input type="number" step="0.01" value={v.precio ?? ""} onChange={(e) => set({ precio: e.target.value ? Number(e.target.value) : null })} className={`${inputC} mt-1`} /></div>
        <div><label className="text-[12px] font-bold text-sub">Moneda</label>
          <input value={v.moneda} onChange={(e) => set({ moneda: e.target.value.toUpperCase() })} placeholder="MXN" className={`${inputC} mt-1`} /></div>
      </div>

      <div>
        <label className="text-[12px] font-bold text-sub">Enlace de pago (deja vacío y el botón dice «Próximamente»)</label>
        <input value={v.checkoutUrl} onChange={(e) => set({ checkoutUrl: e.target.value })} placeholder="https://…" className={`${inputC} mt-1`} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={guardar} className="bg-accent text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:brightness-110 transition">Guardar textos</button>
        {estado && <span className="text-[12.5px] font-semibold text-sub">{estado}</span>}
      </div>
    </div>
  );
}

function ClaseCursoFila({ clase, onCambio }: { clase: ClaseRow; onCambio: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ titulo: clase.titulo, instructor: clase.instructor || "", duracion_min: clase.duracion_min, nivel: clase.nivel || "basico", reto_texto: clase.reto_texto || "", reto_instrucciones: clase.reto_instrucciones || "", portada: clase.portada || "", video: clase.video_url || "" });
  const [subiendo, setSubiendo] = useState(false);
  const [msg, setMsg] = useState("");
  const [subs, setSubs] = useState<string | null>(clase.subtitulos_url);
  const [subsMsg, setSubsMsg] = useState("");
  const [subsOcupado, setSubsOcupado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputC = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent";

  async function subir(file: File) {
    const mb = file.size / (1024 * 1024);
    if (mb > 200) { setMsg(`Video pesa ${mb.toFixed(0)} MB (máx 200). Comprímelo o usa YouTube.`); return; }
    setSubiendo(true); setMsg("");
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `clases/${clase.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("retos").upload(path, file, { upsert: true });
      if (error) setMsg("No se pudo subir.");
      else { const { data } = supabase.storage.from("retos").getPublicUrl(path); setF((s) => ({ ...s, video: data.publicUrl })); await setVideoClaseDB(clase.id, data.publicUrl); setMsg("✅ Video subido"); onCambio(); }
    } catch { setMsg("Error al subir."); }
    setSubiendo(false);
  }
  async function guardar() {
    const input: ClaseInput = { titulo: f.titulo, instructor: f.instructor, duracion_min: Number(f.duracion_min) || 12, nivel: f.nivel, reto_texto: f.reto_texto, reto_instrucciones: f.reto_instrucciones, portada: f.portada, video_url: f.video };
    const r = await actualizarClase(clase.id, input);
    if ("error" in r) { setMsg(r.error); return; }
    setMsg("✅ Guardado"); onCambio();
  }
  async function borrar() { if (!confirm("¿Borrar esta clase?")) return; const r = await borrarClase(clase.id); if ("error" in r) { alert(r.error); return; } onCambio(); }

  function leerEstado(r: Awaited<ReturnType<typeof generarSubtitulos>>) {
    if ("error" in r) { setSubsMsg(r.error); return; }
    if (r.estado === "listo") { setSubs(r.url); setSubsMsg("✅ Subtítulos listos"); onCambio(); return; }
    if (r.estado === "procesando") { setSubsMsg("⏳ Transcribiendo… dale a «Actualizar» en un minuto."); return; }
    if (r.estado === "sin-video") { setSubsMsg("Esta clase no tiene video."); return; }
    setSubsMsg("Falta configurar ASSEMBLYAI_API_KEY en Vercel.");
  }
  async function generarSubs() {
    setSubsOcupado(true); setSubsMsg("Mandando el video a transcribir…");
    leerEstado(await generarSubtitulos(clase.id));
    setSubsOcupado(false);
  }
  async function revisarSubs() {
    setSubsOcupado(true); setSubsMsg("Revisando…");
    leerEstado(await revisarSubtitulos(clase.id));
    setSubsOcupado(false);
  }
  async function quitarSubs() {
    if (!confirm("¿Quitar los subtítulos de esta clase?")) return;
    setSubsOcupado(true);
    const r = await borrarSubtitulos(clase.id);
    setSubs("error" in r ? subs : null);
    setSubsMsg("error" in r ? r.error : "Subtítulos quitados");
    setSubsOcupado(false); onCambio();
  }

  return (
    <div className="border border-border rounded-xl bg-bg/40">
      <button onClick={() => setAbierto((v) => !v)} className="w-full flex items-center gap-2 px-3 py-2 text-left">
        <span className="text-[13.5px] font-semibold flex-1 min-w-0 truncate">{clase.titulo}</span>
        {clase.video_url && <span className="text-[11px] font-bold text-green shrink-0">🎬</span>}
        <span className="text-[11px] text-hint shrink-0">{clase.nivel}</span>
        <span className={`text-hint transition-transform ${abierto ? "rotate-90" : ""}`}>›</span>
      </button>
      {abierto && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
          <input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className={inputC} placeholder="Título" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={f.instructor} onChange={(e) => setF({ ...f, instructor: e.target.value })} className={inputC} placeholder="Instructor" />
            <input type="number" value={f.duracion_min} onChange={(e) => setF({ ...f, duracion_min: Number(e.target.value) })} className={inputC} placeholder="Min" />
            <select value={f.nivel} onChange={(e) => setF({ ...f, nivel: e.target.value })} className={inputC}><option value="basico">Básico</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option></select>
          </div>
          <input value={f.reto_texto} onChange={(e) => setF({ ...f, reto_texto: e.target.value })} className={inputC} placeholder="Texto del reto de esta clase" />
          <input value={f.portada} onChange={(e) => setF({ ...f, portada: e.target.value })} className={inputC} placeholder="URL de la portada (si se deja vacía se usa la miniatura de YouTube)" />
          <textarea value={f.reto_instrucciones} onChange={(e) => setF({ ...f, reto_instrucciones: e.target.value })} rows={5} className={inputC} placeholder="Instrucciones: qué se espera, qué debe incluir la respuesta y cómo se evalúa" />
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={f.video} onChange={(e) => setF({ ...f, video: e.target.value })} className={`${inputC} flex-1`} placeholder="Enlace del video (.mp4) o sube →" />
            <input ref={fileRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) subir(file); }} />
            <button onClick={() => fileRef.current?.click()} disabled={subiendo} className="bg-surface border border-border rounded-lg px-3 py-2 text-[13px] font-semibold hover:bg-bg disabled:opacity-60 shrink-0">{subiendo ? "Subiendo…" : "Subir video"}</button>
          </div>
          {msg && <p className="text-[12px] text-sub">{msg}</p>}

          {/* Subtítulos automáticos (AssemblyAI). Solo para videos propios .mp4 */}
          <div className="border border-border rounded-lg p-2.5 bg-surface/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-semibold">Subtítulos</span>
              {subs
                ? <a href={subs} target="_blank" rel="noreferrer" className="text-[11.5px] font-bold text-green">✅ listos (ver .vtt)</a>
                : <span className="text-[11.5px] text-hint">sin generar</span>}
              <div className="flex gap-2 ml-auto">
                <button onClick={generarSubs} disabled={subsOcupado || !f.video}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 text-[12.5px] font-semibold hover:bg-bg disabled:opacity-50">
                  {subs ? "Regenerar" : "Generar"}
                </button>
                <button onClick={revisarSubs} disabled={subsOcupado}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 text-[12.5px] font-semibold hover:bg-bg disabled:opacity-50">
                  Actualizar
                </button>
                {subs && (
                  <button onClick={quitarSubs} disabled={subsOcupado}
                    className="text-[12.5px] font-semibold text-red-500 px-2 disabled:opacity-50">Quitar</button>
                )}
              </div>
            </div>
            {subsMsg && <p className="text-[12px] text-sub mt-1.5">{subsMsg}</p>}
          </div>

          <div className="flex gap-2">
            <button onClick={guardar} className="bg-accent text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:brightness-110">Guardar clase</button>
            <button onClick={borrar} className="text-[13px] font-semibold text-red-500 px-2">Borrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ————— Clases en vivo —————
type FormVivo = { id?: string; titulo: string; categoria: string; instructor: string; fecha: string; hora: string; duracion_min: number; thumbnail_url: string; stream_url: string; grabacion_url: string; xp: number; descripcion: string };
const VIVO_VACIO: FormVivo = { titulo: "", categoria: "", instructor: "", fecha: "", hora: "", duracion_min: 60, thumbnail_url: "", stream_url: "", grabacion_url: "", xp: 50, descripcion: "" };

function VivoTab({ clases, onCambio }: { clases: ClaseVivo[]; onCambio: () => void }) {
  const [form, setForm] = useState<FormVivo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const inputC = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-[14px] outline-none focus:border-accent";

  function editar(c: ClaseVivo) {
    const d = new Date(c.inicia_at);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    setForm({ id: c.id, titulo: c.titulo, categoria: c.categoria || "", instructor: c.instructor || "", fecha: iso.slice(0, 10), hora: iso.slice(11, 16), duracion_min: c.duracion_min, thumbnail_url: c.thumbnail_url || "", stream_url: c.stream_url || "", grabacion_url: c.grabacion_url || "", xp: c.xp, descripcion: c.descripcion || "" });
    setMsg("");
  }

  async function guardar() {
    if (!form) return;
    if (!form.titulo.trim() || !form.fecha || !form.hora) { setMsg("Título, fecha y hora son obligatorios."); return; }
    setGuardando(true); setMsg("");
    const input: ClaseVivoInput = {
      titulo: form.titulo, categoria: form.categoria, instructor: form.instructor, descripcion: form.descripcion,
      inicia_at: new Date(`${form.fecha}T${form.hora}`).toISOString(),
      duracion_min: Number(form.duracion_min) || 60, thumbnail_url: form.thumbnail_url, stream_url: form.stream_url, grabacion_url: form.grabacion_url, xp: Number(form.xp) || 50,
    };
    const r = form.id ? await actualizarClaseVivo(form.id, input) : await crearClaseVivo(input);
    setGuardando(false);
    if ("error" in r) { setMsg(r.error); return; }
    setForm(null); onCambio();
  }
  async function eliminar(id: string) {
    if (!confirm("¿Borrar esta clase en vivo?")) return;
    const r = await borrarClaseVivo(id);
    if ("error" in r) { alert(r.error); return; }
    onCambio();
  }

  return (
    <div>
      {!form ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-lg">Clases en vivo</h2>
            <button onClick={() => setForm({ ...VIVO_VACIO })} className="bg-accent text-white rounded-xl px-4 py-2.5 text-[14px] font-bold hover:brightness-110 transition shadow-sm">+ Nueva clase</button>
          </div>
          <div className="space-y-2.5">
            {clases.length === 0 && <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub"><div className="text-3xl mb-2">📡</div>Aún no hay clases en vivo.</div>}
            {clases.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3.5 shadow-sm">
                <span className="w-11 h-11 rounded-2xl bg-bg grid place-items-center text-xl shrink-0">📡</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14.5px] truncate">{c.titulo}</div>
                  <div className="text-[12px] text-sub">{new Date(c.inicia_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {c.instructor || "—"} · +{c.xp} XP {c.grabacion_url ? "· 🎬 grabación" : ""}</div>
                </div>
                <button onClick={() => editar(c)} className="text-[13px] text-accent font-semibold px-2 py-1 rounded-lg hover:bg-accent-soft transition">Editar</button>
                <button onClick={() => eliminar(c.id)} className="text-[13px] text-red-500 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition">Borrar</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3 max-w-xl">
          <h2 className="font-display font-extrabold text-lg">{form.id ? "Editar clase en vivo" : "Nueva clase en vivo"}</h2>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputC} placeholder="Título" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputC} placeholder="Categoría (ej. TikTok)" />
            <input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} className={inputC} placeholder="Instructor" />
            <label className="text-[12px] font-semibold text-sub">Fecha<input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={inputC} /></label>
            <label className="text-[12px] font-semibold text-sub">Hora<input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className={inputC} /></label>
            <label className="text-[12px] font-semibold text-sub">Duración (min)<input type="number" value={form.duracion_min} onChange={(e) => setForm({ ...form, duracion_min: Number(e.target.value) })} className={inputC} /></label>
            <label className="text-[12px] font-semibold text-sub">XP<input type="number" value={form.xp} onChange={(e) => setForm({ ...form, xp: Number(e.target.value) })} className={inputC} /></label>
          </div>
          <input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} className={inputC} placeholder="Enlace de la transmisión (Zoom/YouTube/Meet)" />
          <input value={form.grabacion_url} onChange={(e) => setForm({ ...form, grabacion_url: e.target.value })} className={inputC} placeholder="Enlace de la grabación (opcional, al terminar)" />
          <input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className={inputC} placeholder="URL de imagen/portada (opcional)" />
          {msg && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2">{msg}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} disabled={guardando} className="bg-accent text-white rounded-xl px-5 py-2.5 text-[14px] font-bold hover:brightness-110 disabled:opacity-60 transition">{guardando ? "Guardando…" : "Guardar"}</button>
            <button onClick={() => setForm(null)} className="bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] font-semibold">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ————— Comentarios (moderación) —————
function ComentariosTab({ comentarios, onCambio }: { comentarios: ComentarioAdmin[]; onCambio: () => void }) {
  if (comentarios.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center text-sub">
        <div className="text-3xl mb-2">💬</div>
        Aún no hay comentarios en la comunidad.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {comentarios.map((c) => <ComentarioFila key={c.id} c={c} onCambio={onCambio} />)}
    </div>
  );
}

function ComentarioFila({ c, onCambio }: { c: ComentarioAdmin; onCambio: () => void }) {
  const [cargando, setCargando] = useState(false);
  async function accion(fn: Promise<{ ok: true } | { error: string }>) {
    setCargando(true);
    const r = await fn;
    setCargando(false);
    if ("error" in r) { alert(r.error); return; }
    onCambio();
  }
  return (
    <div className={`bg-surface border rounded-2xl px-4 py-3 shadow-sm ${c.oculto ? "border-amber-300 opacity-70" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[13.5px]">{c.autorNombre}</span>
            <span className="text-[11px] text-hint truncate">en {c.retoTitulo}</span>
            {c.oculto && <span className="text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">Oculto</span>}
          </div>
          <p className="text-[13.5px] text-text whitespace-pre-wrap mt-0.5">{c.texto}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => accion(moderarComentario(c.id, !c.oculto))} disabled={cargando}
            className="text-[12px] font-semibold text-amber-700 disabled:opacity-50">
            {c.oculto ? "Mostrar" : "Ocultar"}
          </button>
          <button onClick={() => { if (confirm("¿Borrar este comentario?")) accion(borrarComentario(c.id)); }} disabled={cargando}
            className="text-[12px] font-semibold text-red-500 disabled:opacity-50">Borrar</button>
        </div>
      </div>
    </div>
  );
}

// ————— Usuarios —————
function UsuariosTab({ usuarios, onCreado }: { usuarios: UsuarioAdmin[]; onCreado: () => void }) {
  const [modal, setModal] = useState(false);
  const [busca, setBusca] = useState("");

  const q = busca.trim().toLowerCase();
  const lista = q
    ? usuarios.filter((u) =>
        (u.nombre || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
    : usuarios;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="flex-1 min-w-[220px] bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-accent" />
        <button onClick={() => setModal(true)}
          className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition shrink-0">
          + Crear usuario
        </button>
      </div>

      <h3 className="font-display font-extrabold mb-3">
        Usuarios <span className="text-hint font-normal text-[13px]">({lista.length})</span>
      </h3>
      <div className="space-y-1.5">
        {lista.length === 0 ? (
          <p className="text-[13.5px] text-hint">Nadie coincide con esa búsqueda.</p>
        ) : lista.map((u) => (
          <UsuarioFila key={u.id} u={u} onCambio={onCreado} />
        ))}
      </div>

      {modal && <CrearUsuarioModal onCerrar={() => setModal(false)} onCreado={onCreado} />}
    </div>
  );
}

function UsuarioFila({ u, onCambio }: { u: UsuarioAdmin; onCambio: () => void }) {
  const [cargando, setCargando] = useState(false);
  async function toggle() {
    setCargando(true);
    const r = await marcarAdmin(u.id, !u.esAdmin);
    setCargando(false);
    if ("error" in r) { alert(r.error); return; }
    onCambio();
  }
  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-2.5 text-[13px]">
      <span className="font-semibold truncate min-w-0 flex-1">{u.nombre || "—"}</span>
      <span className="text-sub truncate hidden sm:block flex-1 min-w-0">{u.email}</span>
      {u.esAdmin && <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5 shrink-0">Admin{u.esRaiz ? " raíz" : ""}</span>}
      {u.esRaiz ? (
        <span className="text-[12px] text-hint shrink-0 w-24 text-right">fijo</span>
      ) : (
        <button onClick={toggle} disabled={cargando}
          className={`text-[12px] font-semibold shrink-0 w-24 text-right ${u.esAdmin ? "text-red-500" : "text-accent"} disabled:opacity-50`}>
          {cargando ? "…" : u.esAdmin ? "Quitar admin" : "Hacer admin"}
        </button>
      )}
    </div>
  );
}
