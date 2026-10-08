import { createAdminClient } from "@/lib/supabase/admin";

// Plan Boost Pro.
//
// Mientras la columna `pro` no exista en `profiles`, el candado se queda
// APAGADO: todo el mundo sigue entrando a las clases en vivo como hasta hoy.
// En cuanto se corre supabase/71_plan_pro.sql, el bloqueo se enciende solo y
// solo pasan quienes tengan `pro = true` (y el equipo).
//
// Se hace así a propósito: si el candado se encendiera sin la columna, nadie
// podría entrar a una clase en vivo hasta que alguien corriera la migración.
export type EstadoPro = {
  // El plan existe en la base: solo entonces tiene sentido bloquear.
  activo: boolean;
  // Esta persona puede entrar (es Pro, o es del equipo).
  pro: boolean;
};

export async function estadoPro(userId: string | null, esAdmin = false): Promise<EstadoPro> {
  if (!userId) return { activo: false, pro: false };

  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("pro")
    .eq("id", userId)
    .maybeSingle();

  // 42703 = la columna no existe todavía → plan sin estrenar.
  if (error) return { activo: false, pro: false };

  return { activo: true, pro: esAdmin || data?.pro === true };
}
