import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

// Pantalla de error cuando el enlace de verificación es inválido o expiró.
export default function EnlaceExpiradoPage() {
  return (
    <AuthShell titulo="" subtitulo="">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-pink-soft grid place-items-center mb-5">
          <span className="w-16 h-16 rounded-full bg-pink grid place-items-center text-white text-3xl">✕</span>
        </div>

        <h2 className="font-display text-2xl font-extrabold text-text">Enlace no válido o expirado</h2>
        <p className="text-sub text-sm mt-3">El enlace de verificación no es válido o ha expirado.</p>
        <p className="text-sub text-sm mt-2">Solicita un nuevo enlace para continuar.</p>

        <Link href="/login"
          className="mt-7 w-full rounded-xl bg-accent text-white font-bold py-3 text-sm hover:brightness-110 transition">
          Solicitar nuevo enlace
        </Link>
        <Link href="/login" className="mt-4 text-accent font-semibold text-[13px] hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    </AuthShell>
  );
}
