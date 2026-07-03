import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad · Melsprout",
  description:
    "Cómo Melsprout recopila, usa y protege tus datos personales.",
};

const CONTACTO = "sveidy@fixcraft.com.mx";
const ACTUALIZADO = "3 de julio de 2026";

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p className="text-sub text-sm mt-2">
          Última actualización: {ACTUALIZADO}
        </p>

        <p className="mt-6 text-[15px] text-sub leading-relaxed">
          En Melsprout (operado por Boost Academy) respetamos tu privacidad.
          Esta política explica qué datos recopilamos, para qué los usamos y qué
          derechos tienes sobre ellos.
        </p>

        <Seccion titulo="1. Qué datos recopilamos">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <b>Datos de cuenta:</b> tu nombre y correo electrónico. Tu
              contraseña se guarda cifrada; nunca la vemos.
            </li>
            <li>
              <b>Datos de perfil:</b> los que nos das al registrarte o completar
              tu perfil (país, nicho de interés, objetivos, redes sociales que
              decidas conectar).
            </li>
            <li>
              <b>Datos de uso:</b> tu progreso en las clases, retos, puntos,
              racha y actividad dentro de la plataforma.
            </li>
            <li>
              <b>Datos técnicos:</b> país y zona horaria (para tu racha),
              y de qué canal llegaste, para mejorar el servicio.
            </li>
            <li>
              <b>Inicio de sesión social:</b> si entras con Google o Facebook,
              recibimos tu nombre, correo y foto de perfil de ese proveedor. No
              accedemos a tus contraseñas ni publicamos en tu nombre.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="2. Para qué usamos tus datos">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Darte acceso a la plataforma y personalizar tu experiencia.</li>
            <li>Registrar tu avance y emitir tus certificados.</li>
            <li>Enviarte notificaciones y recordatorios (puedes desactivarlos).</li>
            <li>Mejorar el producto y entender cómo se usa.</li>
          </ul>
        </Seccion>

        <Seccion titulo="3. Con quién compartimos datos">
          <p>
            No vendemos tus datos. Los procesamos con proveedores de confianza
            que nos ayudan a operar:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><b>Supabase</b> — base de datos y autenticación.</li>
            <li><b>Vercel</b> — alojamiento de la aplicación.</li>
            <li><b>Google / Meta (Facebook)</b> — solo si eliges iniciar sesión con ellos.</li>
          </ul>
        </Seccion>

        <Seccion titulo="4. Cómo protegemos tus datos">
          <p>
            Ciframos las contraseñas, usamos conexiones seguras (HTTPS),
            verificación en dos pasos opcional, y controles de acceso a nivel de
            base de datos para que cada usuario solo vea su propia información.
          </p>
        </Seccion>

        <Seccion titulo="5. Tus derechos">
          <p>
            Puedes acceder, corregir o eliminar tus datos en cualquier momento.
            Para eliminar tu cuenta y todos tus datos, consulta{" "}
            <Link href="/eliminar-datos" className="text-accent font-medium">
              Eliminación de datos
            </Link>
            .
          </p>
        </Seccion>

        <Seccion titulo="6. Menores de edad">
          <p>
            Melsprout está dirigido a personas de 16 años en adelante. No
            recopilamos datos de menores de esa edad a sabiendas.
          </p>
        </Seccion>

        <Seccion titulo="7. Contacto">
          <p>
            Si tienes dudas sobre esta política o tus datos, escríbenos a{" "}
            <a href={`mailto:${CONTACTO}`} className="text-accent font-medium">
              {CONTACTO}
            </a>
            .
          </p>
        </Seccion>

        <div className="mt-10 pt-6 border-t border-border">
          <Link href="/" className="text-sm text-accent font-medium">
            ← Volver a Melsprout
          </Link>
        </div>
      </article>
    </main>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-extrabold text-text">{titulo}</h2>
      <div className="mt-2 text-[15px] text-sub leading-relaxed">{children}</div>
    </section>
  );
}
