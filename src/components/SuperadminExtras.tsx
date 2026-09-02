"use client";

import { useEffect, useState } from "react";
import { enviarAviso, generarReporte, getDesbloqueo, setDesbloqueo, type Reporte } from "@/lib/superadmin-extra";

// ————— Mensajes: aviso a la comunidad —————
export function MensajesTab() {
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [destino, setDestino] = useState<"todos" | "activos" | "riesgo">("todos");
  const [estado, setEstado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputC = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";

  async function enviar() {
    if (!confirm("¿Mandar este aviso? Le llega a cada persona del grupo elegido.")) return;
    setEnviando(true); setEstado("");
    const r = await enviarAviso(titulo, cuerpo, destino);
    setEnviando(false);
    if ("error" in r) { setEstado(r.error); return; }
    setTitulo(""); setCuerpo("");
    setEstado(`Enviado a ${r.enviados} ${r.enviados === 1 ? "persona" : "personas"} ✓`);
  }

  return (
    <div className="bg-surface border border-border rounded-3xl p-5 shadow-sm max-w-xl space-y-4">
      <div>
        <h2 className="font-display font-extrabold text-[17px]">Aviso para la comunidad</h2>
        <p className="text-[12.5px] text-sub mt-0.5">Les llega a su campana de notificaciones dentro de la plataforma.</p>
      </div>

      <div>
        <label className="text-[12.5px] font-bold text-sub">¿A quién?</label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {([["todos", "Todas"], ["activos", "Activas esta semana"], ["riesgo", "Sin entrar hace 7+ días"]] as const).map(([id, txt]) => (
            <button key={id} onClick={() => setDestino(id)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
                destino === id ? "bg-accent text-white" : "bg-bg border border-border text-sub"
              }`}>{txt}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[12.5px] font-bold text-sub">Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} className={`${inputC} mt-1.5`} placeholder="Nueva clase disponible 🎉" />
      </div>
      <div>
        <label className="text-[12.5px] font-bold text-sub">Mensaje</label>
        <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={4} maxLength={300} className={`${inputC} mt-1.5 resize-none`} placeholder="Cuéntales de qué se trata…" />
      </div>

      {estado && <p className="text-[13px] font-semibold text-sub">{estado}</p>}

      <button onClick={enviar} disabled={enviando || titulo.trim().length < 3 || cuerpo.trim().length < 5}
        className="bg-accent text-white rounded-xl px-5 py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-50">
        {enviando ? "Enviando…" : "Enviar aviso"}
      </button>
    </div>
  );
}

// ————— Reportes: descargar en CSV —————
export function ReportesTab() {
  const [bajando, setBajando] = useState<Reporte | null>(null);
  const reportes: { id: Reporte; titulo: string; nota: string }[] = [
    { id: "estudiantes", titulo: "Estudiantes", nota: "Nombre, país, XP, racha, alta y última actividad." },
    { id: "progreso", titulo: "Progreso por clase", nota: "Quién vio qué clase y si la terminó." },
    { id: "retos", titulo: "Retos entregados", nota: "Cada entrega con su estado y su revisión." },
  ];

  async function bajar(id: Reporte) {
    setBajando(id);
    const r = await generarReporte(id);
    setBajando(null);
    if ("error" in r) { alert(r.error); return; }
    const blob = new Blob(["﻿" + r.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = r.nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {reportes.map((r) => (
        <section key={r.id} className="bg-surface border border-border rounded-3xl p-5 shadow-sm flex flex-col">
          <h2 className="font-display font-extrabold text-[15px]">{r.titulo}</h2>
          <p className="text-[12.5px] text-sub mt-1 leading-snug flex-1">{r.nota}</p>
          <button onClick={() => bajar(r.id)} disabled={bajando === r.id}
            className="mt-4 bg-accent text-white rounded-xl py-2.5 text-[13.5px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {bajando === r.id ? "Preparando…" : "Descargar CSV"}
          </button>
        </section>
      ))}
    </div>
  );
}

// ————— Configuración —————
export function ConfigTab() {
  const [abierto, setAbierto] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { getDesbloqueo().then(setAbierto); }, []);

  async function cambiar(v: boolean) {
    setGuardando(true);
    const r = await setDesbloqueo(v);
    setGuardando(false);
    if ("error" in r) { alert(r.error); return; }
    setAbierto(v);
  }

  return (
    <div className="bg-surface border border-border rounded-3xl p-5 shadow-sm max-w-xl">
      <h2 className="font-display font-extrabold text-[17px]">Acceso a las clases</h2>
      <p className="text-[12.5px] text-sub mt-1 leading-relaxed">
        Mientras se termina de grabar el curso, todas las clases están abiertas. Cuando esté
        completo, vuelve a cerrarlas para que se desbloqueen conforme avanzan y completan sus retos.
      </p>

      {abierto === null ? (
        <p className="text-[13px] text-hint mt-4">Cargando…</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <button onClick={() => cambiar(true)} disabled={guardando}
            className={`flex-1 rounded-2xl px-4 py-3 text-[13.5px] font-bold border transition ${
              abierto ? "bg-accent-soft border-accent text-accent" : "bg-bg border-border text-sub"
            }`}>
            Todas abiertas
            <span className="block text-[11.5px] font-normal mt-0.5">Cualquiera entra a cualquier clase</span>
          </button>
          <button onClick={() => cambiar(false)} disabled={guardando}
            className={`flex-1 rounded-2xl px-4 py-3 text-[13.5px] font-bold border transition ${
              !abierto ? "bg-accent-soft border-accent text-accent" : "bg-bg border-border text-sub"
            }`}>
            Se desbloquean por avance
            <span className="block text-[11.5px] font-normal mt-0.5">Como estaba antes: una tras otra</span>
          </button>
        </div>
      )}
    </div>
  );
}
