import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminación de datos · Melsprout",
  description:
    "Cómo solicitar la eliminación de tu cuenta y tus datos en Melsprout.",
};

const CONTACTO = "sveidy@fixcraft.com.mx";

export default function EliminarDatosPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-display font-extrabold text-white text-sm">
              M
            </div>
            <span className="font-display font-extrabold">
              Mel<span className="text-accent">sprout</span>
            </span>
          </Link>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-extrabold">
          Eliminación de tus datos
        </h1>
        <p className="mt-6 text-[15px] text-sub leading-relaxed">
          Tú eres dueño de tus datos. Puedes pedir que eliminemos tu cuenta y
          toda tu información personal de Melsprout en cualquier momento. Hay dos
          formas:
        </p>

        <section className="mt-8">
          <h2 className="font-display text-lg font-extrabold text-text">
            Opción 1 · Desde tu cuenta
          </h2>
          <p className="mt-2 text-[15px] text-sub leading-relaxed">
            Inicia sesión, entra a <b>Configuración → Eliminar mi cuenta</b>. Se
            borrarán tu perfil, tu progreso y todos tus datos personales de forma
            permanente.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg font-extrabold text-text">
            Opción 2 · Por correo
          </h2>
          <p className="mt-2 text-[15px] text-sub leading-relaxed">
            Escríbenos a{" "}
            <a href={`mailto:${CONTACTO}`} className="text-accent font-medium">
              {CONTACTO}
            </a>{" "}
            desde el correo con el que te registraste, con el asunto{" "}
            <b>&ldquo;Eliminar mis datos&rdquo;</b>. Procesaremos tu solicitud en
            un máximo de <b>30 días</b> y te confirmaremos cuando esté hecho.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg font-extrabold text-text">
            Qué se elimina
          </h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5 text-[15px] text-sub leading-relaxed">
            <li>Tu cuenta, nombre y correo.</li>
            <li>Tu perfil, progreso, puntos y actividad.</li>
            <li>La conexión con Google o Facebook, si la usaste.</li>
          </ul>
          <p className="mt-3 text-[13px] text-hint leading-relaxed">
            Nota: algunos registros mínimos pueden conservarse si la ley lo exige
            (por ejemplo, facturación), pero se disocian de tu identidad.
          </p>
        </section>

        <div className="mt-10 pt-6 border-t border-border">
          <Link href="/" className="text-sm text-accent font-medium">
            ← Volver a Melsprout
          </Link>
        </div>
      </article>
    </main>
  );
}
