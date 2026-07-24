"use client";

import Link from "next/link";

export type RankItem = {
  pos: number;
  id: string;
  nombre: string;
  avatarUrl: string | null;
  xp: number;
  nivelNum: number;
  nivelNombre: string;
  esTu: boolean;
};

// Modal "Ranking de estudiantes": podio (1-2-3), destacados (4-10) y lista completa.
export function RankingModal({ ranking, onClose }: { ranking: RankItem[]; onClose: () => void }) {
  const top3 = ranking.slice(0, 3);
  const podio = [top3[1], top3[0], top3[2]].filter(Boolean); // 2 · 1 · 3
  const destacados = ranking.slice(3, 10);
  const resto = ranking.slice(10);

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl my-4 onb-slide">
        {/* Cabecera */}
        <div className="flex items-start gap-3 p-5 sm:p-6 pb-3">
          <div className="w-11 h-11 rounded-2xl bg-accent-soft grid place-items-center text-2xl shrink-0">🏆</div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-extrabold text-lg sm:text-xl leading-tight">Ranking de estudiantes</h2>
            <p className="text-sub text-[13px] mt-0.5">Ellos son los que más están aprendiendo y creciendo en la comunidad.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="w-9 h-9 grid place-items-center rounded-full text-hint hover:bg-bg transition shrink-0">✕</button>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 max-h-[75vh] overflow-y-auto">
          {/* Podio */}
          {podio.length > 0 && (
            <div className="flex items-end justify-center gap-2 sm:gap-4 mt-2 mb-6">
              {podio.map((p) => {
                const primero = p.pos === 1;
                return (
                  <div key={p.id} className={`flex flex-col items-center ${primero ? "order-none" : ""}`} style={{ width: primero ? 130 : 104 }}>
                    <div className="relative">
                      {primero && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xl">👑</span>}
                      <Avatar nombre={p.nombre} url={p.avatarUrl} size={primero ? 72 : 56} anillo={primero ? "ring-amber-400" : p.pos === 2 ? "ring-slate-300" : "ring-amber-600/60"} />
                      <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full grid place-items-center text-[12px] font-extrabold text-white shadow ${
                        primero ? "bg-amber-400" : p.pos === 2 ? "bg-slate-400" : "bg-amber-600"
                      }`}>{p.pos}</span>
                    </div>
                    <div className="text-[13px] font-bold mt-2 text-center truncate max-w-full leading-tight">{p.nombre}{p.esTu && <span className="text-accent"> · Tú</span>}</div>
                    <div className="text-[11.5px] text-accent font-semibold">★ {p.xp.toLocaleString()} XP</div>
                    <div className={`mt-2 rounded-t-xl grid place-items-center text-white font-display font-extrabold ${
                      primero ? "bg-accent h-16 text-2xl" : "bg-accent/60 h-10 text-lg"
                    }`} style={{ width: "100%" }}>{p.pos}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Destacados 4-10 */}
          {destacados.length > 0 && (
            <>
              <div className="text-[13px] font-bold mb-2">✨ Destacados (Top 4 - 10)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {destacados.map((d) => (
                  <div key={d.id} className={`flex items-center gap-2 rounded-xl border border-border px-2.5 py-2 ${d.esTu ? "bg-accent-soft" : "bg-bg"}`}>
                    <span className="text-[12px] font-extrabold text-hint w-4 shrink-0">{d.pos}</span>
                    <Avatar nombre={d.nombre} url={d.avatarUrl} size={30} />
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold truncate leading-tight">{d.nombre}{d.esTu && <span className="text-accent"> · Tú</span>}</div>
                      <div className="text-[10.5px] text-sub leading-tight">★ {d.xp.toLocaleString()} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Todos los estudiantes 11+ */}
          {resto.length > 0 && (
            <>
              <div className="text-[13px] font-bold mb-2">👥 Todos los estudiantes</div>
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="grid grid-cols-[44px_1fr_auto_auto] gap-2 px-3 py-2 bg-bg text-[11px] font-bold text-hint uppercase tracking-wide">
                  <span>Pos.</span><span>Estudiante</span><span className="text-right">XP</span><span className="text-right pl-3">Nivel</span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-border">
                  {resto.map((r) => (
                    <div key={r.id} className={`grid grid-cols-[44px_1fr_auto_auto] gap-2 items-center px-3 py-2 ${r.esTu ? "bg-accent-soft" : ""}`}>
                      <span className="text-[13px] font-extrabold text-hint">{r.pos}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar nombre={r.nombre} url={r.avatarUrl} size={26} />
                        <span className="text-[12.5px] font-semibold truncate">{r.nombre}{r.esTu && <span className="text-accent"> · Tú</span>}</span>
                      </div>
                      <span className="text-[12px] text-sub text-right whitespace-nowrap">{r.xp.toLocaleString()} XP</span>
                      <span className="text-[11px] font-bold text-accent text-right pl-3 whitespace-nowrap">Nivel {r.nivelNum}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pie */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
            <p className="text-[12px] text-sub text-center sm:text-left">Sigue participando en clases, retos y actividades para subir en el ranking.</p>
            <Link href="/app/racha" onClick={onClose}
              className="shrink-0 rounded-full border border-accent/40 text-accent font-bold text-[13px] px-4 py-2 hover:bg-accent-soft transition whitespace-nowrap">
              Ver recompensas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ nombre, url, size, anillo }: { nombre: string; url: string | null; size: number; anillo?: string }) {
  const cls = `rounded-full object-cover shrink-0 ${anillo ? `ring-2 ${anillo}` : ""}`;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={nombre} className={cls} style={{ width: size, height: size }} />;
  }
  return (
    <span className={`bg-accent/15 text-accent grid place-items-center font-bold shrink-0 ${anillo ? `ring-2 ${anillo}` : ""}`}
      style={{ width: size, height: size, borderRadius: 9999, fontSize: size * 0.36 }}>
      {nombre.slice(0, 2).toUpperCase()}
    </span>
  );
}
