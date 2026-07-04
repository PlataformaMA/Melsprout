"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarPerfil, type Perfil } from "@/lib/perfil-actions";
import {
  PAISES, NICHOS, OBJETIVOS, PLATAFORMAS, AUDIENCIAS,
  emojiNicho, emojiObjetivo, emojiPlataforma,
} from "@/lib/catalogos";
import { nivelPorXP } from "@/lib/data";

function iniciales(nombre: string | null): string {
  if (!nombre) return "🐙";
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}
function fechaBonita(f: string | null): string {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  return d && m && y ? `${d}/${m}/${y}` : f;
}

export function PerfilEditor({
  perfil, email, emailConfirmado,
}: {
  perfil: Perfil; email: string; emailConfirmado: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState(perfil.full_name ?? "");
  const [pais, setPais] = useState(perfil.pais ?? "México");
  const [nacimiento, setNacimiento] = useState(perfil.fecha_nacimiento ?? "");
  const [whatsapp, setWhatsapp] = useState(perfil.whatsapp ?? "");
  const [waOptin, setWaOptin] = useState(perfil.whatsapp_optin);
  const [nicho, setNicho] = useState(perfil.nicho ?? "");
  const [objetivo, setObjetivo] = useState(perfil.objetivo ?? "");
  const [plataforma, setPlataforma] = useState(perfil.plataforma_principal ?? "");
  const [audiencia, setAudiencia] = useState(perfil.tamano_audiencia ?? "");

  const nivel = nivelPorXP(perfil.xp);

  function guardar() {
    setError("");
    startTransition(async () => {
      const r = await actualizarPerfil({
        full_name: nombre, pais, fecha_nacimiento: nacimiento || undefined,
        whatsapp: whatsapp || undefined, whatsapp_optin: waOptin,
        nicho: nicho || undefined, objetivo: objetivo || undefined,
        plataforma_principal: plataforma || undefined,
        tamano_audiencia: audiencia || undefined,
      });
      if ("error" in r) setError(r.error);
      else { setEditando(false); router.refresh(); }
    });
  }

  function cancelar() {
    setNombre(perfil.full_name ?? ""); setPais(perfil.pais ?? "México");
    setNacimiento(perfil.fecha_nacimiento ?? ""); setWhatsapp(perfil.whatsapp ?? "");
    setWaOptin(perfil.whatsapp_optin); setNicho(perfil.nicho ?? "");
    setObjetivo(perfil.objetivo ?? ""); setPlataforma(perfil.plataforma_principal ?? "");
    setAudiencia(perfil.tamano_audiencia ?? ""); setError(""); setEditando(false);
  }

  return (
    <div>
      {/* ===== Cabecera bonita ===== */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="h-28 relative" style={{ background: "linear-gradient(120deg,#7C3AED,#DB2777)" }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff3 0 20%, transparent 20%), radial-gradient(circle at 80% 60%, #fff2 0 15%, transparent 15%)" }} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full grid place-items-center text-white font-display font-extrabold text-2xl border-4 border-surface shadow-lg shrink-0"
              style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)" }}>
              {iniciales(perfil.full_name)}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
                  Nivel {nivel.actual.nivel} · {nivel.actual.nombre}
                </span>
                {perfil.nicho && (
                  <span className="text-[11px] font-bold text-text bg-bg rounded-full px-2.5 py-1">
                    {emojiNicho(perfil.nicho)} {perfil.nicho}
                  </span>
                )}
              </div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold mt-3">
            {perfil.full_name ?? "Creador"}
          </h1>
          <p className="text-sub text-sm mt-0.5">
            {perfil.objetivo ? `${emojiObjetivo(perfil.objetivo)} ${perfil.objetivo}` : "Creador de contenido"}
            {perfil.pais ? ` · ${perfil.pais}` : ""}
          </p>

          {/* Barra de progreso al siguiente nivel */}
          {nivel.siguiente && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-bg overflow-hidden">
                <div className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.min(100, Math.round((perfil.xp / nivel.siguiente.xp) * 100))}%` }} />
              </div>
              <p className="text-[11px] text-hint mt-1">
                Te faltan {nivel.faltan} XP para {nivel.siguiente.nombre}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== Estadísticas ===== */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <Stat valor={`${nivel.actual.nivel}`} label="Nivel" />
        <Stat valor={`${perfil.xp}`} label="⭐ XP" />
        <Stat valor={`${perfil.gemas}`} label="💎 Gemas" />
        <Stat valor={`${perfil.racha}`} label="🔥 Racha" />
      </div>

      {/* ===== Info / edición ===== */}
      <div className="bg-surface border border-border rounded-3xl p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-extrabold">Mi información</h2>
          {!editando && (
            <button onClick={() => setEditando(true)}
              className="text-[13px] font-semibold text-accent bg-accent-soft rounded-lg px-3 py-1.5 hover:brightness-105 transition">
              ✏️ Editar
            </button>
          )}
        </div>

        {!editando ? (
          <div className="space-y-1">
            <Row label="Nombre" valor={perfil.full_name ?? "—"} />
            <Row label="Correo" valor={email + (emailConfirmado ? " ✅" : " ⏳")} />
            <Row label="País" valor={perfil.pais ?? "—"} />
            <Row label="Nicho" valor={perfil.nicho ? `${emojiNicho(perfil.nicho)} ${perfil.nicho}` : "—"} />
            <Row label="Objetivo" valor={perfil.objetivo ? `${emojiObjetivo(perfil.objetivo)} ${perfil.objetivo}` : "—"} />
            <Row label="Plataforma" valor={perfil.plataforma_principal ? `${emojiPlataforma(perfil.plataforma_principal)} ${perfil.plataforma_principal}` : "—"} />
            <Row label="Audiencia" valor={perfil.tamano_audiencia ?? "—"} />
            <Row label="Nacimiento" valor={fechaBonita(perfil.fecha_nacimiento)} />
            <Row label="WhatsApp" valor={perfil.whatsapp ?? "—"} />
          </div>
        ) : (
          <div className="space-y-5">
            <Field label="Nombre completo">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition" />
            </Field>
            <Field label="País">
              <select value={pais} onChange={(e) => setPais(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition">
                {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Nicho">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {NICHOS.map((n) => (
                  <Chip key={n.id} activa={nicho === n.id} onClick={() => setNicho(n.id)} col>
                    <span className="text-xl">{n.emoji}</span>
                    <span className="text-[11px]">{n.id}</span>
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Objetivo">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {OBJETIVOS.map((o) => (
                  <Chip key={o.id} activa={objetivo === o.id} onClick={() => setObjetivo(o.id)}>
                    <span>{o.emoji}</span><span className="text-[12px]">{o.id}</span>
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Plataforma principal">
              <div className="grid grid-cols-3 gap-2">
                {PLATAFORMAS.map((p) => (
                  <Chip key={p.id} activa={plataforma === p.id} onClick={() => setPlataforma(p.id)} col>
                    <span className="text-xl">{p.emoji}</span><span className="text-[11px]">{p.id}</span>
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Audiencia">
              <div className="grid grid-cols-4 gap-2">
                {AUDIENCIAS.map((a) => (
                  <Chip key={a} activa={audiencia === a} onClick={() => setAudiencia(a)}>
                    <span className="text-[12px]">{a}</span>
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Fecha de nacimiento">
              <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition" />
            </Field>
            <Field label="WhatsApp">
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej. +52 55 1234 5678"
                className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition" />
              <label className="flex items-center gap-2.5 text-[13px] text-sub cursor-pointer mt-2">
                <input type="checkbox" checked={waOptin} onChange={(e) => setWaOptin(e.target.checked)} className="w-4 h-4 accent-[#7c3aed]" />
                <span>Recibir recordatorios de Octi por WhatsApp 🐙</span>
              </label>
            </Field>

            {error && <p className="text-[13px] text-pink bg-pink-soft rounded-lg px-3 py-2.5">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={cancelar} disabled={pendiente}
                className="flex-1 border border-border text-text font-semibold text-sm rounded-xl py-2.5 hover:bg-bg transition disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={guardar} disabled={pendiente}
                className="flex-1 bg-accent text-white font-semibold text-sm rounded-xl py-2.5 hover:brightness-110 transition disabled:opacity-60">
                {pendiente ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ valor, label }: { valor: string; label: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3 text-center">
      <div className="font-display text-xl font-extrabold text-accent">{valor}</div>
      <div className="text-[11px] text-sub mt-0.5">{label}</div>
    </div>
  );
}

function Row({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sub text-sm">{label}</span>
      <span className="text-text text-sm font-medium text-right max-w-[60%] break-words">{valor}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[13px] font-bold text-text block mb-2">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  activa, onClick, children, col,
}: {
  activa: boolean; onClick: () => void; children: React.ReactNode; col?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex ${col ? "flex-col" : "flex-row"} items-center justify-center gap-1 rounded-xl border-2 px-2 py-2.5 font-semibold transition-all active:scale-95 ${
        activa ? "border-accent bg-accent-soft text-text" : "border-border bg-white text-sub hover:border-accent/40"
      }`}>
      {children}
    </button>
  );
}
