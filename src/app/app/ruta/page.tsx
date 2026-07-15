import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPerfil } from "@/lib/perfil-actions";
import { RutaAprendizaje } from "@/components/RutaAprendizaje";

export default async function RutaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  // Top 5 creadores por XP (progreso: clases + retos completados).
  const admin = createAdminClient();
  const { data: topRows } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, xp")
    .eq("onboarding_completo", true)
    .order("xp", { ascending: false })
    .limit(5);
  const topCreadores = (topRows || []).map((r) => ({
    id: r.id as string,
    nombre: (r.full_name as string) || "Creador",
    avatarUrl: (r.avatar_url as string) || null,
    xp: (r.xp as number) || 0,
    esTu: r.id === user.id,
  }));

  const tieneRedes = ["instagram", "tiktok", "youtube"].some((k) => perfil.redes?.[k]);
  const items = [
    !!perfil.avatar_url, !!perfil.cover_url, !!perfil.headline, !!perfil.bio,
    !!perfil.ciudad, tieneRedes, !!perfil.nicho, !!perfil.objetivo, !!perfil.plataforma_principal,
  ];
  const perfilPct = Math.round((items.filter(Boolean).length / items.length) * 100);

  return (
    <RutaAprendizaje
      nombre={perfil.full_name ?? "creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
      perfilPct={perfilPct}
      topCreadores={topCreadores}
    />
  );
}
