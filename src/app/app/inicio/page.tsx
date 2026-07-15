import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPerfil } from "@/lib/perfil-actions";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { ETAPA_1, TOTAL_CLASES, nivelPorXP } from "@/lib/data";
import { InicioVista } from "@/components/InicioVista";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  // Retos publicados del usuario (progreso).
  const { data: subs } = await supabase
    .from("reto_submissions")
    .select("reto_id, estado")
    .eq("user_id", user.id);
  const publicados = (subs || []).filter((s) => s.estado === "publicado").length;

  // Ranking top 5 por XP.
  const admin = createAdminClient();
  const { data: topRows } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, xp")
    .eq("onboarding_completo", true)
    .order("xp", { ascending: false })
    .limit(5);
  const ranking = (topRows || []).map((r) => ({
    nombre: (r.full_name as string) || "Creador",
    avatarUrl: (r.avatar_url as string) || null,
    xp: (r.xp as number) || 0,
    esTu: r.id === user.id,
  }));

  const nivel = nivelPorXP(perfil.xp);
  // Clase actual real = primera no completada (para "Continuar aprendiendo").
  const clasesOrden = ETAPA_1.flatMap((m) => m.clases);
  const completadasSet = await getClasesCompletadas();
  const cont = clasesOrden.find((c) => !completadasSet.has(c.id)) ?? clasesOrden[clasesOrden.length - 1];

  return (
    <InicioVista
      perfil={{
        nombre: perfil.full_name ?? "Creador",
        avatarUrl: perfil.avatar_url,
        xp: perfil.xp,
        gemas: perfil.gemas,
        racha: perfil.racha,
        metricas: perfil.metricas,
        redes: perfil.redes,
      }}
      stats={{
        publicados,
        totalClases: TOTAL_CLASES,
        nivelNombre: nivel.actual.nombre,
        nivelNum: nivel.actual.nivel,
        faltanXP: nivel.faltan,
        siguienteXP: nivel.siguiente?.xp ?? perfil.xp,
      }}
      ranking={ranking}
      continuar={{ id: cont.id, titulo: cont.titulo }}
    />
  );
}
