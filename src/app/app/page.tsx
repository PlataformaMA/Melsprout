import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/lib/auth-actions";
import { estadoMFA } from "@/lib/mfa-actions";

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Doble candado: además del proxy, verificamos aquí en el servidor.
  if (!user) redirect("/login");

  const mfa = await estadoMFA();

  const nombre =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "creador";
  const emailConfirmado = !!user.email_confirmed_at;

  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-display font-extrabold text-white text-sm">
              M
            </div>
            <span className="font-display font-extrabold">
              Mel<span className="text-accent">sprout</span>
            </span>
          </div>
          <form action={cerrarSesion}>
            <button className="text-[13px] font-medium text-sub hover:text-text transition">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-green bg-green-soft rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green" /> Sesión segura activa
          </div>

          <h1 className="font-display text-3xl font-extrabold mt-4">
            ¡Hola, {nombre}! 👋
          </h1>
          <p className="text-sub mt-2">
            Tu login funciona de punta a punta con seguridad de Supabase. Aquí
            construiremos el onboarding y tu ruta de aprendizaje.
          </p>

          <div className="mt-6 grid gap-3 text-sm">
            <Dato etiqueta="Correo" valor={user.email ?? "—"} />
            <Dato
              etiqueta="Estado del correo"
              valor={
                emailConfirmado ? "✅ Confirmado" : "⏳ Pendiente de confirmar"
              }
            />
            <Dato
              etiqueta="Método de acceso"
              valor={
                user.app_metadata?.provider === "email"
                  ? "Email y contraseña"
                  : `Login social (${user.app_metadata?.provider})`
              }
            />
          </div>

          {!emailConfirmado && (
            <p className="mt-6 text-[13px] text-amber bg-amber-soft rounded-lg px-3 py-2.5">
              Aún no confirmas tu correo. Revisa tu bandeja para desbloquear el
              diploma y el ranking.
            </p>
          )}
        </div>

        {/* Aviso de seguridad: activar 2FA */}
        <Link
          href="/app/seguridad"
          className="mt-4 flex items-center gap-3 bg-surface border border-border rounded-2xl p-5 hover:border-accent/40 transition group"
        >
          <div
            className={`w-10 h-10 rounded-xl grid place-items-center text-lg shrink-0 ${
              mfa.activo ? "bg-green-soft" : "bg-amber-soft"
            }`}
          >
            {mfa.activo ? "🔐" : "🛡️"}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-text">
              Verificación en dos pasos
            </div>
            <div className="text-[13px] text-sub">
              {mfa.activo
                ? "Activada · tu cuenta tiene protección extra."
                : "Recomendado · añade una capa extra de seguridad a tu cuenta."}
            </div>
          </div>
          <span className="text-sub group-hover:text-accent transition text-sm">
            {mfa.activo ? "Administrar →" : "Activar →"}
          </span>
        </Link>

        <p className="text-center text-xs text-hint mt-8">
          Próximo paso: onboarding de 3 pasos y la ruta de aprendizaje (Etapa 1).
        </p>
      </div>
    </main>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between bg-bg rounded-lg px-4 py-2.5">
      <span className="text-sub">{etiqueta}</span>
      <span className="font-medium text-text">{valor}</span>
    </div>
  );
}
