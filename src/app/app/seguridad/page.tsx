import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estadoMFA } from "@/lib/mfa-actions";
import { contarCodigos } from "@/lib/backup-actions";
import { BACKUP_CONFIGURADO } from "@/lib/supabase/env";
import { MFASetup } from "@/components/MFASetup";
import { BackupCodes } from "@/components/BackupCodes";

export default async function SeguridadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const estado = await estadoMFA();
  const cantidadCodigos = estado.activo ? await contarCodigos() : 0;

  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-display font-extrabold text-white text-sm">
              M
            </div>
            <span className="font-display font-extrabold">
              Mel<span className="text-accent">sprout</span>
            </span>
          </Link>
          <Link
            href="/app"
            className="text-[13px] font-medium text-sub hover:text-text"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-1 text-[11px] font-bold tracking-widest uppercase text-hint">
          Cuenta
        </div>
        <h1 className="font-display text-2xl font-extrabold">
          Seguridad de tu cuenta
        </h1>
        <p className="text-sub mt-1.5 text-sm">
          Protege tu acceso a Melsprout con capas extra de seguridad.
        </p>

        <div className="mt-6 space-y-4">
          <MFASetup estadoInicial={estado} />

          {estado.activo && (
            <BackupCodes
              cantidadInicial={cantidadCodigos}
              configurado={BACKUP_CONFIGURADO}
            />
          )}
        </div>

        <div className="mt-4 bg-blue-soft/50 border border-blue-soft rounded-xl px-4 py-3 text-[12.5px] text-blue leading-relaxed">
          💡 <b>Consejo:</b> genera tus códigos de respaldo y guárdalos en un
          lugar seguro. Si pierdes tu celular, un código de respaldo te deja
          recuperar el acceso sin ayuda de nadie.
        </div>
      </div>
    </main>
  );
}
