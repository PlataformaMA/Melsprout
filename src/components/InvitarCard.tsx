"use client";

import { useState } from "react";
import { ProSeccionModal } from "@/components/ProSeccionModal";

// Tarjeta "Invita a un amigo" — la usan el perfil y la pantalla de Amigos.
export function InvitarCard({ userId, bloqueado = false }: {
  userId: string;
  // Invitar es parte de Boost Pro (ver lib/pro.ts).
  bloqueado?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const [proAbierto, setProAbierto] = useState(false);

  function invitar() {
    if (bloqueado) { setProAbierto(true); return; }
    const link = `${window.location.origin}/registro?ref=${userId}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <section className="rounded-3xl p-5 shadow-sm border border-accent/10" style={{ background: "linear-gradient(160deg,#F3F0FF,#FBFAFF)" }}>
      <h3 className="font-display font-extrabold text-accent text-lg mb-1">Trae a alguien de fuera</h3>
      <p className="text-[13px] text-sub leading-relaxed">
        Esto es para quien <b>todavía no está en Melsprout</b>: le compartes tu
        enlace y ganas <b className="text-accent">+100 XP</b> cuando se registre 💜
      </p>
      <p className="text-[11.5px] text-hint leading-snug mt-1.5">
        ¿Buscas a alguien que ya está dentro? Usa la lupa de arriba para
        encontrarla y seguirla.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/octi.png" alt="" className="octi-vivo w-24 mx-auto my-3 select-none" draggable={false} />
      <button onClick={invitar}
        className="w-full bg-accent text-white rounded-full py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
        {copiado ? "¡Link copiado! ✓" : "Copiar mi enlace de invitación"}
      </button>
      {copiado && <p className="text-[11px] text-sub text-center mt-2">Pégalo donde quieras. Ganas +100 XP cuando se registren.</p>}
      {proAbierto && <ProSeccionModal onClose={() => setProAbierto(false)} />}
    </section>
  );
}
