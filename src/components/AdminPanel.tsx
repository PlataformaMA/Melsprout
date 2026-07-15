"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { ETAPA_1 } from "@/lib/data";
import type { RetoRow, RetoTipo } from "@/lib/retos-db";
import type { PasoReto } from "@/lib/retos";
import {
  crearReto,
  actualizarReto,
  borrarReto,
  crearUsuarioAdmin,
  marcarAdmin,
  type RetoInput,
  type UsuarioAdmin,
} from "@/lib/admin-actions";

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

export function AdminPanel({ retos, usuarios, adminEmail }: { retos: RetoRow[]; usuarios: UsuarioAdmin[]; adminEmail: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"retos" | "usuarios">("retos");
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

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="admin" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display text-2xl font-extrabold">Panel admin ⚙️</h1>
              <p className="text-sub text-[13px]">Conectado como {adminEmail}</p>
            </div>
            <Link href="/app/ruta" className="text-[13px] text-accent font-semibold">← Volver a la app</Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["retos", "usuarios"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-[14px] font-bold transition ${tab === t ? "bg-accent text-white" : "bg-surface border border-border text-sub hover:bg-bg"}`}>
                {t === "retos" ? "Retos" : "Usuarios"}
              </button>
            ))}
          </div>

          {tab === "retos" ? (
            <div>
              {!form && (
                <button onClick={nuevo} className="mb-4 bg-accent text-white rounded-xl px-4 py-2.5 text-[14px] font-bold hover:brightness-110 transition">
                  + Nuevo reto
                </button>
              )}

              {form && (
                <RetoForm form={form} setForm={setForm} guardar={guardar} guardando={guardando} cancelar={() => setForm(null)} msg={msg} />
              )}

              {/* Lista de retos */}
              <div className="mt-6 space-y-2">
                {retos.length === 0 && <p className="text-sub text-[14px]">Aún no hay retos creados. Crea el primero con “+ Nuevo reto”.</p>}
                {retos.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3">
                    <span className="text-xl shrink-0">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14px] truncate">{r.titulo}</div>
                      <div className="text-[12px] text-sub">
                        <span className="text-accent font-semibold">{r.tipo}</span>
                        {r.clase_id ? ` · clase ${r.clase_id}` : ""} · {r.xp} XP {r.activo ? "" : "· (oculto)"}
                      </div>
                    </div>
                    <button onClick={() => editar(r)} className="text-[13px] text-accent font-semibold">Editar</button>
                    <button onClick={() => eliminar(r.id)} className="text-[13px] text-red-500 font-semibold">Borrar</button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <UsuariosTab usuarios={usuarios} onCreado={() => router.refresh()} />
          )}
        </div>
      </div>
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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

// ————— Usuarios —————
function UsuariosTab({ usuarios, onCreado }: { usuarios: UsuarioAdmin[]; onCreado: () => void }) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [pass, setPass] = useState("");
  const [creando, setCreando] = useState(false);
  const [msg, setMsg] = useState("");
  const inputC = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-[14px] outline-none focus:border-accent";

  async function crear() {
    setCreando(true); setMsg("");
    const r = await crearUsuarioAdmin(email, nombre, pass);
    setCreando(false);
    if ("error" in r) { setMsg(r.error); return; }
    setEmail(""); setNombre(""); setPass(""); setMsg("✅ Usuario creado"); onCreado();
  }

  return (
    <div>
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3 max-w-lg">
        <h2 className="font-display font-extrabold text-lg">Crear usuario</h2>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputC} placeholder="Nombre completo" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputC} placeholder="correo@ejemplo.com" type="email" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} className={inputC} placeholder="Contraseña (mín. 6)" type="text" />
        {msg && <p className="text-[13px] text-sub">{msg}</p>}
        <button onClick={crear} disabled={creando} className="bg-accent text-white rounded-xl px-5 py-2.5 text-[14px] font-bold hover:brightness-110 disabled:opacity-60 transition">
          {creando ? "Creando…" : "Crear usuario"}
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
