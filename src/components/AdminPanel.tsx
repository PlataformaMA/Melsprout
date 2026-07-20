"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cerrarSesion } from "@/lib/auth-actions";
import { ETAPA_1 } from "@/lib/data";
import type { RetoRow, RetoTipo } from "@/lib/retos-db";
import type { PasoReto } from "@/lib/retos";
import {
  crearReto,
  actualizarReto,
  borrarReto,
  crearUsuarioAdmin,
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
import { setVideoClase } from "@/lib/clase-video-actions";
import { createClient } from "@/lib/supabase/client";

const TIPOS: { v: RetoTipo; label: string }[] = [
  { v: "semanal", label: "Semanal" },
  { v: "grupal", label: "Grupal" },
  { v: "personal", label: "Personal" },
  { v: "curso", label: "De curso (liga a clase)" },
];
const CLASES = ETAPA_1.flatMap((m) => m.clases.map((c) => ({ id: c.id, titulo: `${c.id} · ${c.titulo}` })));

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

export function AdminPanel({ retos, usuarios, avances, comentarios, clasesVivo, videos, adminEmail }: { retos: RetoRow[]; usuarios: UsuarioAdmin[]; avances: Avance[]; comentarios: ComentarioAdmin[]; clasesVivo: ClaseVivo[]; videos: Record<string, string>; adminEmail: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("retos");
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

  const TITULOS: Record<string, string> = { retos: "Retos", clases: "Videos de clases", vivo: "Clases en vivo", avances: "Avances de usuarios", comentarios: "Comentarios", usuarios: "Usuarios" };

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
              <Link href="/app/inicio" className="text-[12px] font-bold text-accent bg-accent-soft rounded-lg px-3 py-1.5">👁️ Ver app</Link>
              <form action={cerrarSesion}><button className="text-[12px] font-bold text-pink bg-pink-soft rounded-lg px-3 py-1.5">Salir</button></form>
            </div>
          </div>

          <div className="mb-5">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">{TITULOS[tab]}</h1>
            <p className="text-sub text-[12.5px]">Panel de administración · Melsprout</p>
          </div>

          <AdminTabsMovil tab={tab} setTab={(t) => { setTab(t); setForm(null); }} />

          {tab === "retos" ? (
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
                <RetoForm form={form} setForm={setForm} guardar={guardar} guardando={guardando} cancelar={() => setForm(null)} msg={msg} />
              )}
            </div>
          ) : tab === "clases" ? (
            <ClasesVideoTab videos={videos} onCambio={() => router.refresh()} />
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
type AdminTab = "retos" | "clases" | "vivo" | "avances" | "comentarios" | "usuarios";
function AdminSidebar({ tab, setTab, adminEmail, counts }: {
  tab: AdminTab; setTab: (t: AdminTab) => void; adminEmail: string;
  counts: { retos: number; vivo: number; avances: number; comentarios: number; usuarios: number };
}) {
  const items: { id: AdminTab; label: string; icon: string; count: number }[] = [
    { id: "retos", label: "Retos", icon: "🎯", count: counts.retos },
    { id: "clases", label: "Clases (videos)", icon: "🎬", count: -1 },
    { id: "vivo", label: "Clases en vivo", icon: "📡", count: counts.vivo },
    { id: "avances", label: "Avances", icon: "📊", count: counts.avances },
    { id: "comentarios", label: "Comentarios", icon: "💬", count: counts.comentarios },
    { id: "usuarios", label: "Usuarios", icon: "👥", count: counts.usuarios },
  ];
  return (
    <div className="hidden md:flex flex-col w-64 shrink-0 bg-surface border-r border-border min-h-screen sticky top-0 p-4">
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-white font-extrabold">M</div>
        <div>
          <div className="font-display font-extrabold leading-tight">Melsprout</div>
          <div className="text-[11px] text-accent font-bold">ADMIN</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <button key={it.id} onClick={() => setTab(it.id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition ${tab === it.id ? "bg-accent-soft text-accent" : "text-sub hover:bg-bg"}`}>
            <span>{it.icon}</span>
            <span className="flex-1 text-left">{it.label}</span>
            {it.count >= 0 && <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${tab === it.id ? "bg-accent text-white" : "bg-bg text-hint"}`}>{it.count}</span>}
          </button>
        ))}
        <div className="text-[11px] text-hint font-semibold px-3 pt-4 pb-1 uppercase">Próximamente</div>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-hint/70 cursor-default"><span>👥</span> Comunidad (retos grupales)</div>
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="text-[11px] text-hint px-3 truncate mb-2">{adminEmail}</div>
        <Link href="/app/inicio" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-sub hover:bg-bg transition">
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
function AdminTabsMovil({ tab, setTab }: { tab: AdminTab; setTab: (t: AdminTab) => void }) {
  return (
    <div className="md:hidden flex flex-wrap gap-1 bg-surface border border-border rounded-2xl p-1 mb-5 shadow-sm">
      {(["retos", "clases", "vivo", "avances", "comentarios", "usuarios"] as AdminTab[]).map((t) => (
        <button key={t} onClick={() => setTab(t)}
          className={`px-3 py-2 rounded-xl text-[13px] font-bold transition ${tab === t ? "bg-accent text-white" : "text-sub"}`}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
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
function RetoForm({ form, setForm, guardar, guardando, cancelar, msg }: {
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
              {CLASES.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
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

// ————— Videos de clases —————
function ClasesVideoTab({ videos, onCambio }: { videos: Record<string, string>; onCambio: () => void }) {
  return (
    <div>
      <p className="text-sub text-[13.5px] mb-4">Sube o pega el enlace del video de cada clase. El alumno debe ver el <b>85%</b> para completarla y ganar +100 XP.</p>
      <div className="space-y-6">
        {ETAPA_1.map((m) => (
          <div key={m.id}>
            <h3 className="font-display font-extrabold mb-2">{m.nombre}</h3>
            <div className="space-y-2">
              {m.clases.map((c) => <ClaseVideoFila key={c.id} clase={c} url={videos[c.id] || ""} onCambio={onCambio} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClaseVideoFila({ clase, url, onCambio }: { clase: { id: string; titulo: string }; url: string; onCambio: () => void }) {
  const [valor, setValor] = useState(url);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function subir(file: File) {
    const mb = file.size / (1024 * 1024);
    if (mb > 50) { setMsg(`El video pesa ${mb.toFixed(0)} MB (máx 50 MB).`); return; }
    setSubiendo(true); setMsg("");
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `clases/${clase.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("retos").upload(path, file, { upsert: true });
      if (error) { setMsg("No se pudo subir el video."); }
      else {
        const { data } = supabase.storage.from("retos").getPublicUrl(path);
        setValor(data.publicUrl);
        await setVideoClase(clase.id, data.publicUrl);
        setMsg("✅ Subido y guardado"); onCambio();
      }
    } catch { setMsg("Error al subir."); }
    setSubiendo(false);
  }
  async function guardar() {
    setGuardando(true); setMsg("");
    const r = await setVideoClase(clase.id, valor);
    setGuardando(false);
    if ("error" in r) { setMsg(r.error); return; }
    setMsg("✅ Guardado"); onCambio();
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] font-bold text-hint w-8">{clase.id}</span>
        <span className="text-[13.5px] font-semibold flex-1 min-w-0 truncate">{clase.titulo}</span>
        {url && <span className="text-[11px] font-bold text-green shrink-0">🎬 con video</span>}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Pega un enlace .mp4 o sube un archivo →" className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent" />
        <input ref={fileRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); }} />
        <button onClick={() => fileRef.current?.click()} disabled={subiendo} className="bg-surface border border-border rounded-lg px-3 py-2 text-[13px] font-semibold hover:bg-bg disabled:opacity-60 shrink-0">{subiendo ? "Subiendo…" : "Subir video"}</button>
        <button onClick={guardar} disabled={guardando} className="bg-accent text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:brightness-110 disabled:opacity-60 shrink-0">{guardando ? "…" : "Guardar"}</button>
      </div>
      {msg && <p className="text-[12px] text-sub mt-1.5">{msg}</p>}
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
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [pass, setPass] = useState("");
  const [rolAdmin, setRolAdmin] = useState(false);
  const [creando, setCreando] = useState(false);
  const [msg, setMsg] = useState("");
  const inputC = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-[14px] outline-none focus:border-accent";

  async function crear() {
    setCreando(true); setMsg("");
    const r = await crearUsuarioAdmin(email, nombre, pass, rolAdmin);
    setCreando(false);
    if ("error" in r) { setMsg(r.error); return; }
    setEmail(""); setNombre(""); setPass(""); setRolAdmin(false); setMsg("✅ Usuario creado"); onCreado();
  }

  return (
    <div>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3 max-w-lg">
        <h2 className="font-display font-extrabold text-lg">Crear usuario</h2>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputC} placeholder="Nombre completo" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputC} placeholder="correo@ejemplo.com" type="email" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} className={inputC} placeholder="Contraseña (mín. 6)" type="text" />
        {/* Rol */}
        <div className="flex gap-2">
          <button type="button" onClick={() => setRolAdmin(false)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-[13.5px] font-bold border transition ${!rolAdmin ? "bg-accent-soft border-accent text-accent" : "bg-bg border-border text-sub"}`}>
            👤 Usuario normal
          </button>
          <button type="button" onClick={() => setRolAdmin(true)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-[13.5px] font-bold border transition ${rolAdmin ? "bg-accent-soft border-accent text-accent" : "bg-bg border-border text-sub"}`}>
            ⚙️ Admin
          </button>
        </div>
        {msg && <p className="text-[13px] text-sub">{msg}</p>}
        <button onClick={crear} disabled={creando} className="bg-accent text-white rounded-xl px-5 py-2.5 text-[14px] font-bold hover:brightness-110 disabled:opacity-60 transition">
          {creando ? "Creando…" : `Crear ${rolAdmin ? "admin" : "usuario"}`}
        </button>
      </div>

      <h3 className="font-display font-extrabold mt-8 mb-3">Usuarios ({usuarios.length})</h3>
      <div className="space-y-1.5">
        {usuarios.map((u) => (
          <UsuarioFila key={u.id} u={u} onCambio={onCreado} />
        ))}
      </div>
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
