import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";
import { listarRetosAdmin, listarUsuariosAdmin } from "@/lib/admin-actions";
import { AdminPanel } from "@/components/AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await esAdminUsuario(user.id, user.email))) redirect("/app/ruta");

  const [retos, usuarios] = await Promise.all([listarRetosAdmin(), listarUsuariosAdmin()]);

  return <AdminPanel retos={retos} usuarios={usuarios} adminEmail={user.email ?? ""} />;
}
