import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { ETAPA_1 } from "@/lib/data";
import { getReto } from "@/lib/retos";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";

export default async function RetosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const { data: subs } = await supabase
    .from("reto_submissions")
    .select("reto_id, estado")
    .eq("user_id", user.id);
  const estados = new Map((subs || []).map((s) => [s.reto_id as string, s.estado as string]));

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="retos" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {perfil.racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {perfil.gemas}</span>
            <UserMenu avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? "Creador"} />
          </header>

          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold">Retos 🎯</h1>
          <p className="text-sub mt-1.5 mb-6">Completa los retos de cada clase, gana XP y comparte tu avance con la comunidad.</p>

          <div className="space-y-8">
            {ETAPA_1.map((modulo) => (
              <div key={modulo.id}>
                <h2 className="font-display font-extrabold text-lg mb-3">{modulo.nombre}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modulo.clases.map((c) => {
                    const reto = getReto(c.id);
                    if (!reto) return null;
                    const estado = estados.get(c.id);
                    return (
                      <Link key={c.id} href={`/app/reto/${c.id}`}
                        className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent/30 transition group">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-2xl">{reto.emoji}</span>
                          {estado === "publicado" ? (
                            <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-green/15 text-green">Publicado ✓</span>
                          ) : estado === "borrador" ? (
                            <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-amber-100 text-amber-700">Borrador</span>
                          ) : (
                            <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-bg text-sub">+{reto.xp} XP</span>
                          )}
                        </div>
                        <h3 className="font-display font-extrabold text-[15px] leading-tight group-hover:text-accent transition">{reto.titulo}</h3>
                        <p className="text-[13px] text-sub mt-1.5 line-clamp-2">{reto.descripcion}</p>
                        <div className="text-[12px] text-hint mt-3">{c.titulo}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
