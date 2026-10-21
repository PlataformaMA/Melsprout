import { redirect } from "next/navigation";
import Link from "next/link";
import { miMarca } from "@/lib/marca-cuenta";
import { MarcaShell } from "@/components/MarcaShell";

// Mensajes con el equipo. Por ahora el canal real es el WhatsApp de soporte,
// que ya existe y donde el equipo responde: más vale mandarla ahí que fingir
// una bandeja que nadie lee.
const SOPORTE = "https://boostacademy-n8n.n6e5xe.easypanel.host/webhook/fbc26af3-56ad-4a3f-9422-cfbf586f9ec3";

export default async function MensajesDeMarcaPage() {
  const marca = await miMarca();
  if (!marca) redirect("/app/ruta");

  return (
    <MarcaShell marca={marca} activo="mensajes">
      <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Mensajes</h1>
      <p className="text-sub text-[13.5px] mt-1">Habla con el equipo de Melsprout.</p>

      <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-sm mt-5">
        <div className="w-16 h-16 rounded-2xl bg-accent-soft grid place-items-center text-3xl mx-auto">💬</div>
        <h2 className="font-display font-extrabold text-[17px] mt-4">El equipo te atiende por WhatsApp</h2>
        <p className="text-sub text-[13.5px] mt-1.5 max-w-md mx-auto leading-snug">
          Para dudas sobre tus campañas, las creadoras que solicitaste o tu cuenta,
          escríbenos y te contestamos ahí mismo.
        </p>
        <a href={SOPORTE} target="_blank" rel="noreferrer"
          className="inline-block mt-5 bg-accent text-white rounded-full px-6 py-3 text-[14px] font-bold hover:brightness-110 transition">
          Escribirle al equipo
        </a>
      </div>
    </MarcaShell>
  );
}
