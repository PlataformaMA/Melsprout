import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// Enlace corto y bonito de un grupo: /g/boost-your-web
export default async function GrupoPorSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("grupos").select("id").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  redirect(`/app/comunidad/grupo/${data.id}`);
}
