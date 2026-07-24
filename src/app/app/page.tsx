import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

// Los admins entran directo a su panel; los usuarios, a su Ruta de Aprendizaje.
export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && (await esAdminUsuario(user.id, user.email))) redirect("/app/admin");
  redirect("/app/ruta");
}
