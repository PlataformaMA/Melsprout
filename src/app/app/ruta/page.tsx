import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPerfil } from "@/lib/perfil-actions";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { getCursos } from "@/lib/cursos-db";
import { nivelPorXP } from "@/lib/data";
import { RutaAprendizaje } from "@/components/RutaAprendizaje";

type EReto = "completada" | "en-revision" | "rechazada" | "pendiente" | "bloqueada";

export default async function RutaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  // ¿El usuario ya verificó su correo? (gatea aparecer en el ranking).
  const admin = createAdminClient();
  const { data: verifRow } = await admin
    .from("profiles").select("email_verificado").eq("id", user.id).maybeSingle();
  const emailVerificado = !!verifRow?.email_verificado;

  // Top 5 creadores por XP — SOLO verificados (así los robots no ensucian el ranking).
  const { data: topRows } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, xp")
    .eq("onboarding_completo", true)
    .eq("email_verificado", true)
    .order("xp", { ascending: false })
    .order("created_at", { ascending: true }) // desempate estable: mismo orden para TODOS
    .limit(5);
  const topCreadores = (topRows || []).map((r) => ({
    id: r.id as string,
    nombre: (r.full_name as string) || "Creador",
    avatarUrl: (r.avatar_url as string) || null,
    xp: (r.xp as number) || 0,
    esTu: r.id === user.id,
  }));

  // Tu posición global en el ranking (cuántos tienen más XP que tú, +1).
  const miXp = perfil.xp ?? 0;
  const { count: mejores } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_completo", true)
    .eq("email_verificado", true)
    .gt("xp", miXp);
  const tuRanking = { pos: (mejores ?? 0) + 1, xp: miXp };

  // Ranking COMPLETO (modal "Ranking de estudiantes"): todos los estudiantes por XP, con su nivel.
  const { data: rankRows } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, xp")
    .eq("onboarding_completo", true)
    .eq("email_verificado", true)
    .order("xp", { ascending: false })
    .order("created_at", { ascending: true }) // desempate estable: mismo orden para TODOS
    .limit(100);
  const ranking = (rankRows || []).map((r, i) => ({
    pos: i + 1,
    id: r.id as string,
    nombre: (r.full_name as string) || "Creador",
    avatarUrl: (r.avatar_url as string) || null,
    xp: (r.xp as number) || 0,
    nivelNum: nivelPorXP((r.xp as number) || 0).actual.nivel,
    nivelNombre: nivelPorXP((r.xp as number) || 0).actual.nombre,
    esTu: r.id === user.id,
  }));

  const tieneRedes = ["instagram", "tiktok", "youtube"].some((k) => perfil.redes?.[k]);
  const items = [
    !!perfil.avatar_url, !!perfil.cover_url, !!perfil.headline, !!perfil.bio,
    !!perfil.ciudad, tieneRedes, !!perfil.nicho, !!perfil.objetivo, !!perfil.plataforma_principal,
  ];
  const perfilPct = Math.round((items.filter(Boolean).length / items.length) * 100);

  // ——— Cursos (BD, con fallback) + progreso REAL ———
  const cursos = await getCursos();
  const orden = cursos.flatMap((m) => m.clases.map((c) => c.id));
  const completadasSet = await getClasesCompletadas();
  let completadas = 0;
  for (const id of orden) { if (completadasSet.has(id)) completadas++; else break; }

  // ——— Estado de los retos (de reto_submissions) ———
  const { data: subs } = await supabase
    .from("reto_submissions")
    .select("reto_id, estado, revision")
    .eq("user_id", user.id);
  const retoEstados: Record<string, EReto> = {};
  for (const s of subs || []) {
    const rid = s.reto_id as string;
    if (!orden.includes(rid)) continue; // solo retos ligados a clases (id "1.1")
    if (s.revision === "aprobado") retoEstados[rid] = "completada";
    else if (s.revision === "rechazado") retoEstados[rid] = "rechazada";
    else if (s.estado === "publicado") retoEstados[rid] = "en-revision";
  }

  return (
    <RutaAprendizaje
      nombre={perfil.full_name ?? "creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
      perfilPct={perfilPct}
      topCreadores={topCreadores}
      completadas={completadas}
      retoEstados={retoEstados}
      cursos={cursos}
      tuRanking={tuRanking}
      ranking={ranking}
      emailVerificado={emailVerificado}
      xp={miXp}
    />
  );
}
