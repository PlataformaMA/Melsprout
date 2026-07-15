import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";
import { listarRetosAdmin, listarUsuariosAdmin, listarAvances } from "@/lib/admin-actions";
import { AdminPanel } from "@/components/AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Si no es admin, MOSTRAR con qué cuenta está (en vez de rebotar en silencio).
  if (!(await esAdminUsuario(user.id, user.email))) {
    return (
      <div className="min-h-screen bg-bg grid place-items-center p-6">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="font-display text-xl font-extrabold">No tienes acceso admin</h1>
          <p className="text-sub text-[14px] mt-2">
            Estás dentro de la app con esta cuenta:
          </p>
          <p className="font-bold text-accent mt-1 break-all">{user.email || "(sin correo)"}</p>
          <p className="text-[13px] text-sub mt-3">
            Esa cuenta no está marcada como admin. Inicia sesión con tu cuenta admin, o pídele a un admin que te dé acceso.
          </p>
          <Link href="/app/ruta" className="inline-block mt-5 bg-accent text-white rounded-xl px-5 py-2.5 text-[14px] font-bold">
            Volver a la app
          </Link>
        </div>
      </div>
    );
  }

  const [retos, usuarios, avances] = await Promise.all([
    listarRetosAdmin(),
    listarUsuariosAdmin(),
    listarAvances(),
  ]);

  return <AdminPanel retos={retos} usuarios={usuarios} avances={avances} adminEmail={user.email ?? ""} />;
}
