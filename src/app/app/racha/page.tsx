import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRachaInfo } from "@/lib/racha-actions";
import { RachaVista } from "@/components/RachaVista";

export default async function RachaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getRachaInfo();
  return <RachaVista info={info} />;
}
