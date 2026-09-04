import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdminUsuario } from "@/lib/admin";

// El menú de cuenta pregunta por aquí si mostrar el enlace al panel.
// Es una petición normal: no caduca con los despliegues.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ admin: false });
    return NextResponse.json({ admin: await esAdminUsuario(user.id, user.email) });
  } catch {
    return NextResponse.json({ admin: false });
  }
}
