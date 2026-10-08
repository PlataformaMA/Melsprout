import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getAmigos, getConversacion } from "@/lib/chat-actions";
import { ChatVista } from "@/components/ChatVista";
import { estadoPro } from "@/lib/pro";
import { esAdminUsuario } from "@/lib/admin";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  // El chat es parte de Boost Pro: sin plan, a la lista (ahí sale el aviso).
  const pro = await estadoPro(user.id, await esAdminUsuario(user.id, user.email));
  if (pro.activo && !pro.pro) redirect("/app/amigos");

  const [{ mensajes, amigo }, amigos] = await Promise.all([
    getConversacion(id),
    getAmigos(),
  ]);
  // Sin seguimiento mutuo no hay conversación: de vuelta a la lista.
  if (!amigo) redirect("/app/amigos");

  return (
    <ChatVista amigo={amigo} mensajesIniciales={mensajes} amigos={amigos} yoAvatar={perfil.avatar_url} yoId={perfil.id} />
  );
}
