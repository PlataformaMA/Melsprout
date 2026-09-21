import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { BotonActivar } from "@/components/BotonActivar";

// Pantalla intermedia del correo de compra. El enlace trae un token nuestro (k)
// que no caduca; al tocar el botón se genera el de Supabase y se pasa a crear
// la contraseña. (th = formato anterior, con el token de Supabase directo.)
export default async function ActivarPage({
  searchParams,
}: {
  searchParams: Promise<{ th?: string; k?: string; e?: string; c?: string; r?: string }>;
}) {
  const { th, k, e, c, r } = await searchParams;
  const recuperacion = r === "1";
  const correo = e ?? "";
  const continuar = th
    ? `/auth/callback?token_hash=${encodeURIComponent(th)}&type=recovery&next=/restablecer`
    : null;
  const pedirNuevo = `/recuperar${correo ? `?e=${encodeURIComponent(correo)}` : ""}`;

  return (
    <AuthShell
      titulo={recuperacion ? "Restablece tu contraseña 🔑" : c ? `Ya tienes ${c} 🚀` : "Tu cuenta está lista 💜"}
      subtitulo={recuperacion ? "Toca el botón y elige tu nueva contraseña." : "Crea tu contraseña para entrar a Melsprout."}
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
        {k ? (
          <BotonActivar k={k} pedirNuevo={pedirNuevo} texto={recuperacion ? "Crear nueva contraseña" : "Crear mi contraseña"} />
        ) : continuar ? (
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
