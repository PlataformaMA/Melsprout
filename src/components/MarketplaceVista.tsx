"use client";

import { useState, useEffect, useTransition } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { ProSeccionModal } from "@/components/ProSeccionModal";
import { listarCampanias, listarMarcas, aplicarACampania } from "@/lib/marketplace";
import type { Campania, Marca } from "@/lib/marketplace";

// Marketplace: las campañas de marcas a las que se puede aplicar, y las marcas
// con las que trabaja Melsprout. Es parte de Boost Pro.

type Opciones = { categorias: string[]; plataformas: string[]; tipos: string[] };

export function MarketplaceVista({
  nombre, avatarUrl, xp, racha, opciones, bloqueado = false,
}: {
  nombre: string; avatarUrl: string | null; xp: number; racha: number;
  opciones: Opciones;
  // Sin Boost Pro la sección se ve, pero no se puede usar.
  bloqueado?: boolean;
}) {
  const [tab, setTab] = useState<"campanias" | "marcas">("campanias");
  const [texto, setTexto] = useState("");
  const [orden, setOrden] = useState<"nuevas" | "pago" | "cierre">("nuevas");
  const [pagina, setPagina] = useState(1);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);
  const [filtros, setFiltros] = useState<{ categorias: string[]; plataformas: string[]; tipos: string[] }>(
    { categorias: [], plataformas: [], tipos: [] }
  );

  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [paginas, setPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [aplicando, setAplicando] = useState<Campania | null>(null);
  const [proAbierto, setProAbierto] = useState(bloqueado);

  // Trae lo que toca cada vez que cambia algo del filtro.
  useEffect(() => {
    if (bloqueado) { setCargando(false); return; }
    let vivo = true;
    setCargando(true);
    const t = setTimeout(async () => {
      if (tab === "campanias") {
        const r = await listarCampanias({ texto, ...filtros, orden, pagina });
        if (vivo) { setCampanias(r.campanias); setPaginas(r.paginas); }
      } else {
        const r = await listarMarcas(texto, filtros.categorias, pagina);
        if (vivo) { setMarcas(r.marcas); setPaginas(r.paginas); }
      }
      if (vivo) setCargando(false);
    }, 300);
    return () => { vivo = false; clearTimeout(t); };
  }, [tab, texto, filtros, orden, pagina, bloqueado]);

  function cambiarTab(t: "campanias" | "marcas") { setTab(t); setPagina(1); }

  const cuantosFiltros =
    filtros.categorias.length + filtros.plataformas.length + filtros.tipos.length;

  return (
    <div className="min-h-screen bg-bg flex">
      {proAbierto && <ProSeccionModal onClose={() => setProAbierto(false)} />}
      <AppSidebar active="marketplace" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Marketplace</h1>
          <p className="text-sub text-[14px] mt-1">
            Revisa las campañas y marcas con las que puedes colaborar
          </p>

          {/* Campañas | Marcas */}
          <div className="flex gap-6 border-b border-border mt-5 mb-5">
            {([["campanias", "Campañas"], ["marcas", "Marcas"]] as const).map(([k, txt]) => (
              <button key={k} onClick={() => cambiarTab(k)}
                className={`pb-2.5 text-[15px] font-bold transition -mb-px border-b-2 ${
                  tab === k ? "text-accent border-accent" : "text-sub border-transparent hover:text-text"
                }`}>
                {txt}
              </button>
            ))}
          </div>

          {/* Buscar · Filtrar · Ordenar */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <label className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3.5 py-2.5 flex-1 min-w-[200px] max-w-[380px]">
              <Lupa />
              <input value={texto} onChange={(e) => { setTexto(e.target.value); setPagina(1); }}
                placeholder="Buscar"
                className="flex-1 min-w-0 bg-transparent text-[14px] outline-none" />
            </label>
            <button onClick={() => setFiltrosAbierto(true)}
              className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] font-semibold hover:border-accent/40 transition">
              <Embudo /> Filtrar
              {cuantosFiltros > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-extrabold grid place-items-center">
                  {cuantosFiltros}
                </span>
              )}
            </button>
            {tab === "campanias" && (
              <label className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5 text-[14px] font-semibold">
                <Flechas />
                <select value={orden} onChange={(e) => { setOrden(e.target.value as typeof orden); setPagina(1); }}
                  className="bg-transparent outline-none cursor-pointer">
                  <option value="nuevas">Más recientes</option>
                  <option value="pago">Mejor pagadas</option>
                  <option value="cierre">Cierran pronto</option>
                </select>
              </label>
            )}
          </div>

          {bloqueado ? (
            <Aviso
              titulo="El Marketplace es parte de Boost Pro"
              texto="Con el plan puedes ver las campañas de las marcas y aplicar a las que te queden."
              accion={() => setProAbierto(true)}
              etiqueta="Ver qué incluye"
            />
          ) : cargando ? (
            <p className="text-[14px] text-sub py-10 text-center">Cargando…</p>
          ) : tab === "campanias" ? (
            campanias.length === 0 ? (
              <Aviso
                titulo="Todavía no hay campañas"
                texto="Cuando una marca publique una colaboración, va a aparecer aquí."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {campanias.map((c) => (
                  <TarjetaCampania key={c.id} c={c} onAplicar={() => setAplicando(c)} />
                ))}
              </div>
            )
          ) : marcas.length === 0 ? (
            <Aviso
              titulo="Todavía no hay marcas"
              texto="Aquí van a estar las marcas con las que puedes colaborar."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {marcas.map((m) => <TarjetaMarca key={m.id} m={m} />)}
            </div>
          )}

          {!bloqueado && !cargando && paginas > 1 && (
            <Paginas pagina={pagina} total={paginas} ir={setPagina} />
          )}
        </div>
      </main>

      {filtrosAbierto && (
        <ModalFiltros
          opciones={opciones}
          valor={filtros}
          soloCategorias={tab === "marcas"}
          onAplicar={(f) => { setFiltros(f); setPagina(1); setFiltrosAbierto(false); }}
          onCerrar={() => setFiltrosAbierto(false)}
        />
      )}

      {aplicando && (
        <ModalAplicar
          campania={aplicando}
          onListo={() => {
            setAplicando(null);
            setCampanias((v) => v.map((c) => (c.id === aplicando.id ? { ...c, miEstado: "enviada", aplicantes: c.aplicantes + 1 } : c)));
          }}
          onCerrar={() => setAplicando(null)}
        />
      )}
    </div>
  );
}

