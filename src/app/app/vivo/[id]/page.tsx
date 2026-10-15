import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { listarClasesVivo } from "@/lib/vivo-actions";
import { firmarVideo } from "@/lib/cursos-db";
import { GrabacionVista } from "@/components/GrabacionVista";
import { estadoPro } from "@/lib/pro";
import { esAdminUsuario } from "@/lib/admin";

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

  // Las grabaciones GENERALES son de Boost Pro: sin plan, de vuelta al listado
  // (ahí se le ofrece con el pop-up, en vez de abrirle el video). Las de un
  // curso comprado no: listarClasesVivo ya solo las devuelve a quien lo pagó,
  // y lo pagado no se cobra dos veces.
  const pro = await estadoPro(user.id, await esAdminUsuario(user.id, user.email));
  if (pro.activo && !pro.pro && clase && !clase.modulo_id) redirect("/app/vivo?pro=1");
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
      xp={perfil.xp}
      racha={perfil.racha}
    />
  );
}
