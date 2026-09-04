"use client";

import { useRef, useState } from "react";
import { altaUsuario, type NuevoUsuario } from "@/lib/admin-actions";
import { RecortarFoto } from "@/components/RecortarFoto";

const ROLES: { id: NuevoUsuario["rol"]; nombre: string; nota: string }[] = [
  { id: "alumna", nombre: "Estudiante", nota: "Acceso normal a las clases y la comunidad." },
  { id: "instructor", nombre: "Instructor", nota: "Aparece como instructor de las clases." },
  { id: "admin", nombre: "Administrador", nota: "Entra al panel y revisa retos." },
];

// Alta de una persona desde el panel, igual al diseño.
export function CrearUsuarioModal({ onCerrar, onCreado }: { onCerrar: () => void; onCreado: () => void }) {
  const [rol, setRol] = useState<NuevoUsuario["rol"] | "">("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [porRecortar, setPorRecortar] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const inputC = "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-accent";
  const listo = !!rol && nombre.trim().length > 2 && email.includes("@");

  async function crear() {
    if (!listo) return;
    setGuardando(true);
    setError("");
    let r: Awaited<ReturnType<typeof altaUsuario>>;
    try {
      r = await altaUsuario({
        nombre, email, rol: rol as NuevoUsuario["rol"],
        telefono: telefono || undefined,
        avatarDataUrl: foto || undefined,
      });
    } catch {
      setGuardando(false);
      setError("No pudimos hablar con el servidor. Revisa tu conexión e inténtalo otra vez.");
      return;
    }
    setGuardando(false);
    if ("error" in r) { setError(r.error); return; }
    onCreado();
    if (r.aviso) alert(r.aviso);
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-[560px] shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-extrabold text-lg">Crear usuario</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-sub hover:text-text text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-[12.5px] font-bold text-sub">Rol *</label>
            <select value={rol} onChange={(e) => setRol(e.target.value as NuevoUsuario["rol"])} className={`${inputC} mt-1.5`}>
              <option value="">Selecciona un rol</option>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
            {rol && <p className="text-[11.5px] text-hint mt-1.5">{ROLES.find((r) => r.id === rol)?.nota}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-bg border border-border grid place-items-center">
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                ) : <span className="text-hint text-3xl">👤</span>}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-[12.5px] font-bold text-accent bg-accent-soft rounded-full px-3.5 py-1.5 hover:brightness-95 transition">
                Subir fotografía
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (fileRef.current) fileRef.current.value = "";
                  if (f) setPorRecortar(f);
                }} />
            </div>

            <div className="flex-1 min-w-0 space-y-3.5">
              <div>
                <label className="text-[12.5px] font-bold text-sub">Nombre completo *</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${inputC} mt-1.5`} placeholder="Nombre y apellido" />
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-sub">Correo electrónico *</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={`${inputC} mt-1.5`} placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-sub">Teléfono (opcional)</label>
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={`${inputC} mt-1.5`} placeholder="+52 …" />
              </div>
            </div>
          </div>

          <p className="text-[12px] text-hint leading-snug bg-bg rounded-xl px-3.5 py-2.5">
            Le llega un correo para que ponga su propia contraseña. No tienes que inventarle una.
          </p>

          {error && <p className="text-[13px] text-pink">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onCerrar} className="rounded-xl border border-border px-5 py-2.5 text-[14px] font-bold text-sub hover:bg-bg transition">
            Cancelar
          </button>
          <button onClick={crear} disabled={!listo || guardando}
            className="rounded-xl bg-accent text-white px-5 py-2.5 text-[14px] font-bold hover:brightness-110 transition disabled:opacity-50">
            {guardando ? "Creando…" : "Crear usuario"}
          </button>
        </div>
      </div>

      {porRecortar && (
        <RecortarFoto
          file={porRecortar}
          onCancelar={() => setPorRecortar(null)}
          onListo={(url) => { setFoto(url); setPorRecortar(null); }}
        />
      )}
    </div>
  );
}