// ————— Tarjeta de campaña —————
function TarjetaCampania({ c, onAplicar }: { c: Campania; onAplicar: () => void }) {
  return (
    <article className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
      <div className="flex gap-4">
        {c.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.imagenUrl} alt="" className="w-[88px] h-[88px] rounded-xl object-cover shrink-0" />
        ) : (
          <span className="w-[88px] h-[88px] rounded-xl bg-accent-soft shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] text-sub truncate">{c.marca}</span>
            {c.bajoNivel ? (
              <Chip texto={`🔒 Nivel ${c.nivelMinimo}`} clase="bg-bg text-sub border border-border" />
            ) : c.popular ? (
              <Chip texto="🔥 Popular" clase="bg-pink-soft text-pink" />
            ) : (
              <Chip texto="● Abierta" clase="bg-green/10 text-green" />
            )}
          </div>
          <h3 className="font-display font-extrabold text-[16px] leading-tight mt-0.5">{c.titulo}</h3>
          {c.descripcion && (
            <p className="text-[12.5px] text-sub leading-snug mt-1 line-clamp-2">{c.descripcion}</p>
          )}
        </div>
      </div>

      {(c.plataformas.length > 0 || c.etiquetas.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[...c.plataformas, ...c.etiquetas].slice(0, 4).map((t) => (
            <span key={t} className="text-[11.5px] font-semibold text-sub bg-bg border border-border rounded-full px-2.5 py-1">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between gap-3 mt-auto pt-3">
        <div className="min-w-0">
          <div className="font-display font-extrabold text-[16px] text-green">{rango(c)}</div>
          <div className="text-[11.5px] text-hint mt-0.5">
            👥 {c.aplicantes} {c.aplicantes === 1 ? "aplicante" : "aplicantes"}
            {c.cierraAt ? ` · ${cierre(c.cierraAt)}` : ""}
          </div>
        </div>
        {c.bajoNivel ? (
          <span className="shrink-0 flex items-center gap-1.5 border border-border text-sub rounded-xl px-4 py-2.5 text-[13.5px] font-bold">
            🔒 Nivel {c.nivelMinimo}
          </span>
        ) : c.miEstado ? (
          <span className={`shrink-0 rounded-xl px-4 py-2.5 text-[13.5px] font-bold ${
            c.miEstado === "aceptada" ? "bg-green/10 text-green"
              : c.miEstado === "rechazada" ? "bg-bg text-hint border border-border"
                : "bg-accent-soft text-accent"}`}>
            {c.miEstado === "aceptada" ? "Aceptada ✓" : c.miEstado === "rechazada" ? "No seleccionada" : "Enviada ✓"}
          </span>
        ) : (
          <button onClick={onAplicar}
            className="shrink-0 flex items-center gap-2 bg-accent text-white rounded-xl px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 active:scale-95 transition">
            Aplicar
          </button>
        )}
      </div>
    </article>
  );
}

// ————— Tarjeta de marca —————
function TarjetaMarca({ m }: { m: Marca }) {
  return (
    <article className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        {m.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.logoUrl} alt="" className="w-[72px] h-[72px] rounded-xl object-cover" />
        ) : (
          <span className="w-[72px] h-[72px] rounded-xl bg-accent-soft" />
        )}
        {m.destacada && <Chip texto="Destacada" clase="bg-accent-soft text-accent" />}
      </div>
      <h3 className="font-display font-extrabold text-[16px] mt-3">{m.nombre}</h3>
      {m.lema && <p className="text-[13px] text-sub leading-snug mt-0.5">{m.lema}</p>}
      {m.categoria && (
        <span className="inline-block text-[11.5px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-1 mt-2">
          {m.categoria}
        </span>
      )}
      <div className={`grid ${m.calificacion != null ? "grid-cols-4" : "grid-cols-3"} gap-2 mt-4 pt-3 border-t border-border text-center`}>
        <Dato n={m.activas} txt="Activas" />
        <Dato n={m.total} txt="Total" />
        <Dato n={m.creadores} txt="Creadores" />
        {m.calificacion != null && (
          <div>
            <div className="font-display font-extrabold text-[16px] text-accent flex items-center justify-center gap-1">
              <span aria-hidden>★</span>{m.calificacion.toFixed(1)}
            </div>
            <div className="text-[11px] text-hint">Calificación</div>
          </div>
        )}
      </div>
    </article>
  );
}

function Dato({ n, txt }: { n: number; txt: string }) {
  return (
    <div>
      <div className="font-display font-extrabold text-[16px]">{n}</div>
      <div className="text-[11px] text-hint">{txt}</div>
    </div>
  );
}

// ————— Filtros —————
function ModalFiltros({ opciones, valor, soloCategorias, onAplicar, onCerrar }: {
  opciones: Opciones;
  valor: { categorias: string[]; plataformas: string[]; tipos: string[] };
  soloCategorias?: boolean;
  onAplicar: (f: { categorias: string[]; plataformas: string[]; tipos: string[] }) => void;
  onCerrar: () => void;
}) {
  const [f, setF] = useState(valor);
  const alternar = (campo: keyof typeof f, v: string) =>
    setF((x) => ({
      ...x,
      [campo]: x[campo].includes(v) ? x[campo].filter((y) => y !== v) : [...x[campo], v],
    }));

  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[400px] bg-surface rounded-3xl shadow-2xl my-4 onb-slide flex flex-col max-h-[86vh]">
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-display font-extrabold text-[17px]">Filtros</h2>
        </div>

        <div className="px-5 overflow-y-auto flex-1">
          <Grupo titulo="Categoría" opciones={opciones.categorias}
            puestos={f.categorias} alternar={(v) => alternar("categorias", v)} />
          {!soloCategorias && (
            <>
              <Grupo titulo="Plataforma" opciones={opciones.plataformas}
                puestos={f.plataformas} alternar={(v) => alternar("plataformas", v)} />
              <Grupo titulo="Tipo de campaña" opciones={opciones.tipos}
                puestos={f.tipos} alternar={(v) => alternar("tipos", v)} />
            </>
          )}
        </div>

        <div className="p-5 pt-3 border-t border-border flex items-center gap-3">
          <button onClick={() => setF({ categorias: [], plataformas: [], tipos: [] })}
            className="text-[13px] font-bold text-sub hover:text-text transition">
            Limpiar
          </button>
          <button onClick={() => onAplicar(f)}
            className="flex-1 bg-accent text-white font-bold text-[15px] rounded-xl py-3 hover:brightness-110 active:scale-95 transition">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function Grupo({ titulo, opciones, puestos, alternar }: {
  titulo: string; opciones: string[]; puestos: string[]; alternar: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="font-display font-extrabold text-[13.5px] mb-2">{titulo}</h3>
      <div className="space-y-1">
        {opciones.map((o) => (
          <label key={o} className="flex items-center gap-2.5 text-[13.5px] text-sub cursor-pointer py-1">
            <input type="checkbox" checked={puestos.includes(o)} onChange={() => alternar(o)}
              className="w-4 h-4 accent-accent cursor-pointer" />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

// ————— Aplicar —————
function ModalAplicar({ campania, onListo, onCerrar }: {
  campania: Campania; onListo: () => void; onCerrar: () => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [enlace, setEnlace] = useState("");
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();

  function enviar() {
    setError("");
    startTransition(async () => {
      const r = await aplicarACampania(campania.id, mensaje, enlace);
      if ("error" in r) { setError(r.error); return; }
      onListo();
    });
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-[440px] bg-surface rounded-3xl shadow-2xl my-4 onb-slide p-6">
        <button type="button" onClick={onCerrar} aria-label="Cerrar"
          className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="text-[12.5px] text-sub pr-8">{campania.marca}</div>
        <h2 className="font-display font-extrabold text-[20px] leading-tight mt-0.5 pr-8">
          {campania.titulo}
        </h2>
        <div className="font-display font-extrabold text-[15px] text-green mt-1.5">{rango(campania)}</div>

        <label className="block mt-5">
          <span className="text-[13px] font-bold">¿Por qué tú?</span>
          <p className="text-[12px] text-sub leading-snug mt-0.5 mb-1.5">
            Cuéntale a la marca qué harías con su producto y por qué encaja con tu audiencia.
          </p>
          <textarea value={mensaje} onChange={(e) => { setMensaje(e.target.value); setError(""); }}
            rows={4} maxLength={1500}
            placeholder="Yo haría…"
            className="w-full bg-bg border border-border rounded-xl px-3.5 py-3 text-[13.5px] outline-none focus:border-accent resize-none" />
        </label>

        <label className="block mt-3">
          <span className="text-[13px] font-bold">Un enlace a tu contenido <span className="text-hint font-semibold">(opcional)</span></span>
          <input value={enlace} onChange={(e) => { setEnlace(e.target.value); setError(""); }}
            type="url" placeholder="https://instagram.com/tu-cuenta"
            className="w-full mt-1.5 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-accent" />
        </label>

        {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-lg px-3 py-2 mt-3">{error}</p>}

        <button onClick={enviar} disabled={pendiente}
          className="w-full mt-5 bg-accent text-white font-bold text-[15px] rounded-full py-3.5 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition disabled:opacity-60">
          {pendiente ? "Enviando…" : "Enviar mi aplicación"}
        </button>
        <p className="text-[11.5px] text-hint text-center mt-2.5 leading-snug">
          El equipo de Melsprout la revisa y te avisa. La puedes seguir en «Campañas».
        </p>
      </div>
    </div>
  );
}

// ————— Piezas sueltas —————
function Paginas({ pagina, total, ir }: { pagina: number; total: number; ir: (n: number) => void }) {
  const nums = Array.from({ length: total }, (_, i) => i + 1).slice(0, 9);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-7">
      <button onClick={() => ir(Math.max(1, pagina - 1))} disabled={pagina === 1}
        className="rounded-xl border border-border px-4 py-2 text-[13.5px] font-semibold text-sub disabled:opacity-40 hover:bg-surface transition">
        Anterior
      </button>
      {nums.map((n) => (
        <button key={n} onClick={() => ir(n)}
          className={`w-10 h-10 rounded-xl text-[13.5px] font-bold transition ${
            n === pagina ? "bg-accent text-white" : "border border-border text-sub hover:bg-surface"}`}>
          {n}
        </button>
      ))}
      <button onClick={() => ir(Math.min(total, pagina + 1))} disabled={pagina === total}
        className="rounded-xl border border-border px-4 py-2 text-[13.5px] font-semibold text-sub disabled:opacity-40 hover:bg-surface transition">
        Siguiente
      </button>
    </div>
  );
}

function Aviso({ titulo, texto, accion, etiqueta }: {
  titulo: string; texto: string; accion?: () => void; etiqueta?: string;
}) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
      <h3 className="font-display font-extrabold text-[16px] mt-3">{titulo}</h3>
      <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">{texto}</p>
      {accion && (
        <button onClick={accion}
          className="mt-4 bg-accent text-white rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
          {etiqueta}
        </button>
      )}
    </div>
  );
}

function Chip({ texto, clase }: { texto: string; clase: string }) {
  return <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 shrink-0 ${clase}`}>{texto}</span>;
}

function rango(c: { pagoMin: number | null; pagoMax: number | null; moneda: string }): string {
  const s = (n: number) => `$${n.toLocaleString("en-US")}`;
  if (c.pagoMin && c.pagoMax) return `${s(c.pagoMin)} – ${s(c.pagoMax)}`;
  if (c.pagoMax) return `Hasta ${s(c.pagoMax)}`;
  if (c.pagoMin) return `Desde ${s(c.pagoMin)}`;
  return "A convenir";
}

function cierre(iso: string): string {
  const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (dias < 0) return "Cerrada";
  if (dias === 0) return "Cierra hoy";
  return dias === 1 ? "Cierra mañana" : `Cierra en ${dias} días`;
}

function Lupa() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-hint" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function Embudo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-sub" aria-hidden>
      <path d="M3 5h18l-7 8v6l-4 2v-8z" />
    </svg>
  );
}
function Flechas() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-sub" aria-hidden>
      <path d="M7 4v16M7 4 4 7M7 4l3 3M17 20V4M17 20l3-3M17 20l-3-3" />
    </svg>
  );
}
