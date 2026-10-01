import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inicioDeHoy } from "@/lib/racha-actions";

// Lo que la alumna lleva HOY. Antes esta tarjeta estaba escrita en duro en 0/10
// y nunca se movía: la gente completaba clases y creía que su XP no contaba.
export type DesafiosHoy = { xp: number; clases: number; retos: number };

export async function getDesafiosHoy(): Promise<DesafiosHoy> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xp: 0, clases: 0, retos: 0 };

  const desde = inicioDeHoy(user); // medianoche en SU zona horaria
  const admin = createAdminClient();

  const [{ data: clases }, { data: retos }, { data: vivos }] = await Promise.all([
    admin.from("clase_progreso").select("clase_id, xp_dado, completada_at")
      .eq("user_id", user.id).eq("completada", true).gte("completada_at", desde),
    admin.from("reto_submissions").select("xp_otorgado, updated_at")
      .eq("user_id", user.id).gte("updated_at", desde),
    admin.from("asistencias_vivo").select("clase_vivo_id, created_at")
      .eq("user_id", user.id).gte("created_at", desde),
  ]);

  const porClases = (clases || []).filter((c) => c.xp_dado).length * 100;
  const porRetos = (retos || []).reduce((a, r) => a + ((r.xp_otorgado as number) || 0), 0);
  const porVivos = (vivos || []).length * 50;

  return {
    xp: porClases + porRetos + porVivos,
    clases: (clases || []).length,
    retos: (retos || []).filter((r) => ((r.xp_otorgado as number) || 0) > 0).length,
  };
}
