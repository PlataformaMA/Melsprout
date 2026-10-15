"use client";

import { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { ProSeccionModal } from "@/components/ProSeccionModal";
import type { MiCampania } from "@/lib/marketplace";

// A qué campañas aplicó y cómo va cada una.
const ESTADOS = {
  enviada: { texto: "En revisión", clase: "bg-amber-100 text-amber-700" },
  aceptada: { texto: "Aceptada", clase: "bg-green/10 text-green" },
  rechazada: { texto: "No seleccionada", clase: "bg-bg text-hint border border-border" },
} as const;

export function MisCampaniasVista({
  nombre, avatarUrl, xp, racha, lista, bloqueado = false,
}: {
  nombre: string; avatarUrl: string | null; xp: number; racha: number;
  lista: MiCampania[]; bloqueado?: boolean;
}) {
  const [proAbierto, setProAbierto] = useState(bloqueado);

  return (
    <div className="min-h-screen bg-bg flex">
      {proAbierto && <ProSeccionModal onClose={() => setProAbierto(false)} />}
      <AppSidebar active="campanias" />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-3 sm:gap-4 mb-4 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {xp}</span>
            <CampanaNotificaciones />
            <UserMenu avatarUrl={avatarUrl} nombre={nombre} />
          </header>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Campañas</h1>
          <p className="text-sub text-[14px] mt-1">Las colaboraciones a las que aplicaste.</p>

          <div className="mt-6">
            {bloqueado ? (
              <Vacio
                titulo="Las campañas son parte de Boost Pro"
                texto="Con el plan puedes aplicar a las colaboraciones de las marcas."
              />
            ) : lista.length === 0 ? (
              <Vacio
                titulo="Todavía no aplicaste a ninguna"
                texto="En el Marketplace están las campañas abiertas. Aplica a la que te quede y aquí vas a ver cómo va."
                accion
              />
            ) : (
              <div className="space-y-3">
                {lista.map((c) => (
                  <article key={c.id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    {c.imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imagenUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <span className="w-16 h-16 rounded-xl bg-accent-soft shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] text-sub truncate">{c.marca}</div>
                      <h3 className="font-display font-extrabold text-[15px] leading-tight truncate">{c.titulo}</h3>
                      <div className="text-[12.5px] font-bold text-green mt-0.5">{rango(c)}</div>
                      {c.notaEquipo && (
                        <p className="text-[12px] text-sub leading-snug mt-1">{c.notaEquipo}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[12px] font-bold rounded-full px-3 py-1.5 ${ESTADOS[c.estado].clase}`}>
                      {ESTADOS[c.estado].texto}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Vacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: boolean }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/octi.png" alt="" className="octi-vivo w-20 mx-auto" draggable={false} />
      <h3 className="font-display font-extrabold text-[16px] mt-3">{titulo}</h3>
      <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">{texto}</p>
      {accion && (
        <Link href="/app/marketplace"
          className="inline-block mt-4 bg-accent text-white rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
          Ver el Marketplace
        </Link>
      )}
    </div>
  );
}

function rango(c: { pagoMin: number | null; pagoMax: number | null }): string {
  const s = (n: number) => `$${n.toLocaleString("en-US")}`;
  if (c.pagoMin && c.pagoMax) return `${s(c.pagoMin)} – ${s(c.pagoMax)}`;
  if (c.pagoMax) return `Hasta ${s(c.pagoMax)}`;
  if (c.pagoMin) return `Desde ${s(c.pagoMin)}`;
  return "A convenir";
}
