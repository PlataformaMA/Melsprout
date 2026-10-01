import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { listarClasesVivo } from "@/lib/vivo-actions";
import { firmarVideo } from "@/lib/cursos-db";
import { GrabacionVista } from "@/components/GrabacionVista";

export default async function GrabacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const clase = (await listarClasesVivo()).find((c) => c.id === id);
  if (!clase || !clase.grabacion_url) redirect("/app/vivo");

  // Una grabación nuestra vive en el almacén privado (videos://…): se firma al
  // vuelo, igual que los videos de las clases, para que no se pueda descargar
  // con solo tener la dirección.
  const grabacion = await firmarVideo(clase.grabacion_url);

  return (
    <GrabacionVista
      clase={{ ...clase, grabacion_url: grabacion }}
      nombre={perfil.full_name ?? "Creador"}
      avatarUrl={perfil.avatar_url}
      gemas={perfil.gemas}
      racha={perfil.racha}
    />
  );
}
