import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getAmigos } from "@/lib/chat-actions";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { SolicitudesLista } from "@/components/SolicitudesLista";
import { getSolicitudes } from "@/lib/seguidores-actions";

export default async function AmigosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const [amigos, solicitudes] = await Promise.all([getAmigos(), getSolicitudes()]);

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="amigos" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display text-2xl font-extrabold">Amigos</h1>
              <p className="text-sub text-[14px] mt-0.5">
                Aquí aceptas solicitudes y felicitas a tus amigos. 💜
              </p>
            </div>
            <CampanaNotificaciones />
          </div>

          <SolicitudesLista inicial={solicitudes} />

          {amigos.length === 0 ? (
            <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/octi.png" alt="" className="w-24 mx-auto" />
              <h2 className="font-display font-extrabold text-lg mt-3">Todavía no tienes amigos aquí</h2>
              <p className="text-sub text-[13.5px] mt-1.5 max-w-sm mx-auto leading-snug">
                El chat se abre cuando alguien acepta tu solicitud (o tú la suya).
                Encuéntralas en la comunidad y dale a seguir.
              </p>
              <Link href="/app/comunidad"
                className="inline-block mt-4 bg-accent text-white rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:brightness-110 transition">
                Ir a la comunidad
              </Link>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-3xl shadow-sm divide-y divide-border overflow-hidden">
              {amigos.map((a) => (
                <Link key={a.id} href={`/app/amigos/${a.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-bg transition">
                  <div className="relative shrink-0">
                    {a.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatar} alt={a.nombre} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <span className="w-11 h-11 rounded-full bg-accent/15 text-accent grid place-items-center font-bold">
                        {a.nombre.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    {a.enLinea && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green border-2 border-surface" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14.5px] truncate">{a.nombre}</p>
                    <p className={`text-[12.5px] ${a.enLinea ? "text-green" : "text-hint"}`}>
                      {a.enLinea ? "En línea" : "Desconectada"}
                    </p>
                  </div>
                  {a.sinLeer > 0 && (
                    <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent text-white text-[11px] font-bold grid place-items-center">
                      {a.sinLeer > 9 ? "9+" : a.sinLeer}
                    </span>
                  )}
                  <span className="shrink-0 text-[12.5px] font-bold text-accent">Felicitar →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
