"use client";

import { useState } from "react";
import Link from "next/link";
import { AvatarInstructor } from "@/components/Instructor";
import type { CursoEspecial } from "@/lib/cursos-db";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { UserMenu } from "@/components/UserMenu";
import { sugerirCurso } from "@/lib/sugerencias-actions";

// Listado de Cursos Especiales (patrocinados / bonus).
export function EspecialesVista({
  yo, cursos,
}: {
  yo: { nombre: string; avatar: string | null; racha: number; gemas: number };
  cursos: CursoEspecial[];
}) {
  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="especiales" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {yo.racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {yo.gemas}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={yo.avatar} nombre={yo.nombre} />
          </header>

          <BannerEspeciales />

          <h1 className="font-display text-2xl font-extrabold mt-6 mb-4">Cursos Especiales</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <div>
              {cursos.length === 0 ? (
                <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/octi.png" alt="" className="octi-vivo w-24 mx-auto" />
                  <h2 className="font-display font-extrabold text-lg mt-3">Todavía no hay cursos especiales</h2>
                  <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
                    Aquí van los cursos patrocinados y los bonus. Cuando publiquemos uno, lo vas a ver en esta sección.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {cursos.map((c) => <TarjetaCurso key={c.id} c={c} />)}
                </div>
              )}
            </div>

            <SugerirCard nombre={yo.nombre} avatar={yo.avatar} />
          </div>
        </div>
      </main>
    </div>
  );
}

// Banner de la sección. El texto va en HTML (no dentro de la imagen) para que
// se vea nítido en cualquier pantalla; la foto y los iconos vienen del diseño.
// Los tamaños van en cqw: se escalan con el ancho del banner, como en Figma.
function BannerEspeciales() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl select-none aspect-[2.3] sm:aspect-[4848/1040]"
      style={{
        containerType: "inline-size",
        background: "linear-gradient(90deg, #F0E6FA 0%, #EBDFFA 45%, #D6BFFA 100%)",
      }}
    >
      {/* Lado derecho: Melissa y los iconos, tal cual vienen del diseño. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/especiales/banner-derecha.jpg"
        alt=""
        draggable={false}
        className="absolute inset-y-0 right-0 h-full w-auto max-w-[52%] object-cover object-[70%_50%] sm:object-left"
        style={{ maskImage: "linear-gradient(90deg, transparent 0%, #000 12%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 12%)" }}
      />

      <div className="absolute inset-y-0 left-0 flex flex-col justify-center" style={{ paddingLeft: "4.4cqw", width: "60%" }}>
        <h2
          className="font-display font-extrabold text-[#151433] leading-[1.06] tracking-[-0.01em]"
          style={{ fontSize: "clamp(17px, 3.7cqw, 46px)" }}
        >
          Dale un <span className="text-[#5B2BE0]">boost</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/especiales/banner-cohete.png" alt="" draggable={false}
            className="inline-block align-[-0.12em] ml-[0.25em]" style={{ height: "1.05em" }} />
          <br />
          a tu contenido y carrera
        </h2>
        <p
          className="text-[#4B4760] leading-snug mt-[1.4cqw]"
          style={{ fontSize: "clamp(10px, 1.32cqw, 17px)", maxWidth: "36em" }}
        >
          Cursos prácticos y exclusivos para que sigas<br className="hidden sm:inline" /> creciendo, destacando y alcanzando tus metas.
        </p>
      </div>
    </div>
  );
}

function TarjetaCurso({ c }: { c: CursoEspecial }) {
  return (
    <article className="bg-surface border border-border rounded-3xl p-3 shadow-sm flex flex-col">
      <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-[#0B0B12] grid place-items-center">
        {c.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.portada} alt={c.nombre} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display font-extrabold text-white/80 text-lg px-3 text-center">{c.nombre}</span>
        )}

        <span className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/45 backdrop-blur grid place-items-center">
          <CandadoBlanco />
        </span>

        {/* La cajita «Patrocinado por» solo va si la portada no la trae ya. */}
        {c.patrocinador && !c.portada && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-white/95 rounded-full pl-2.5 pr-2 py-1 shadow-sm">
            <span className="text-[10px] font-bold text-sub">Patrocinado por</span>
            {c.patrocinadorLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.patrocinadorLogo} alt={c.patrocinador} className="h-3 object-contain" />
            ) : (
              <b className="text-[10px] text-accent">{c.patrocinador}</b>
            )}
          </span>
        )}
      </div>

      <h2 className="font-display text-lg font-extrabold leading-tight mt-3">{c.nombre}</h2>

      <div className="flex items-center gap-2 mt-2">
        <AvatarInstructor nombre={c.instructor} size={22} />
        <span className="text-[13px] text-sub font-semibold">{c.instructor}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-sub mt-2.5">
        <span className="flex items-center gap-1.5"><IconoLibro /> {c.clases.length} {c.clases.length === 1 ? "clase" : "clases"}</span>
        <span className="flex items-center gap-1.5"><IconoReloj /> {formatoDuracion(c.minutos)}</span>
        <span className="flex items-center gap-1.5"><IconoGente /> {c.estudiantes} {c.estudiantes === 1 ? "estudiante" : "estudiantes"}</span>
      </div>

      <Link href={`/app/especiales/${c.id}`}
        className="mt-4 block text-center bg-accent text-white rounded-xl py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
        Ver más
      </Link>
    </article>
  );
}

// Caja para pedir cursos: lo que llega aquí lo revisa el equipo.
function SugerirCard({ nombre, avatar }: { nombre: string; avatar: string | null }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  async function enviar() {
    setEnviando(true);
    setAviso(null);
    const r = await sugerirCurso(texto);
    setEnviando(false);
    if ("error" in r) { setAviso({ tipo: "error", msg: r.error }); return; }
    setTexto("");
    setAviso({ tipo: "ok", msg: "¡Gracias! Tu sugerencia ya nos llegó 💜" });
  }

  return (
    <aside className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
      <h2 className="font-display font-extrabold text-[16px]">Sugerir cursos</h2>

      <div className="flex items-center gap-2.5 mt-3">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={nombre} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold">
            {nombre.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="text-[13.5px] font-semibold truncate">{nombre}</span>
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Describe tu curso ideal…"
        maxLength={600}
        rows={4}
        className="w-full mt-3 bg-bg border border-border rounded-2xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-accent resize-none"
      />

      {aviso && (
        <p className={`text-[12.5px] mt-2 leading-snug ${aviso.tipo === "ok" ? "text-green" : "text-pink"}`}>
          {aviso.msg}
        </p>
      )}

      <button
        onClick={enviar}
        disabled={enviando || texto.trim().length < 10}
        className="w-full mt-3 bg-accent text-white rounded-xl py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar"}
      </button>
    </aside>
  );
}

function CandadoBlanco() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconoLibro() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" /></svg>;
}
function IconoReloj() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function IconoGente() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" /><circle cx="9.5" cy="8" r="3.5" /><path d="M21 20v-1a4 4 0 0 0-3-3.9" /><path d="M16.5 4.6a3.5 3.5 0 0 1 0 6.8" /></svg>;
}

export function formatoDuracion(min: number): string {
  if (min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
