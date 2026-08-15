import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPerfil } from "@/lib/perfil-actions";
import { getCursoEspecial } from "@/lib/cursos-db";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { CursoEspecialVista } from "@/components/CursoEspecialVista";

export default async function CursoEspecialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const curso = await getCursoEspecial(id);
  if (!curso) notFound();

  const completadas = await getClasesCompletadas();

  // Ranking: top 5 por XP (solo verificados) y tu posición global.
  const admin = createAdminClient();
  const [{ data: topRows }, { count: arriba }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url, xp")
      .eq("onboarding_completo", true).eq("email_verificado", true)
      .order("xp", { ascending: false }).order("created_at", { ascending: true }).limit(5),
    admin.from("profiles").select("id", { count: "exact", head: true })
      .eq("onboarding_completo", true).eq("email_verificado", true)
      .gt("xp", perfil.xp ?? 0),
  ]);

  const top = (topRows || []).map((r) => ({
    id: r.id as string,
    nombre: (r.full_name as string) || "Creador",
    avatar: (r.avatar_url as string) || null,
    xp: (r.xp as number) || 0,
    esTu: r.id === user.id,
  }));

  return (
    <CursoEspecialVista
      yo={{
        nombre: perfil.full_name ?? "Creador",
        avatar: perfil.avatar_url,
        racha: perfil.racha,
        gemas: perfil.gemas,
        xp: perfil.xp ?? 0,
      }}
      curso={curso}
      completadas={[...completadas]}
      top={top}
      miPosicion={(arriba ?? 0) + 1}
    />
  );
}
