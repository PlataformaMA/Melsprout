"use client";

import { useState, useTransition } from "react";
import { MarcaShell } from "@/components/MarcaShell";
import { registrarEmpresa } from "@/lib/marca-cuenta";
import type { MiMarca } from "@/lib/marca-cuenta";

// Los datos de la marca, que ella misma puede corregir.
export function MarcaCuenta({ marca, categorias }: { marca: MiMarca; categorias: string[] }) {
  const [nombre, setNombre] = useState(marca.nombre);
  const [sitio, setSitio] = useState(marca.sitio ?? "");
  const [categoria, setCategoria] = useState(marca.categoria ?? "");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [pendiente, startTransition] = useTransition();

  function guardar() {
    setError(""); setAviso("");
    startTransition(async () => {
      const r = await registrarEmpresa({ nombre, sitio, categoria });
      if ("error" in r) { setError(r.error); return; }
      setAviso("Datos guardados.");
    });
  }

  return (
    <MarcaShell marca={marca} activo="cuenta">
      <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Mi cuenta</h1>
      <p className="text-sub text-[13.5px] mt-1">Los datos de tu marca en Melsprout.</p>

      <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm mt-5 max-w-[520px] space-y-3.5">
        <label className="block">
          <span className="text-[13px] font-bold">Nombre de la empresa</span>
          <input value={nombre} onChange={(e) => { setNombre(e.target.value); setError(""); }} className={input} />
        </label>

        <label className="block">
          <span className="text-[13px] font-bold">Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={input}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-[13px] font-bold">Sitio web</span>
          <input value={sitio} onChange={(e) => { setSitio(e.target.value); setError(""); }}
            type="url" placeholder="https://tumarca.com" className={input} />
        </label>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[13px] font-bold">Estado:</span>
          <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-1 ${
            marca.aprobada ? "bg-green/10 text-green" : "bg-amber-100 text-amber-700"}`}>
            {marca.aprobada ? "Aprobada" : "En revisión"}
          </span>
        </div>

        {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-lg px-3 py-2">{error}</p>}
        {aviso && <p className="text-[12.5px] text-green bg-green/10 rounded-lg px-3 py-2">{aviso}</p>}

        <button onClick={guardar} disabled={pendiente || nombre.trim().length < 2}
          className="bg-accent text-white rounded-xl px-5 py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-50">
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </button>
      </section>
    </MarcaShell>
  );
}

const input = "w-full mt-1.5 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";
