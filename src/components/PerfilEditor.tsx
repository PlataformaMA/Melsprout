"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarPerfil, type Perfil } from "@/lib/perfil-actions";
import {
  PAISES, NICHOS, OBJETIVOS, PLATAFORMAS, AUDIENCIAS,
  emojiNicho, emojiObjetivo, emojiPlataforma,
} from "@/lib/catalogos";
import { nivelPorXP } from "@/lib/data";
import { AvatarUploader } from "@/components/AvatarUploader";
import { CoverUploader } from "@/components/CoverUploader";

function fechaBonita(f: string | null): string {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  return d && m && y ? `${d}/${m}/${y}` : f;
}

const REDES: { key: string; nombre: string; emoji: string; base: string }[] = [
  { key: "instagram", nombre: "Instagram", emoji: "📸", base: "https://instagram.com/" },
  { key: "tiktok", nombre: "TikTok", emoji: "🎵", base: "https://tiktok.com/@" },
  { key: "youtube", nombre: "YouTube", emoji: "▶️", base: "https://youtube.com/@" },
];

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
  const [headline, setHeadline] = useState(perfil.headline ?? "");
  const [bio, setBio] = useState(perfil.bio ?? "");
  const [ciudad, setCiudad] = useState(perfil.ciudad ?? "");
  const [abiertoColab, setAbiertoColab] = useState(perfil.abierto_colab);
  const [ig, setIg] = useState(perfil.redes?.instagram ?? "");
  const [tiktok, setTiktok] = useState(perfil.redes?.tiktok ?? "");
  const [youtube, setYoutube] = useState(perfil.redes?.youtube ?? "");
  const [pais, setPais] = useState(perfil.pais ?? "México");
  const [nacimiento, setNacimiento] = useState(perfil.fecha_nacimiento ?? "");
  const [whatsapp, setWhatsapp] = useState(perfil.whatsapp ?? "");
  const [waOptin, setWaOptin] = useState(perfil.whatsapp_optin);
  const [nicho, setNicho] = useState(perfil.nicho ?? "");
  const [objetivo, setObjetivo] = useState(perfil.objetivo ?? "");
  const [plataforma, setPlataforma] = useState(perfil.plataforma_principal ?? "");
  const [audiencia, setAudiencia] = useState(perfil.tamano_audiencia ?? "");

  const nivel = nivelPorXP(perfil.xp);
  const tieneRedes = REDES.some((r) => perfil.redes?.[r.key]);

  // "Completa tu perfil" — porcentaje
  const items = [
    !!perfil.avatar_url, !!perfil.cover_url, !!perfil.headline, !!perfil.bio,
    !!perfil.ciudad, tieneRedes, !!perfil.nicho, !!perfil.objetivo, !!perfil.plataforma_principal,
  ];
  const pct = Math.round((items.filter(Boolean).length / items.length) * 100);

  function guardar() {
    setError("");
    startTransition(async () => {
      const r = await actualizarPerfil({
        full_name: nombre, headline, bio, ciudad, abierto_colab: abiertoColab,
        redes: { instagram: ig, tiktok, youtube },
        pais, fecha_nacimiento: nacimiento || undefined,
        whatsapp: whatsapp || undefined, whatsapp_optin: waOptin,
        nicho: nicho || undefined, objetivo: objetivo || undefined,
        plataforma_principal: plataforma || undefined, tamano_audiencia: audiencia || undefined,
      });
      if ("error" in r) setError(r.error);
      else { setEditando(false); router.refresh(); }
    });
  }

  function cancelar() {
    setNombre(perfil.full_name ?? ""); setHeadline(perfil.headline ?? "");
    setBio(perfil.bio ?? ""); setCiudad(perfil.ciudad ?? "");
    setAbiertoColab(perfil.abierto_colab);
    setIg(perfil.redes?.instagram ?? ""); setTiktok(perfil.redes?.tiktok ?? "");
    setYoutube(perfil.redes?.youtube ?? "");
    setPais(perfil.pais ?? "México"); setNacimiento(perfil.fecha_nacimiento ?? "");
    setWhatsapp(perfil.whatsapp ?? ""); setWaOptin(perfil.whatsapp_optin);
    setNicho(perfil.nicho ?? ""); setObjetivo(perfil.objetivo ?? "");
    setPlataforma(perfil.plataforma_principal ?? ""); setAudiencia(perfil.tamano_audiencia ?? "");
    setError(""); setEditando(false);
  }

  return (
    <div>
      {/* ===== Cabecera estilo LinkedIn ===== */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <CoverUploader coverUrl={perfil.cover_url} />
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-12">
            <AvatarUploader avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? ""} size={96} />
            {/* Redes sociales */}
            {tieneRedes && (
              <div className="flex gap-2 mt-14">
                {REDES.filter((r) => perfil.redes?.[r.key]).map((r) => (
                  <a key={r.key} href={r.base + perfil.redes[r.key]} target="_blank" rel="noopener noreferrer"
                    title={`@${perfil.redes[r.key]}`}
                    className="w-9 h-9 rounded-full bg-bg border border-border grid place-items-center text-base hover:scale-110 transition">
                    {r.emoji}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2 mt-3">
            <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
              Nivel {nivel.actual.nivel} · {nivel.actual.nombre}
            </span>
            {perfil.nicho && (
              <span className="text-[11px] font-bold text-text bg-bg rounded-full px-2.5 py-1">
                {emojiNicho(perfil.nicho)} {perfil.nicho}
              </span>
            )}
            {perfil.abierto_colab && (
              <span className="text-[11px] font-bold text-green bg-green-soft rounded-full px-2.5 py-1">
                🤝 Abierta a colaboraciones
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl font-extrabold">{perfil.full_name ?? "Creador"}</h1>
          {perfil.headline ? (
            <p className="text-text text-sm mt-0.5 font-medium">{perfil.headline}</p>
          ) : (
            <button onClick={() => setEditando(true)} className="text-accent text-sm mt-0.5 font-semibold hover:underline">
              + Agrega tu headline
            </button>
          )}
          <p className="text-sub text-[13px] mt-0.5">
            {[perfil.ciudad, perfil.pais].filter(Boolean).join(", ") || perfil.pais || "Agrega tu ciudad"}
          </p>

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

      {/* ===== Completa tu perfil ===== */}
      {pct < 100 && !editando && (
        <div className="bg-accent-soft border border-accent/20 rounded-2xl p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#4C1D95]">¡Completa tu perfil! {pct}%</span>
            <Link href="/app/perfil/completar" className="text-[13px] font-bold text-accent">Completar →</Link>
          </div>
          <div className="h-2 rounded-full bg-white/70 overflow-hidden mt-2">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[12px] text-[#5B21B6] mt-1.5">
            Un perfil completo te ayuda a que las marcas te encuentren. 🚀
          </p>
        </div>
      )}

      {/* ===== Estadísticas ===== */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <Stat valor={`${nivel.actual.nivel}`} label="Nivel" />
        <Stat valor={`${perfil.xp}`} label="⭐ XP" />
        <Stat valor={`${perfil.gemas}`} label="💎 Gemas" />
        <Stat valor={`${perfil.racha}`} label="🔥 Racha" />
      </div>

      {/* ===== Sobre mí (siempre visible) ===== */}
      {!editando && (
        <div className="bg-surface border border-border rounded-3xl p-6 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg font-extrabold">Sobre mí</h2>
            <button onClick={() => setEditando(true)} className="text-[13px] font-semibold text-accent">
              {perfil.bio ? "Editar" : "+ Agregar"}
            </button>
          </div>
          {perfil.bio ? (
            <p className="text-sub text-sm leading-relaxed whitespace-pre-line">{perfil.bio}</p>
          ) : (
            <p className="text-hint text-sm">Cuéntale al mundo quién eres y qué creas. ✍️</p>
          )}
        </div>
      )}

      {/* ===== Redes y métricas ===== */}
      {!editando && (
        <div className="bg-surface border border-border rounded-3xl p-6 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-extrabold">Redes y métricas</h2>
            <Link href="/app/perfil/completar?paso=conectar" className="text-[13px] font-semibold text-accent">
              Conectar →
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { key: "instagram", nombre: "Instagram", emoji: "📸", color: "#E1306C" },
              { key: "tiktok", nombre: "TikTok", emoji: "🎵", color: "#111827" },
              { key: "youtube", nombre: "YouTube", emoji: "▶️", color: "#FF0000" },
            ].map((p) => {
              const m = perfil.metricas?.[p.key];
              return (
                <div key={p.key} className="flex items-center gap-3 bg-bg rounded-2xl p-3">
                  <div className="w-10 h-10 rounded-full grid place-items-center text-base text-white shrink-0" style={{ background: p.color }}>
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-text">{p.nombre}</div>
                    <div className="text-[12px] text-sub truncate">
                      {m?.username ? `@${m.username}` : "Sin conectar"}
                    </div>
                  </div>
                  {m?.username && typeof m.followers === "number" ? (
                    <div className="text-right shrink-0">
                      <div className="font-display text-lg font-extrabold text-accent">
                        {m.followers.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-sub">seguidores</div>
                    </div>
                  ) : m?.username ? (
                    <span className="text-green text-sm">✅</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Mi información / edición ===== */}
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
            <Row label="Headline" valor={perfil.headline ?? "—"} />
            <Row label="Correo" valor={email + (emailConfirmado ? " ✅" : " ⏳")} />
            <Row label="Ciudad" valor={[perfil.ciudad, perfil.pais].filter(Boolean).join(", ") || "—"} />
            <Row label="Nicho" valor={perfil.nicho ? `${emojiNicho(perfil.nicho)} ${perfil.nicho}` : "—"} />
            <Row label="Objetivo" valor={perfil.objetivo ? `${emojiObjetivo(perfil.objetivo)} ${perfil.objetivo}` : "—"} />
            <Row label="Plataforma" valor={perfil.plataforma_principal ? `${emojiPlataforma(perfil.plataforma_principal)} ${perfil.plataforma_principal}` : "—"} />
            <Row label="Audiencia" valor={perfil.tamano_audiencia ?? "—"} />
            <Row label="Nacimiento" valor={fechaBonita(perfil.fecha_nacimiento)} />
            <Row label="WhatsApp" valor={perfil.whatsapp ?? "—"} />
            <Row label="Instagram" valor={perfil.redes?.instagram ? "@" + perfil.redes.instagram : "—"} />
            <Row label="TikTok" valor={perfil.redes?.tiktok ? "@" + perfil.redes.tiktok : "—"} />
            <Row label="YouTube" valor={perfil.redes?.youtube ? "@" + perfil.redes.youtube : "—"} />
            <Row label="Colaboraciones" valor={perfil.abierto_colab ? "Abierta 🤝" : "Cerrada"} />
          </div>
        ) : (
          <div className="space-y-5">
            <Field label="Nombre completo">
              <Input value={nombre} onChange={setNombre} />
            </Field>
            <Field label="Headline (tu título)">
              <Input value={headline} onChange={setHeadline} placeholder="Ej. Creadora de contenido de Moda 👗" />
            </Field>
            <Field label="Sobre mí (bio)">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={400}
                placeholder="Cuéntale al mundo quién eres y qué creas…"
                className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition resize-none" />
              <p className="text-[11px] text-hint mt-1 text-right">{bio.length}/400</p>
            </Field>
            <Field label="Ciudad">
              <Input value={ciudad} onChange={setCiudad} placeholder="Ej. Ciudad de México" />
            </Field>

            <Field label="Redes sociales">
              <div className="space-y-2">
                {[
                  { emoji: "📸", ph: "tu_usuario_ig", v: ig, set: setIg },
                  { emoji: "🎵", ph: "tu_usuario_tiktok", v: tiktok, set: setTiktok },
                  { emoji: "▶️", ph: "tu_canal_yt", v: youtube, set: setYoutube },
                ].map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl border-2 border-border bg-white px-3 focus-within:border-accent transition">
                    <span className="text-lg">{r.emoji}</span>
                    <span className="text-sub text-sm">@</span>
                    <input value={r.v} onChange={(e) => r.set(e.target.value)} placeholder={r.ph}
                      className="flex-1 bg-transparent py-2.5 text-sm outline-none" />
                  </div>
                ))}
              </div>
            </Field>

            <label className="flex items-center justify-between bg-bg rounded-xl px-4 py-3 cursor-pointer">
              <span className="text-sm font-medium text-text">🤝 Abierta a colaboraciones</span>
              <input type="checkbox" checked={abiertoColab} onChange={(e) => setAbiertoColab(e.target.checked)}
                className="w-5 h-5 accent-[#7c3aed]" />
            </label>

            <Field label="Nicho">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {NICHOS.map((n) => (
                  <Chip key={n.id} activa={nicho === n.id} onClick={() => setNicho(n.id)} col>
                    <span className="text-xl">{n.emoji}</span><span className="text-[11px]">{n.id}</span>
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
            <Field label="País">
              <select value={pais} onChange={(e) => setPais(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition">
                {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
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

            <div className="flex gap-3 pt-1 sticky bottom-0">
              <button onClick={cancelar} disabled={pendiente}
                className="flex-1 border border-border bg-surface text-text font-semibold text-sm rounded-xl py-2.5 hover:bg-bg transition disabled:opacity-60">
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
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-sub text-sm shrink-0">{label}</span>
      <span className="text-text text-sm font-medium text-right break-words">{valor}</span>
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

function Input({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition" />
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
