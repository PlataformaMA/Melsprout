"use client";

import { useState } from "react";
import Link from "next/link";
import { cerrarSesion } from "@/lib/auth-actions";

export function UserMenu({ avatarUrl, nombre, esAdmin = false }: { avatarUrl: string | null; nombre: string; esAdmin?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setAbierto((v) => !v)} aria-label="Menú de cuenta"
        className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-accent/25 grid place-items-center bg-accent/10 shrink-0 hover:ring-accent/50 transition">
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatarUrl} alt="Tú" className="w-full h-full object-cover" />
          : <span className="text-white text-xs font-bold bg-accent w-full h-full grid place-items-center">{nombre.slice(0, 2).toUpperCase()}</span>}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 w-56 bg-surface border border-border rounded-2xl shadow-lg p-1.5">
            <div className="px-3 py-2 border-b border-border mb-1">
              <div className="text-[12px] text-hint">Conectado como</div>
              <div className="font-bold text-sm truncate">{nombre || "Creador"}</div>
            </div>
            {/* Secciones (solo móvil — en escritorio están en el menú lateral) */}
            <div className="lg:hidden">
              <div className="text-[11px] text-hint font-semibold px-3 pt-1 pb-0.5 uppercase">Secciones</div>
              <Item href="/app/ruta" icon={<span>🗺️</span>}>Ruta de aprendizaje</Item>
              <Item href="/app/vivo" icon={<span>📡</span>}>Clases en vivo</Item>
              <Item href="/app/comunidad" icon={<span>👥</span>}>Comunidad</Item>
              <div className="h-px bg-border my-1" />
            </div>
            <Item href="/app/perfil" icon={<UserIcon />}>Mi perfil</Item>
            <Item href="/app/config" icon={<GearIcon />}>Configuración</Item>
            <Item href="/app/config" icon={<ShieldIcon />}>Seguridad y 2FA</Item>
            {esAdmin && (
              <>
                <div className="h-px bg-border my-1" />
                <Item href="/app/admin" icon={<span className="text-[15px]">⚙️</span>}>Panel admin</Item>
              </>
            )}
            <div className="h-px bg-border my-1" />
            <form action={cerrarSesion}>
              <button className="w-full flex items-center gap-2.5 text-left text-sm rounded-xl px-3 py-2.5 text-pink hover:bg-pink-soft transition font-semibold">
                <LogoutIcon /> Cerrar sesión
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function Item({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-sm rounded-xl px-3 py-2.5 text-text hover:bg-bg transition">
      <span className="text-sub">{icon}</span>{children}
    </Link>
  );
}

function UserIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>; }
function GearIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.62.78 1.05 1.43 1.05H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function ShieldIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>; }
function LogoutIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>; }
