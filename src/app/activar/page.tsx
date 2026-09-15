import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

// Pantalla intermedia del correo de compra. El enlace del correo llega aquí y
// NO gasta el token hasta que la persona toca el botón: así los escáneres de
// correo (Gmail, Outlook) que abren los enlaces por adelantado no lo invalidan.
export default async function ActivarPage({
  searchParams,
}: {
  searchParams: Promise<{ th?: string; e?: string; c?: string }>;
}) {
  const { th, e, c } = await searchParams;
  const correo = e ?? "";
  const continuar = th
    ? `/auth/callback?token_hash=${encodeURIComponent(th)}&type=recovery&next=/restablecer`
    : null;
  const pedirNuevo = `/recuperar${correo ? `?e=${encodeURIComponent(correo)}` : ""}`;

  return (
    <AuthShell
      titulo={c ? `Ya tienes ${c} 🚀` : "Tu cuenta está lista 💜"}
      subtitulo="Crea tu contraseña para entrar a Melsprout."
      pie={
        <p className="text-center text-[13px] text-sub">
          ¿Ya tienes contraseña? <Link href="/login" className="text-accent font-semibold">Inicia sesión</Link>
        </p>
      }
    >
      <div className="space-y-4">
        {correo && (
          <p className="text-sub text-sm text-center">Cuenta: <b className="text-text">{correo}</b></p>
        )}
        {continuar ? (
          <a href={continuar}
            className="block w-full text-center rounded-xl bg-accent text-white font-bold py-3 text-sm hover:brightness-110 transition">
            Crear mi contraseña
          </a>
        ) : (
          <Link href={pedirNuevo}
            className="block w-full text-center rounded-xl bg-accent text-white font-bold py-3 text-sm hover:brightness-110 transition">
            Pedir enlace para crear contraseña
          </Link>
        )}
        <p className="text-hint text-[12.5px] text-center leading-snug">
          Si te dice que el enlace expiró,{" "}
          <Link href={pedirNuevo} className="text-accent font-semibold">pide uno nuevo aquí</Link>{" "}
          y te llega al correo en segundos.
        </p>
      </div>
    </AuthShell>
  );
}
