import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sin conexión · Melsprout" };

// Lo que se ve cuando se va el internet con la app instalada. Sin esto, el
// celular muestra la pantalla de error del navegador (el dinosaurio), que no
// se parece en nada a Melsprout y asusta más de lo que informa.
export default function SinConexion() {
  return (
    <main className="min-h-screen bg-bg grid place-items-center px-6 py-10 text-center">
      <div className="max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/octi-correo.png" alt="" width={120} className="mx-auto mb-5" />
        <h1 className="font-display text-2xl font-extrabold">Te quedaste sin internet</h1>
        <p className="text-sub text-[15px] mt-2.5 leading-relaxed">
          Melsprout necesita conexión para cargar tus clases. En cuanto vuelva la señal,
          sigues justo donde te quedaste.
        </p>
        <a
          href="/app"
          className="inline-block mt-6 bg-accent text-white font-bold text-[14px] rounded-full px-6 py-3 hover:brightness-110 transition"
        >
          Intentar de nuevo
        </a>
      </div>
    </main>
  );
}
