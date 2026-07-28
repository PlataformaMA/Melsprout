import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

// Pantalla de éxito tras confirmar el correo (a donde manda /auth/callback).
export default function VerificadoPage() {
  return (
    <AuthShell titulo="" subtitulo="">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-green/15 grid place-items-center mb-5">
          <span className="w-16 h-16 rounded-full bg-green grid place-items-center text-white text-3xl">✓</span>
        </div>

        <h2 className="font-display text-2xl font-extrabold text-text">¡Correo verificado!</h2>
        <p className="text-sub text-sm mt-3">Tu correo electrónico ha sido verificado correctamente.</p>
        <p className="text-sub text-sm mt-2">Ahora puedes continuar.</p>

        <Link href="/app"
          className="mt-7 w-full rounded-xl bg-accent text-white font-bold py-3 text-sm hover:brightness-110 transition">
          Continuar
        </Link>
        <Link href="/login" className="mt-4 text-accent font-semibold text-[13px] hover:underline">
          Ir al inicio de sesión
        </Link>
      </div>
    </AuthShell>
  );
}
