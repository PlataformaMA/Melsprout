import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getAmigos, getConversacion } from "@/lib/chat-actions";
import { ChatVista } from "@/components/ChatVista";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil?.onboarding_completo) redirect("/onboarding");

  const [{ mensajes, amigo }, amigos] = await Promise.all([
    getConversacion(id),
    getAmigos(),
  ]);
  // Sin seguimiento mutuo no hay conversación: de vuelta a la lista.
  if (!amigo) redirect("/app/amigos");

  return (
    <ChatVista amigo={amigo} mensajesIniciales={mensajes} amigos={amigos} yoAvatar={perfil.avatar_url} />
  );
}
