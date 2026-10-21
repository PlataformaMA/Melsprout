"use client";

import { useState, useTransition } from "react";
import { registrarEmpresa } from "@/lib/marca-cuenta";
import { AuthShell } from "@/components/AuthShell";

// Los datos de la marca, después de crear la cuenta.
export function AltaEmpresa({ categorias }: { categorias: string[] }) {
  const [nombre, setNombre] = useState("");
  const [sitio, setSitio] = useState("");
  const [categoria, setCategoria] = useState("");
  const [error, setError] = useState("");
  const [pendiente, startTransition] = useTransition();

  function enviar() {
    setError("");
    startTransition(async () => {
      const r = await registrarEmpresa({ nombre, sitio, categoria });
      if ("error" in r) { setError(r.error); return; }
      window.location.href = "/app/marca";
    });
  }

  return (
    <AuthShell
      titulo="Cuéntanos de tu marca"
      subtitulo="Con esto el equipo de Melsprout revisa tu cuenta. Es rápido."
    >
      <div className="space-y-3.5">
        <label className="block">
          <span className="text-[13px] font-bold">Nombre de la empresa</span>
          <input autoFocus value={nombre} onChange={(e) => { setNombre(e.target.value); setError(""); }}
            placeholder="Ej. Bloom Beauty" className={input} />
        </label>

        <label className="block">
          <span className="text-[13px] font-bold">Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={input}>
            <option value="">Selecciona una</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-[13px] font-bold">
            Sitio web <span className="text-hint font-semibold">(opcional)</span>
          </span>
          <input value={sitio} onChange={(e) => { setSitio(e.target.value); setError(""); }}
            type="url" placeholder="https://tumarca.com" className={input} />
        </label>

        {error && <p className="text-[12.5px] text-pink bg-pink-soft rounded-lg px-3 py-2">{error}</p>}

        <button onClick={enviar} disabled={pendiente || nombre.trim().length < 2}
          className="w-full bg-accent text-white rounded-full py-3.5 text-[15px] font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-50">
          {pendiente ? "Guardando…" : "Entrar a mi portal"}
        </button>

        <p className="text-[11.5px] text-hint text-center leading-snug">
          Vas a poder preparar tus campañas enseguida. Para publicarlas, el equipo
          revisa primero tu cuenta.
        </p>
      </div>
    </AuthShell>
  );
}

const input = "w-full mt-1.5 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";
