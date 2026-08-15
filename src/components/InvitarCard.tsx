"use client";

import { useState } from "react";

// Tarjeta "Invita a un amigo" — la usan el perfil y la pantalla de Amigos.
export function InvitarCard({ userId }: { userId: string }) {
  const [copiado, setCopiado] = useState(false);

  function invitar() {
    const link = `${window.location.origin}/registro?ref=${userId}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <section className="rounded-3xl p-5 shadow-sm border border-accent/10" style={{ background: "linear-gradient(160deg,#F3F0FF,#FBFAFF)" }}>
      <h3 className="font-display font-extrabold text-accent text-lg mb-1">¡Invita a un amigo!</h3>
      <p className="text-[13px] text-sub leading-relaxed">
        Comparte Melsprout y gana <b className="text-accent">+100 XP</b> por cada amigo que se registre 💜
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/octi.png" alt="" className="w-24 mx-auto my-3 select-none" draggable={false} />
      <button onClick={invitar}
        className="w-full bg-accent text-white rounded-full py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
        {copiado ? "¡Link copiado! ✓" : "Invitar ahora →"}
      </button>
      {copiado && <p className="text-[11px] text-sub text-center mt-2">Compártelo. Ganas +100 XP cuando se registren.</p>}
    </section>
  );
}
