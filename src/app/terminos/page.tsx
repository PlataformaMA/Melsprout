import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio · Melsprout",
  description: "Términos y condiciones de uso de Melsprout.",
};

const CONTACTO = "sveidy@fixcraft.com.mx";
const ACTUALIZADO = "8 de julio de 2026";

export default function TerminosPage() {
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
        <h1 className="font-display text-3xl font-extrabold">Términos de Servicio</h1>
        <p className="text-sub text-sm mt-2">Última actualización: {ACTUALIZADO}</p>

        <p className="mt-6 text-[15px] text-sub leading-relaxed">
          Bienvenido a Melsprout (operado por Boost Academy). Al crear una cuenta y
          usar la plataforma, aceptas estos términos. Léelos con calma.
        </p>

        <S titulo="1. Qué es Melsprout">
          Melsprout es una plataforma educativa que ayuda a las personas a aprender a
          crear contenido, practicar con retos, certificarse y hacer crecer su marca
          personal.
        </S>

        <S titulo="2. Tu cuenta">
          Eres responsable de mantener segura tu cuenta y tu contraseña. Debes tener al
          menos 16 años para usar Melsprout. La información que nos das debe ser veraz.
        </S>

        <S titulo="3. Uso correcto">
          Te comprometes a no usar la plataforma para spam, contenido ofensivo o
          ilegal, ni a intentar dañar o vulnerar el servicio. Podemos suspender cuentas
          que incumplan estas reglas.
        </S>

        <S titulo="4. Conexión de redes sociales">
          Puedes conectar de forma opcional tus cuentas de Instagram, TikTok o YouTube
          para mostrar tus métricas públicas (como tu número de seguidores) en tu
          perfil. Solo leemos información pública que tú autorizas; nunca publicamos ni
          modificamos nada en tus redes. Puedes desconectarlas cuando quieras.
        </S>

        <S titulo="5. Tu contenido">
          Lo que publicas en la comunidad es tuyo. Al publicarlo, nos das permiso para
          mostrarlo dentro de la plataforma como parte del servicio.
        </S>

        <S titulo="6. Privacidad">
          El manejo de tus datos se explica en nuestra{" "}
          <Link href="/privacidad" className="text-accent font-medium">
            Política de Privacidad
          </Link>
          .
        </S>

        <S titulo="7. Cambios">
          Podemos actualizar estos términos. Si hay cambios importantes, te avisaremos.
          Seguir usando la plataforma significa que los aceptas.
        </S>

        <S titulo="8. Contacto">
          Dudas sobre estos términos:{" "}
          <a href={`mailto:${CONTACTO}`} className="text-accent font-medium">
            {CONTACTO}
          </a>
          .
        </S>

        <div className="mt-10 pt-6 border-t border-border">
          <Link href="/" className="text-sm text-accent font-medium">
            ← Volver a Melsprout
          </Link>
        </div>
      </article>
    </main>
  );
}

function S({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-extrabold text-text">{titulo}</h2>
      <p className="mt-2 text-[15px] text-sub leading-relaxed">{children}</p>
    </section>
  );
}
