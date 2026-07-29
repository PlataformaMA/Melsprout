import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getCursos } from "@/lib/cursos-db";
import { listarRetosPorTipo, type RetoRow } from "@/lib/retos-db";
import { esAdminUsuario } from "@/lib/admin";
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
    .select("reto_id, estado, revision")
    .eq("user_id", user.id);
  const estados = new Map((subs || []).map((s) => [s.reto_id as string, s.estado as string]));
  const revisiones = new Map((subs || []).map((s) => [s.reto_id as string, (s.revision as string) ?? null]));

  // Chip de estado del reto (según lo enviado por el usuario).
  const chip = (id: string) => {
    const est = estados.get(id);
    const rev = revisiones.get(id);
    if (rev === "aprobado") return { txt: "Aprobado ✓", cls: "text-green bg-green-soft" };
    if (rev === "rechazado") return { txt: "Rechazado", cls: "text-pink bg-pink-soft" };
    if (est === "publicado") return { txt: "En revisión", cls: "text-accent bg-accent-soft" };
    if (est === "borrador") return { txt: "Borrador", cls: "text-amber-700 bg-amber-100" };
    return null;
  };
  const porTipo = await listarRetosPorTipo();
  const soyAdmin = await esAdminUsuario(user.id, user.email);
  const cursos = await getCursos();

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="retos" />
      <div className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5">
          <header className="flex items-center justify-end gap-4 mb-5 h-10">
            <span className="flex items-center gap-1.5 text-[14px] font-bold">🔥 {perfil.racha}</span>
            <span className="flex items-center gap-1.5 text-[14px] font-bold">💎 {perfil.gemas}</span>
            <UserMenu avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? "Creador"} esAdmin={soyAdmin} />
          </header>

          {(() => {
            // Todos los retos con su estado (uno por clase del currículum).
            const todos = cursos.flatMap((m) =>
              m.clases.map((c) => ({
                claseId: c.id,
                claseTitulo: c.titulo,
                reto: { emoji: "🎯", titulo: c.reto || `Reto: ${c.titulo}`, descripcion: "Aplica lo aprendido en la clase y compártelo.", xp: 50 },
                estado: estados.get(c.id),
              }))
            ) as { claseId: string; claseTitulo: string; reto: { emoji: string; titulo: string; descripcion: string; xp: number }; estado?: string }[];

            const pendientes = todos.filter((t) => t.estado !== "publicado");
            const semana = pendientes.slice(0, 3);
            const semanaIds = new Set(semana.map((t) => t.claseId));
            const otros = todos.filter((t) => !semanaIds.has(t.claseId));

            return (
              <>
                {/* Encabezado con Octi */}
                <div className="flex items-center gap-4 mb-7">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/octi.png" alt="Octi" width={64} height={64} className="shrink-0" />
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
                          {(() => { const c = chip(t.claseId); return c ? <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${c.cls}`}>{c.txt}</span> : null; })()}
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

                {/* Retos por tipo (creados desde el panel admin) */}
                {(["semanal", "grupal", "personal"] as const).map((tp) => {
                  const items: RetoRow[] = porTipo[tp] || [];
                  if (items.length === 0) return null;
                  const titulos: Record<string, string> = { semanal: "Más retos de la semana 🗓️", grupal: "Retos grupales 👥", personal: "Retos personales ✨" };
                  return (
                    <div key={tp} className="mt-8">
                      <h2 className="font-display font-extrabold text-lg mb-3">{titulos[tp]}</h2>
                      <div className="space-y-3">
                        {items.map((r) => (
                          <Link key={r.id} href={`/app/reto/${r.id}`}
                            className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-accent/30 transition group">
                            <span className="w-12 h-12 rounded-2xl bg-accent-soft grid place-items-center text-2xl shrink-0">{r.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display font-extrabold text-[15px] leading-tight truncate group-hover:text-accent transition">{r.titulo}</h3>
                              <p className="text-[12.5px] text-sub truncate">{r.descripcion}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[12px] font-bold text-accent hidden sm:block">+{r.xp} XP</span>
                              {(() => { const c = chip(r.id); return c ? <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${c.cls}`}>{c.txt}</span> : null; })()}
                              <span className="text-accent text-xl group-hover:translate-x-0.5 transition">›</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Todos los retos (compacto, discreto) */}
                {otros.length > 0 && (
                  <details className="mt-8 group">
                    <summary className="cursor-pointer list-none flex items-center gap-2 text-[14px] font-bold text-sub hover:text-text transition">
                      <span className="group-open:rotate-90 transition-transform">›</span> Todos los retos ({otros.length})
                    </summary>
                    <div className="mt-3 space-y-1.5">
                      {otros.map((t) => {
                        const done = revisiones.get(t.claseId) === "aprobado";
                        return (
                          <Link key={t.claseId} href={`/app/reto/${t.claseId}`}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface transition group/item ${done ? "opacity-60" : ""}`}>
                            {done ? (
                              <span className="w-6 h-6 rounded-full bg-green text-white grid place-items-center text-[12px] shrink-0">✓</span>
                            ) : (
                              <span className="text-lg shrink-0 w-6 text-center">{t.reto.emoji}</span>
                            )}
                            <span className={`flex-1 min-w-0 text-[13.5px] font-semibold truncate group-hover/item:text-accent transition ${done ? "line-through decoration-green/50" : ""}`}>{t.reto.titulo}</span>
                            {(() => {
                              const c = chip(t.claseId);
                              return c
                                ? <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${c.cls}`}>{c.txt}</span>
                                : <span className="text-[11px] font-semibold text-hint shrink-0">+{t.reto.xp} XP</span>;
                            })()}
                          </Link>
                        );
                      })}
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
