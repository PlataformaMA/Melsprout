import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";

// El enlace del video de una clase, solo para el panel.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) {
    return NextResponse.json({ error: "no autorizado" }, { status: 403 });
  }
  const clase = new URL(request.url).searchParams.get("clase");
  if (!clase) return NextResponse.json({ error: "falta la clase" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin.from("cursos_clases").select("video_url").eq("id", clase).maybeSingle();
  return NextResponse.json({ url: (data?.video_url as string) || null });
}
