"use client";

import Link from "next/link";
import { type Perfil } from "@/lib/perfil-actions";
import { emojiNicho, emojiObjetivo, emojiPlataforma } from "@/lib/catalogos";
import { nivelPorXP } from "@/lib/data";
import { AvatarUploader } from "@/components/AvatarUploader";
import { CoverUploader } from "@/components/CoverUploader";

function fechaBonita(f: string | null): string {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  return d && m && y ? `${d}/${m}/${y}` : f;
}

const REDES = [
  { key: "instagram", nombre: "Instagram", emoji: "📸", color: "#E1306C", base: "https://instagram.com/" },
  { key: "tiktok", nombre: "TikTok", emoji: "🎵", color: "#111827", base: "https://tiktok.com/@" },
  { key: "youtube", nombre: "YouTube", emoji: "▶️", color: "#FF0000", base: "https://youtube.com/@" },
];

export function PerfilEditor({
  perfil, email, emailConfirmado,
}: {
  perfil: Perfil; email: string; emailConfirmado: boolean;
}) {
  const nivel = nivelPorXP(perfil.xp);
  const tieneRedes = REDES.some((r) => perfil.redes?.[r.key]);

  const items = [
    !!perfil.avatar_url, !!perfil.cover_url, !!perfil.headline, !!perfil.bio,
    !!perfil.ciudad, tieneRedes, !!perfil.nicho, !!perfil.objetivo, !!perfil.plataforma_principal,
  ];
  const pct = Math.round((items.filter(Boolean).length / items.length) * 100);

  return (
    <div>
      {/* ===== Cabecera estilo LinkedIn ===== */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <CoverUploader coverUrl={perfil.cover_url} />
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-12">
            <AvatarUploader avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? ""} size={96} />
            {tieneRedes && (
              <div className="flex gap-2 mt-14">
                {REDES.filter((r) => perfil.redes?.[r.key]).map((r) => (
                  <a key={r.key} href={r.base + perfil.redes[r.key]} target="_blank" rel="noopener noreferrer"
                    title={`@${perfil.redes[r.key]}`}
                    className="w-9 h-9 rounded-full grid place-items-center text-base text-white hover:scale-110 transition"
                    style={{ background: r.color }}>
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
            <Link href="/app/perfil/completar?paso=headline" className="text-accent text-sm mt-0.5 font-semibold hover:underline inline-block">
              + Agrega tu headline
            </Link>
          )}
          <p className="text-sub text-[13px] mt-0.5">
            {[perfil.ciudad, perfil.pais].filter(Boolean).join(", ") || perfil.pais}
          </p>

          {nivel.siguiente && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-bg overflow-hidden">
                <div className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.min(100, Math.round((perfil.xp / nivel.siguiente.xp) * 100))}%` }} />
              </div>
              <p className="text-[11px] text-hint mt-1">Te faltan {nivel.faltan} XP para {nivel.siguiente.nombre}</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== Completa tu perfil (lleva al flujo bonito) ===== */}
      {pct < 100 && (
        <Link href="/app/perfil/completar" className="block bg-accent-soft border border-accent/20 rounded-2xl p-4 mt-4 hover:brightness-[0.98] transition">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#4C1D95]">¡Completa tu perfil! {pct}%</span>
            <span className="text-[13px] font-bold text-accent">Completar →</span>
          </div>
          <div className="h-2 rounded-full bg-white/70 overflow-hidden mt-2">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[12px] text-[#5B21B6] mt-1.5">Paso a paso con Octi 🐙 — sube foto, redes y tus métricas.</p>
        </Link>
      )}

      {/* ===== Estadísticas ===== */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <Stat valor={`${nivel.actual.nivel}`} label="Nivel" />
        <Stat valor={`${perfil.xp}`} label="⭐ XP" />
        <Stat valor={`${perfil.gemas}`} label="💎 Gemas" />
        <Stat valor={`${perfil.racha}`} label="🔥 Racha" />
      </div>

      {/* ===== Sobre mí ===== */}
      <div className="bg-surface border border-border rounded-3xl p-6 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg font-extrabold">Sobre mí</h2>
          <Link href="/app/perfil/completar?paso=bio" className="text-[13px] font-semibold text-accent">
            {perfil.bio ? "Editar" : "+ Agregar"}
          </Link>
        </div>
        {perfil.bio ? (
          <p className="text-sub text-sm leading-relaxed whitespace-pre-line">{perfil.bio}</p>
        ) : (
          <p className="text-hint text-sm">Cuéntale al mundo quién eres y qué creas. ✍️</p>
        )}
      </div>

      {/* ===== Redes y métricas ===== */}
      <div className="bg-surface border border-border rounded-3xl p-6 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-extrabold">Redes y métricas</h2>
          <Link href="/app/perfil/completar?paso=conectar" className="text-[13px] font-semibold text-accent">Conectar →</Link>
        </div>
        <div className="space-y-2">
          {REDES.map((p) => {
            const m = perfil.metricas?.[p.key];
            return (
              <div key={p.key} className="flex items-center gap-3 bg-bg rounded-2xl p-3">
                <div className="w-10 h-10 rounded-full grid place-items-center text-base text-white shrink-0" style={{ background: p.color }}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-text">{p.nombre}</div>
                  <div className="text-[12px] text-sub truncate">{m?.username ? `@${m.username}` : "Sin conectar"}</div>
                </div>
                {m?.username && typeof m.followers === "number" ? (
                  <div className="text-right shrink-0">
                    <div className="font-display text-lg font-extrabold text-accent">{m.followers.toLocaleString()}</div>
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

      {/* ===== Mi información ===== */}
      <div className="bg-surface border border-border rounded-3xl p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-extrabold">Mi información</h2>
          <Link href="/app/perfil/completar" className="text-[13px] font-semibold text-accent bg-accent-soft rounded-lg px-3 py-1.5 hover:brightness-105 transition">
            ✏️ Editar
          </Link>
        </div>
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
        </div>
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
