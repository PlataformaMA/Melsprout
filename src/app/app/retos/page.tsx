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

          {(() => {
            // Todos los retos con su estado.
            const todos = ETAPA_1.flatMap((m) =>
              m.clases.map((c) => {
                const reto = getReto(c.id);
                return reto ? { claseId: c.id, claseTitulo: c.titulo, reto, estado: estados.get(c.id) } : null;
              })
            ).filter(Boolean) as { claseId: string; claseTitulo: string; reto: NonNullable<ReturnType<typeof getReto>>; estado?: string }[];

            const pendientes = todos.filter((t) => t.estado !== "publicado");
            const semana = pendientes.slice(0, 3);
            const semanaIds = new Set(semana.map((t) => t.claseId));
            const otros = todos.filter((t) => !semanaIds.has(t.claseId));

            return (
              <>
                {/* Encabezado con Octi */}
                <div className="flex items-center gap-4 mb-7">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/octi.webp" alt="Octi" width={64} height={64} className="shrink-0" />
                  <div>
                    <h1 className="font-display text-2xl sm:text-[26px] font-extrabold leading-tight">Retos de la semana</h1>
                    <p className="text-sub text-[14px] mt-1">Enfócate en estos. Yo te acompaño paso a paso 💜</p>
                  </div>
                </div>

                {/* Retos de la semana (destacados, limpios) */}
                <div className="space-y-3">
                  {semana.length === 0 && (
                    <div className="bg-surface border border-border rounded-2xl p-6 text-center text-sub">
                      🎉 ¡Completaste todos los retos disponibles! Muy bien.
                    </div>
                  )}
                  {semana.map((t, i) => (
                    <Link key={t.claseId} href={`/app/reto/${t.claseId}`}
                      className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-accent/30 transition group">
                      <span className="w-12 h-12 rounded-2xl bg-accent-soft grid place-items-center text-2xl shrink-0">{t.reto.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5">Reto {i + 1}</span>
                          {t.estado === "borrador" && <span className="text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">Borrador</span>}
                        </div>
                        <h3 className="font-display font-extrabold text-[15px] leading-tight mt-1 truncate group-hover:text-accent transition">{t.reto.titulo}</h3>
                        <p className="text-[12.5px] text-sub truncate">{t.claseTitulo}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[12px] font-bold text-accent hidden sm:block">+{t.reto.xp} XP</span>
                        <span className="text-accent text-xl group-hover:translate-x-0.5 transition">›</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Todos los retos (compacto, discreto) */}
                {otros.length > 0 && (
                  <details className="mt-8 group">
                    <summary className="cursor-pointer list-none flex items-center gap-2 text-[14px] font-bold text-sub hover:text-text transition">
                      <span className="group-open:rotate-90 transition-transform">›</span> Todos los retos ({otros.length})
                    </summary>
                    <div className="mt-3 space-y-1.5">
                      {otros.map((t) => (
                        <Link key={t.claseId} href={`/app/reto/${t.claseId}`}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface transition group/item">
                          <span className="text-lg shrink-0">{t.reto.emoji}</span>
                          <span className="flex-1 min-w-0 text-[13.5px] font-semibold truncate group-hover/item:text-accent transition">{t.reto.titulo}</span>
                          {t.estado === "publicado" ? (
                            <span className="text-[11px] font-bold text-green shrink-0">Publicado ✓</span>
                          ) : t.estado === "borrador" ? (
                            <span className="text-[11px] font-bold text-amber-700 shrink-0">Borrador</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-hint shrink-0">+{t.reto.xp} XP</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
