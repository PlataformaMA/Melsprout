"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listarModeracion, moderar,
  type Ambito, type ItemModeracion, type EstadoMod, type Accion,
} from "@/lib/moderacion-actions";

const ESTADOS: Record<EstadoMod, { texto: string; clase: string }> = {
  pendiente: { texto: "Pendiente", clase: "bg-amber-100 text-amber-700" },
  aprobado: { texto: "Aprobado", clase: "bg-green/10 text-green" },
  oculto: { texto: "Oculto", clase: "bg-bg text-hint border border-border" },
  spam: { texto: "Spam", clase: "bg-red-100 text-red-600" },
};

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// Moderación: revisar lo que escriben las alumnas y decidir qué se queda.
export function ModeracionTab() {
  const [ambito, setAmbito] = useState<Ambito>("ruta");
  const [datos, setDatos] = useState<{ items: ItemModeracion[]; mundos: { id: string; nombre: string }[] } | null>(null);
  const [busca, setBusca] = useState("");
  const [mundo, setMundo] = useState("todos");
  const [estado, setEstado] = useState<EstadoMod | "todos">("pendiente");
  const [orden, setOrden] = useState<"nuevos" | "viejos">("nuevos");
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [abierto, setAbierto] = useState<ItemModeracion | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = () => {
    setDatos(null);
    setMarcados(new Set());
    listarModeracion(ambito)
      .then((d) => { setDatos(d); setAbierto(null); })
      .catch(() => { setDatos({ items: [], mundos: [] }); setAbierto(null); });
  };
  useEffect(cargar, [ambito]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const out = (datos?.items || []).filter((i) => {
      if (estado !== "todos" && i.estado !== estado) return false;
      if (mundo !== "todos" && i.moduloId !== mundo) return false;
      if (!q) return true;
      return i.texto.toLowerCase().includes(q) || i.autorNombre.toLowerCase().includes(q);
    });
    return orden === "nuevos" ? out : [...out].reverse();
  }, [datos, busca, mundo, estado, orden]);

  const todosMarcados = lista.length > 0 && lista.every((i) => marcados.has(i.id));

  function alternar(id: string) {
    setMarcados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function aplicar(accion: Accion, unos?: ItemModeracion[]) {
    const objetivo = unos ?? lista.filter((i) => marcados.has(i.id));
    if (!objetivo.length) return;
    const verbo = accion === "aprobar" ? "aprobar" : accion === "ocultar" ? "ocultar" : "marcar como spam";
    if (objetivo.length > 1 && !confirm(`¿${verbo} ${objetivo.length} comentarios?`)) return;

    setTrabajando(true);
    const r = await moderar(objetivo.map((i) => ({ id: i.id, origen: i.origen })), accion);
    setTrabajando(false);
    if ("error" in r) { alert(r.error); return; }
    cargar();
  }

  const pendientes = (datos?.items || []).filter((i) => i.estado === "pendiente").length;

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-extrabold leading-tight">Moderación</h1>
        <p className="text-sub text-[13px] mt-0.5">
          Revisa lo que escriben las alumnas. {pendientes > 0 && <b className="text-accent">{pendientes} sin revisar.</b>}
        </p>
      </div>

      {/* Ámbitos */}
      <div className="flex gap-6 border-b border-border mb-4 overflow-x-auto">
        {([
          ["ruta", "Ruta de aprendizaje"],
          ["especiales", "Cursos especiales"],
          ["comunidad", "Comunidad"],
        ] as const).map(([id, txt]) => (
          <button key={id} onClick={() => setAmbito(id)}
            className={`pb-2.5 text-[14px] font-bold transition -mb-px border-b-2 whitespace-nowrap ${
              ambito === id ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
            }`}>{txt}</button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar comentarios…"
          className="flex-1 min-w-[200px] bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-accent" />
        {ambito !== "comunidad" && (
          <select value={mundo} onChange={(e) => setMundo(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
            <option value="todos">Todos los mundos</option>
            {(datos?.mundos || []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        )}
        <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoMod | "todos")}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="pendiente">Pendientes</option>
          <option value="aprobado">Aprobados</option>
          <option value="oculto">Ocultos</option>
          <option value="spam">Spam</option>
          <option value="todos">Todos</option>
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as "nuevos" | "viejos")}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-accent">
          <option value="nuevos">Más recientes</option>
          <option value="viejos">Más antiguos</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Lista */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <label className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer">
              <input type="checkbox" checked={todosMarcados}
                onChange={() => setMarcados(todosMarcados ? new Set() : new Set(lista.map((i) => i.id)))}
                className="accent-accent w-4 h-4" />
              Seleccionar todo ({lista.length})
            </label>
            {marcados.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <span className="text-[12.5px] text-sub">{marcados.size} seleccionados</span>
                <button onClick={() => aplicar("aprobar")} disabled={trabajando}
                  className="bg-accent text-white rounded-lg px-3 py-1.5 text-[12.5px] font-bold hover:brightness-110 transition disabled:opacity-50">Aprobar</button>
                <button onClick={() => aplicar("ocultar")} disabled={trabajando}
                  className="border border-border rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-sub hover:bg-bg transition disabled:opacity-50">Ocultar</button>
                <button onClick={() => aplicar("spam")} disabled={trabajando}
                  className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-[12.5px] font-bold hover:bg-red-50 transition disabled:opacity-50">Spam</button>
              </div>
            )}
          </div>

          {datos === null ? (
            <p className="text-[13.5px] text-hint py-8 text-center">Cargando…</p>
          ) : lista.length === 0 ? (
            <p className="text-[13.5px] text-hint py-8 text-center">
              {estado === "pendiente" ? "Nada por revisar. Todo al día 💜" : "Nada coincide con esos filtros."}
            </p>
          ) : (
            <div className="space-y-2.5">
              {lista.map((i) => (
                <article key={i.id}
                  className={`bg-surface border rounded-2xl p-4 shadow-sm transition cursor-pointer ${
                    abierto?.id === i.id ? "border-accent" : "border-border hover:border-accent/40"
                  }`}
                  onClick={() => setAbierto(i)}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={marcados.has(i.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => alternar(i.id)}
                      className="accent-accent w-4 h-4 mt-1 shrink-0" />
                    <Avatar item={i} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-[13.5px]">{i.autorNombre}</b>
                        {i.grupo && (
                          <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5">{i.grupo}</span>
                        )}
                        <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${ESTADOS[i.estado].clase}`}>
                          {ESTADOS[i.estado].texto}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-hint mt-0.5">
                        Publicado en <b className="text-sub">{i.donde}</b> — {fecha(i.fecha)}
                      </div>
                      <p className="text-[13.5px] text-text leading-relaxed mt-1.5 line-clamp-3">💬 {i.texto}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Detalle */}
        <aside className="lg:sticky lg:top-5">
          {!abierto ? (
            <div className="bg-surface border border-border rounded-3xl p-6 text-center shadow-sm">
              <div className="text-3xl">💬</div>
              <p className="text-[13.5px] text-sub mt-2 leading-snug">
                Toca un comentario para verlo completo y decidir qué hacer.
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="text-[12.5px] font-bold text-sub">📄 {abierto.donde}</div>
                {abierto.dondeId && (
                  <Link href={`/app/clase/${abierto.dondeId}`} target="_blank"
                    className="text-[11.5px] font-bold text-accent">Ver en la plataforma →</Link>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Avatar item={abierto} size={38} />
                  <div className="min-w-0">
                    <div className="font-bold text-[13.5px] truncate">{abierto.autorNombre}</div>
                    <div className="text-[11.5px] text-hint">
                      {abierto.grupo ? `${abierto.grupo} · ` : ""}{fecha(abierto.fecha)}
                    </div>
                  </div>
                </div>
                <p className="text-[13.5px] text-text leading-relaxed mt-3 whitespace-pre-wrap">{abierto.texto}</p>
                <Link href={`/app/creador/${abierto.autorId}`} target="_blank"
                  className="inline-block text-[12px] font-bold text-accent mt-3">Ver su perfil →</Link>
              </div>

              <div className="flex bg-accent">
                {([["aprobar", "Aprobar"], ["ocultar", "Ocultar"], ["spam", "Spam"]] as const).map(([a, txt], i) => (
                  <button key={a} onClick={() => aplicar(a, [abierto])} disabled={trabajando}
                    className={`flex-1 py-3 text-[13px] font-bold text-white hover:bg-white/10 transition disabled:opacity-60 ${
                      i > 0 ? "border-l border-white/25" : ""
                    }`}>{txt}</button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Avatar({ item, size = 34 }: { item: ItemModeracion; size?: number }) {
  if (item.autorAvatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.autorAvatar} alt={item.autorNombre} style={{ width: size, height: size }}
      className="rounded-full object-cover shrink-0" />;
  }
  return (
    <span style={{ width: size, height: size }}
      className="rounded-full bg-accent/15 text-accent grid place-items-center text-[12px] font-bold shrink-0">
      {item.autorNombre.slice(0, 2).toUpperCase()}
    </span>
  );
}
