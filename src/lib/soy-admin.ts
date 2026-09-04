"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ¿Quien está viendo la app es admin? Vive en su propio archivo, sin más
// dependencias, porque lo llama el menú de cuenta desde el navegador.
export async function soyAdminAhora(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const raiz = (process.env.ADMIN_EMAILS || "sveidy@boostacademy.io")
      .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (user.email && raiz.includes(user.email.toLowerCase())) return true;

    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    return data?.is_admin === true;
  } catch {
    // Si algo falla, el menú simplemente no muestra el enlace: nunca rompe la página.
    return false;
  }
}
