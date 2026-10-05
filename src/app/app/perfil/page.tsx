import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil-actions";
import { getAvance, getClasesCompletadas } from "@/lib/progreso-actions";
import { getCursos } from "@/lib/cursos-db";
import { getSocial } from "@/lib/seguidores-actions";
import { getAmigos } from "@/lib/chat-actions";
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
  const avance = await getAvance();
  // El Certificado Starter se gana al terminar el PRIMER módulo de la ruta.
  // Antes se otorgaba con 8 clases sueltas, que no corresponden a ningún
  // módulo: alguien podía terminar su curso comprado y seguir viendo el aviso.
  const cursosRuta = await getCursos();
  const primerModulo = cursosRuta.find((m) => m.clases.some((c) => !c.proximamente)) ?? null;
  const idsPrimero = primerModulo ? primerModulo.clases.filter((c) => !c.proximamente).map((c) => c.id) : [];
  const completadasSet = await getClasesCompletadas();
  const starter = primerModulo
    ? { nombre: primerModulo.nombre, hechas: idsPrimero.filter((id) => completadasSet.has(id)).length, total: idsPrimero.length }
    : { nombre: "", hechas: 0, total: 0 };
  const social = await getSocial(user.id);
  const amigos = await getAmigos();
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
              vistas: m.vistas ?? undefined,
              interacciones: m.interacciones ?? undefined,
              engagement: m.engagement ?? undefined,
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
      avance={avance}
      starter={starter}
      social={social}
      amigos={amigos}
      insightiq={insightiq}
    />
  );
}
