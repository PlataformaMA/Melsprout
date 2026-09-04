"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getComunidadAdmin, alternarVisible, activarGrupo, borrarGrupoAdmin,
  type PublicacionAdmin, type GrupoAdmin, type ComentarioReto,
} from "@/lib/comunidad-admin-actions";

type Datos = Awaited<ReturnType<typeof getComunidadAdmin>>;
const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

// Comunidad: lo mismo que ven las alumnas, con las herramientas del equipo.
export function ComunidadAdminTab() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [vista, setVista] = useState<"publicaciones" | "grupos" | "retos">("publicaciones");
  const [busca, setBusca] = useState("");

  const cargar = () => getComunidadAdmin().then(setDatos).catch(() => setDatos(null));
  useEffect(() => { cargar(); }, []);

  const t = datos?.totales;

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-extrabold leading-tight">Comunidad</h1>
        <p className="text-sub text-[13px] mt-0.5">Lo que está publicado ahora mismo en la plataforma.</p>
      </div>

      {t && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {([
            ["Publicaciones", t.publicaciones],
            ["Respuestas", t.respuestas],
            ["Grupos", t.grupos],
            ["Retos de comunidad", t.retos],
          ] as [string, number][]).map(([k, n]) => (
            <div key={k} className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm">
              <div className="font-display text-xl font-extrabold">{n.toLocaleString("es-MX")}</div>
              <div className="text-[12px] text-sub">{k}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-6 border-b border-border mb-4 overflow-x-auto">
        {([
          ["publicaciones", "Publicaciones"],
          ["grupos", "Grupos"],
          ["retos", "Comentarios de retos"],
        ] as const).map(([id, txt]) => (
          <button key={id} onClick={() => setVista(id)}
            className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 whitespace-nowrap ${
              vista === id ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
            }`}>{txt}</button>
        ))}
      </div>

      <input value={busca} onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por texto o por quién lo escribió…"
        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-accent mb-4" />

      {datos === null ? (
        <p className="text-[13.5px] text-hint py-8 text-center">Cargando comunidad…</p>
      ) : vista === "publicaciones" ? (
        <Publicaciones lista={datos.publicaciones} busca={busca} onCambio={cargar} />
      ) : vista === "grupos" ? (
        <Grupos lista={datos.grupos} busca={busca} onCambio={cargar} />
      ) : (
        <ComentariosDeRetos lista={datos.comentariosReto} busca={busca} onCambio={cargar} />
      )}
    </div>
  );
}

function Publicaciones({ lista, busca, onCambio }: {
  lista: PublicacionAdmin[]; busca: string; onCambio: () => void;
}) {
  const q = busca.trim().toLowerCase();
  const filtrada = useMemo(() => lista.filter((p) =>
    !q || p.texto.toLowerCase().includes(q) || p.autor.toLowerCase().includes(q) ||
    (p.titulo || "").toLowerCase().includes(q)), [lista, q]);

  if (!filtrada.length) return <p className="text-[13.5px] text-hint py-8 text-center">Nada por aquí.</p>;

  return (
    <div className="space-y-2.5">
      {filtrada.map((p) => (
        <article key={p.id} className={`bg-surface border rounded-2xl p-4 shadow-sm ${p.visible ? "border-border" : "border-border opacity-60"}`}>
          <div className="flex items-start gap-3">
            {p.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar} alt={p.autor} className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold shrink-0">
                {p.autor.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/app/creador/${p.autorId}`} target="_blank" className="font-bold text-[13.5px] hover:text-accent transition">
                  {p.autor}
                </Link>
                <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5">{p.categoria}</span>
                {p.grupo && <span className="text-[11px] font-bold text-blue bg-blue-soft rounded-full px-2 py-0.5">{p.grupo}</span>}
                {p.esReto && <span className="text-[11px] font-bold text-sub bg-bg border border-border rounded-full px-2 py-0.5">De un reto</span>}
                {!p.visible && <span className="text-[11px] font-bold text-red-600 bg-red-100 rounded-full px-2 py-0.5">Oculta</span>}
              </div>
              {p.titulo && <h3 className="font-display font-extrabold text-[14px] mt-1">{p.titulo}</h3>}
              <p className="text-[13.5px] text-text leading-relaxed mt-0.5 line-clamp-3 whitespace-pre-wrap">{p.texto}</p>
              <div className="flex flex-wrap items-center gap-4 text-[12px] text-hint mt-2">
                <span>♥ {p.likes}</span>
                <span>💬 {p.respuestas}</span>
                <span>{fecha(p.fecha)}</span>
                <button
                  onClick={async () => {
                    const r = await alternarVisible("post", p.id, !p.visible);
                    if ("error" in r) { alert(r.error); return; }
                    onCambio();
                  }}
                  className={`ml-auto font-bold ${p.visible ? "text-sub hover:text-pink" : "text-accent"}`}>
                  {p.visible ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Grupos({ lista, busca, onCambio }: { lista: GrupoAdmin[]; busca: string; onCambio: () => void }) {
  const q = busca.trim().toLowerCase();
  const filtrada = lista.filter((g) => !q || g.nombre.toLowerCase().includes(q) || g.creador.toLowerCase().includes(q));
  if (!filtrada.length) return <p className="text-[13.5px] text-hint py-8 text-center">Todavía no hay grupos.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filtrada.map((g) => (
        <article key={g.id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center text-lg shrink-0">{g.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-[14.5px] truncate">{g.nombre}</h3>
                <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
                  g.estado === "activo" ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>
                  {g.estado === "activo" ? "Activo" : "Propuesto"}
                </span>
              </div>
              <p className="text-[12.5px] text-sub mt-0.5 line-clamp-2">{g.descripcion}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-hint mt-2">
                <span>👥 {g.miembros} miembros</span>
                <span>💬 {g.publicaciones}</span>
                {g.estado !== "activo" && <span>👍 {g.apoyos}/{g.meta} apoyos</span>}
                <span>Creado por {g.creador}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-[12.5px] font-bold">
                <Link href={`/app/comunidad/grupo/${g.id}`} target="_blank" className="text-accent">Ver muro →</Link>
                {g.estado !== "activo" && (
                  <button onClick={async () => {
                    if (!confirm(`¿Activar «${g.nombre}» sin esperar los apoyos?`)) return;
                    const r = await activarGrupo(g.id);
                    if ("error" in r) { alert(r.error); return; }
                    onCambio();
                  }} className="text-green">Activar ya</button>
                )}
                <button onClick={async () => {
                  if (!confirm(`¿Borrar el grupo «${g.nombre}»? Se pierde su muro.`)) return;
                  const r = await borrarGrupoAdmin(g.id);
                  if ("error" in r) { alert(r.error); return; }
                  onCambio();
                }} className="text-pink ml-auto">Borrar</button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ComentariosDeRetos({ lista, busca, onCambio }: {
  lista: ComentarioReto[]; busca: string; onCambio: () => void;
}) {
  const q = busca.trim().toLowerCase();
  const filtrada = lista.filter((c) => !q || c.texto.toLowerCase().includes(q) || c.autor.toLowerCase().includes(q));
  if (!filtrada.length) return <p className="text-[13.5px] text-hint py-8 text-center">Sin comentarios en retos.</p>;

  return (
    <div className="space-y-2">
      {filtrada.map((c) => (
        <div key={c.id} className={`flex items-start gap-3 bg-surface border border-border rounded-2xl px-4 py-3 ${c.visible ? "" : "opacity-60"}`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <b className="text-[13px]">{c.autor}</b>
              <span className="text-[11.5px] text-hint">{fecha(c.fecha)}</span>
              {!c.visible && <span className="text-[11px] font-bold text-red-600 bg-red-100 rounded-full px-2 py-0.5">Oculto</span>}
            </div>
            <p className="text-[13.5px] mt-0.5 whitespace-pre-wrap">{c.texto}</p>
          </div>
          <button onClick={async () => {
            const r = await alternarVisible("comentario", c.id, !c.visible);
            if ("error" in r) { alert(r.error); return; }
            onCambio();
          }} className={`text-[12.5px] font-bold shrink-0 ${c.visible ? "text-sub hover:text-pink" : "text-accent"}`}>
            {c.visible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      ))}
    </div>
  );
}
