import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estadoMFA } from "@/lib/mfa-actions";
import { contarCodigos } from "@/lib/backup-actions";
import { cerrarSesion } from "@/lib/auth-actions";
import { BACKUP_CONFIGURADO } from "@/lib/supabase/env";
import { MFASetup } from "@/components/MFASetup";
import { BackupCodes } from "@/components/BackupCodes";

export default async function ConfigPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const estado = await estadoMFA();
  const cantidadCodigos = estado.activo ? await contarCodigos() : 0;
  const proveedor = user.app_metadata?.provider;

  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/app/ruta" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-display font-extrabold text-white text-sm">M</div>
            <span className="font-display font-extrabold">Mel<span className="text-accent">sprout</span></span>
          </Link>
          <Link href="/app/ruta" className="text-[13px] font-medium text-sub hover:text-text">← Volver</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-1 text-[11px] font-bold tracking-widest uppercase text-hint">Cuenta</div>
        <h1 className="font-display text-2xl font-extrabold">Configuración</h1>
        <p className="text-sub mt-1.5 text-sm">Tu seguridad y los datos de tu cuenta.</p>

        {/* Datos de la cuenta */}
        <div className="bg-surface border border-border rounded-2xl p-6 mt-6">
          <h2 className="font-display text-lg font-extrabold mb-3">Tu cuenta</h2>
          <div className="space-y-1">
            <Fila label="Correo" valor={user.email ?? "—"} />
            <Fila label="Estado del correo" valor={user.email_confirmed_at ? "✅ Confirmado" : "⏳ Pendiente"} />
            <Fila label="Método de acceso" valor={proveedor === "email" ? "Email y contraseña" : `Login social (${proveedor})`} />
          </div>
        </div>

        {/* Seguridad · 2FA */}
        <div className="mt-6 mb-2 text-[11px] font-bold tracking-widest uppercase text-hint">Seguridad</div>
        <div className="space-y-4">
          <MFASetup estadoInicial={estado} />
          {estado.activo && <BackupCodes cantidadInicial={cantidadCodigos} configurado={BACKUP_CONFIGURADO} />}
        </div>

        {/* Cerrar sesión */}
        <form action={cerrarSesion} className="mt-6">
          <button className="w-full border border-border bg-surface text-text font-semibold text-sm rounded-xl py-3 hover:bg-bg transition">
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-sub text-sm shrink-0">{label}</span>
      <span className="text-text text-sm font-medium text-right break-words">{valor}</span>
    </div>
  );
}
