import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { guardarMetricasInsightIQ, cuentaDeOtroUsuario } from "@/lib/social-store";
import {
  INSIGHTIQ_CONFIGURADO,
  crearUsuario,
  crearSdkToken,
  obtenerMetricas,
  obtenerCuentas,
  desconectarCuenta,
  insightiqEnv,
} from "@/lib/insightiq";
import { PerfilVista, type InsightIQProps } from "@/components/PerfilVista";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil();
  if (!perfil) redirect("/onboarding");
  if (!perfil.onboarding_completo) redirect("/onboarding");

  // ——— InsightIQ: conexión de redes + sincronización de métricas ———
  let insightiq: InsightIQProps | null = null;
  if (INSIGHTIQ_CONFIGURADO) {
    try {
      // Idempotente: crea el usuario de InsightIQ (external_id = id Supabase) o lo recupera.
      const iqUserId = await crearUsuario(user.id, perfil.full_name || "creador");

      if (iqUserId) {
        // Sincroniza métricas de cuentas ya conectadas (al recargar la página).
        const metricasTodas = await obtenerMetricas(iqUserId);

        // BLINDAJE: descarta cuentas que ya pertenecen a OTRO usuario de Melsprout
        // (evita que una misma red social quede en dos cuentas). Se desconectan.
        const metricas: typeof metricasTodas = [];
        let cuentasIq: { accountId: string; provider: string }[] | null = null;
        for (const m of metricasTodas) {
          if (m.username && (await cuentaDeOtroUsuario(user.id, m.provider, m.username))) {
            if (!cuentasIq) cuentasIq = await obtenerCuentas(iqUserId);
            const c = cuentasIq.find((x) => x.provider === m.provider);
            if (c) await desconectarCuenta(c.accountId);
            console.warn("InsightIQ: cuenta ya reclamada por otro usuario, desconectada", m.provider, m.username);
            continue;
          }
          metricas.push(m);
        }

        if (metricas.length) {
          await guardarMetricasInsightIQ(user.id, metricas);
          for (const m of metricas) {
            perfil.metricas[m.provider] = {
              followers: m.followers ?? undefined,
              following: m.following ?? undefined,
              posts: m.posts ?? undefined,
              likes: m.likes ?? undefined,
              username: m.username ?? undefined,
              url: m.url ?? undefined,
              image: m.image ?? undefined,
              audiencia: m.audiencia ?? null,
              updated_at: new Date().toISOString(),
            };
            if (m.username) perfil.redes[m.provider] = m.username;
          }
        }
        // Token para abrir la ventana de conexión desde el cliente.
        const token = await crearSdkToken(iqUserId);
        if (token) {
          insightiq = { userId: iqUserId, token, environment: insightiqEnv() };
        }
      }
    } catch (e) {
      console.error("InsightIQ perfil error", e);
    }
  }

  return (
    <PerfilVista
      perfil={perfil}
      creadoEn={user.created_at ?? null}
      insightiq={insightiq}
    />
  );
}
