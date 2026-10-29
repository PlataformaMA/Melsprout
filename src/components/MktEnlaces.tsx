"use client";

import { useState } from "react";
import { fechaYHora } from "@/lib/formato-campanias";
import { generarEnlacesFaltantes, enlacesDeCampania } from "@/lib/enlaces-afiliado";
import type { EnlaceDeCampania } from "@/lib/enlaces-afiliado";

// Quién movió qué en una campaña de afiliados: el enlace de cada embajadora,
// sus clics y sus ventas. Es con lo que se calculan las comisiones.

export function MktEnlaces({ campaniaId, lista, destino }: {
  campaniaId: string;
  lista: EnlaceDeCampania[];
  destino: string | null;
}) {
  const [datos, setDatos] = useState(lista);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  async function generar() {
    setOcupado(true);
    setAviso("");
    const r = await generarEnlacesFaltantes(campaniaId);
    if ("error" in r) { setOcupado(false); setAviso(r.error); return; }
    setDatos(await enlacesDeCampania(campaniaId));
    setOcupado(false);
    setAviso(r.creados === 0
      ? "Todas las seleccionadas ya tenían su enlace."
      : `Se generaron ${r.creados} ${r.creados === 1 ? "enlace" : "enlaces"}.`);
  }

  const clics = datos.reduce((n, e) => n + e.clics, 0);
  const ventas = datos.reduce((n, e) => n + e.ventas, 0);

  return (
    <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mt-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-extrabold text-[15.5px]">Enlaces de embajador</h2>
          <p className="text-[13px] text-sub mt-0.5">
            {datos.length} {datos.length === 1 ? "enlace" : "enlaces"} · {clics} {clics === 1 ? "clic" : "clics"} · {ventas} {ventas === 1 ? "venta" : "ventas"}
          </p>
        </div>
        <button onClick={generar} disabled={ocupado}
          className="bg-accent-soft text-accent rounded-xl px-4 py-2.5 text-[12.5px] font-bold hover:bg-accent hover:text-white transition disabled:opacity-50">
          {ocupado ? "Generando…" : "Generar los que falten"}
        </button>
      </div>

      {aviso && <p className="text-[12.5px] text-sub bg-bg rounded-xl px-3.5 py-2.5 mt-3">{aviso}</p>}

      {!destino && (
        <p className="text-[12.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mt-3 leading-snug">
          Esta campaña no tiene a dónde mandar el enlace. Se usa el checkout del curso que pide; si no
          tiene curso, hay que llenar <b>enlace_destino</b> antes de que alguien lo comparta.
        </p>
      )}
      {destino && (
        <p className="text-[12px] text-hint mt-3 break-all">
          Los enlaces mandan a <span className="font-semibold">{destino}</span>
        </p>
      )}

      {datos.length === 0 ? (
        <p className="text-[13px] text-sub text-center py-8">
          Todavía no hay enlaces. Selecciona creadoras en la pestaña <b>Creadores</b> y genera los suyos aquí.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1 mt-3">
          <table className="w-full text-[12.5px] min-w-[560px]">
            <thead>
              <tr className="text-hint text-left">
                <th className="font-semibold pb-2">Embajadora</th>
                <th className="font-semibold pb-2">Enlace</th>
                <th className="font-semibold pb-2 text-right">Clics</th>
                <th className="font-semibold pb-2 text-right">Ventas</th>
                <th className="font-semibold pb-2">Último clic</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((e) => (
                <tr key={e.codigo} className="border-t border-border/60">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2.5">
                      {e.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center text-[10px] font-extrabold shrink-0">
                          {e.nombre.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <b className="block truncate">{e.nombre}</b>
                        {e.usuario && <span className="block text-[11.5px] text-hint truncate">@{e.usuario}</span>}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5">
                    <button onClick={() => navigator.clipboard?.writeText(e.url)}
                      title="Copiar"
                      className="font-semibold text-accent hover:underline break-all text-left">
                      /r/{e.codigo} ⧉
                    </button>
                  </td>
                  <td className="py-2.5 text-right font-bold">{e.clics}</td>
                  <td className="py-2.5 text-right font-bold">{e.ventas}</td>
                  <td className="py-2.5 text-sub whitespace-nowrap">
                    {e.ultimoClic ? fechaYHora(e.ultimoClic) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
