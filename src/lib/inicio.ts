"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { getCursos } from "@/lib/cursos-db";
import { getClasesCompletadas } from "@/lib/progreso-actions";
import { nivelPorXP } from "@/lib/data";
import { estadoPro } from "@/lib/pro";

// Todo lo que pinta la pantalla de Inicio, en una sola pasada.
//
// Nada aquí es de adorno: cada número sale de datos reales. Si algo todavía no
// existe (campañas sin Pro, por ejemplo), viene en cero y la sección lo dice.

export type ClaseEnCurso = {
  id: string;
  titulo: string;
  portada: string | null;
  modulo: string;
  nivel: string | null;
  // "Clase 3/4" dentro de su módulo.
  posicion: string;
};

export type ClasePorVenir = { id: string; titulo: string; modulo: string };

export type CampaniaInicio = {
  id: string;
  titulo: string;
  marca: string;
  logo: string | null;
  pago: string;
  estado: "En curso" | "En revisión";
};

export type SesionVivo = {
  id: string;
  titulo: string;
  instructor: string | null;
  dia: string;      // "16"
  mes: string;      // "oct"
  hora: string;     // "7:00 PM"
  hoy: boolean;
};

export type DatosInicio = {
  nivel: { numero: number; nombre: string };
  modulos: { hechos: number; total: number };
  certificaciones: number;
  campaniasActivas: number;
  ganancias: number;
  enCurso: ClaseEnCurso | null;
  porVenir: ClasePorVenir[];
  misCampanias: CampaniaInicio[];
  sugeridas: CampaniaInicio[];
  sesiones: SesionVivo[];
  // Sin Boost Pro las campañas no se cargan.
  sinPro: boolean;
};

export async function getInicio(): Promise<DatosInicio | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [perfil, cursos, completadas, soyEquipo] = await Promise.all([
    supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle().then((r) => r.data),
    getCursos(true),
    getClasesCompletadas(),
    esAdminUsuario(user.id, user.email),
  ]);

  const nivel = nivelPorXP((perfil?.xp as number) || 0).actual;
  const admin = createAdminClient();

  // ——— Avance de la Ruta ———
  const deLaRuta = cursos.filter((m) => !m.especialId);
  const clasesRuta = deLaRuta.flatMap((m) => m.clases);
  const modulosHechos = deLaRuta.filter(
    (m) => m.clases.length > 0 && m.clases.every((c) => completadas.has(c.id))
  ).length;

  // Un curso especial terminado también es una certificación.
  const { data: accesos } = await admin
    .from("curso_accesos").select("modulo_id").eq("user_id", user.id);
  const mios = new Set((accesos || []).map((a) => a.modulo_id as string));
  const especialesHechos = cursos.filter(
    (m) => m.especialId && mios.has(m.especialId) &&
      m.clases.length > 0 && m.clases.every((c) => completadas.has(c.id))
  ).length;
  const rutaCompleta = clasesRuta.length > 0 && clasesRuta.every((c) => completadas.has(c.id));
  const certificaciones = especialesHechos + (rutaCompleta ? 1 : 0);

  // ——— En qué se quedó y qué sigue ———
  let enCurso: ClaseEnCurso | null = null;
  const porVenir: ClasePorVenir[] = [];
  for (const m of deLaRuta) {
    for (let i = 0; i < m.clases.length; i++) {
      const c = m.clases[i];
      if (completadas.has(c.id)) continue;
      if (!enCurso) {
        enCurso = {
          id: c.id, titulo: c.titulo, portada: c.portada ?? null,
          modulo: m.nombre, nivel: m.nivel ?? null,
          posicion: `Clase ${i + 1}/${m.clases.length}`,
        };
      } else if (porVenir.length < 2) {
        porVenir.push({ id: c.id, titulo: c.titulo, modulo: m.nombre });
      }
    }
    if (enCurso && porVenir.length >= 2) break;
  }

  // ——— Campañas ———
  const pro = await estadoPro(user.id, soyEquipo);
  const sinPro = pro.activo && !pro.pro;
  let misCampanias: CampaniaInicio[] = [];
  let sugeridas: CampaniaInicio[] = [];
  let ganancias = 0;

  if (!sinPro) {
    try {
      const [{ data: mias }, { data: abiertas }] = await Promise.all([
        admin.from("campania_aplicaciones")
          .select("estado, campanias!inner(id, titulo, pago_min, pago_max, marcas!inner(nombre, logo_url))")
          .eq("user_id", user.id).in("estado", ["aceptada", "enviada"])
          .order("created_at", { ascending: false }).limit(6),
        admin.from("campanias")
          .select("id, titulo, pago_min, pago_max, marcas!inner(nombre, logo_url)")
          .eq("activa", true).order("created_at", { ascending: false }).limit(8),
      ]);

      type Fila = {
        id: string; titulo: string; pago_min: number | null; pago_max: number | null;
        marcas: { nombre: string; logo_url: string | null };
      };

      misCampanias = (mias || []).map((a) => {
        const c = a.campanias as unknown as Fila;
        // Lo aceptado es lo que cuenta como ganancia: lo demás todavía se está
        // revisando. Se toma el piso del rango, para no prometer de más.
        if (a.estado === "aceptada") ganancias += c.pago_min ?? 0;
        return {
          id: c.id, titulo: c.titulo,
          marca: c.marcas?.nombre ?? "Marca",
          logo: c.marcas?.logo_url ?? null,
          pago: rango(c.pago_min, c.pago_max),
          estado: a.estado === "aceptada" ? "En curso" : "En revisión",
        } as CampaniaInicio;
      });

      const yaEstoy = new Set(misCampanias.map((c) => c.id));
      sugeridas = (abiertas || [])
        .filter((c) => !yaEstoy.has(c.id as string))
        .slice(0, 2)
        .map((c) => {
          const f = c as unknown as Fila;
          return {
            id: f.id, titulo: f.titulo,
            marca: f.marcas?.nombre ?? "Marca",
            logo: f.marcas?.logo_url ?? null,
            pago: rango(f.pago_min, f.pago_max),
            estado: "En curso",
          } as CampaniaInicio;
        });
    } catch {
      // Sin tablas de marketplace todavía: las secciones salen vacías.
    }
  }

  // ——— Próximas sesiones en vivo ———
  const { listarClasesVivo } = await import("@/lib/vivo-actions");
  const ahora = Date.now();
  const sesiones: SesionVivo[] = (await listarClasesVivo())
    .filter((c) => new Date(c.inicia_at).getTime() > ahora)
    .slice(0, 3)
    .map((c) => {
      const d = new Date(c.inicia_at);
      const hoy = new Date().toDateString() === d.toDateString();
      return {
        id: c.id, titulo: c.titulo, instructor: c.instructor,
        dia: d.toLocaleDateString("es-MX", { day: "2-digit" }),
        mes: d.toLocaleDateString("es-MX", { month: "short" }).replace(".", ""),
        hora: d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" }),
        hoy,
      };
    });

  return {
    nivel: { numero: nivel.nivel, nombre: nivel.nombre },
    modulos: { hechos: modulosHechos, total: clasesRuta.length },
    certificaciones,
    campaniasActivas: misCampanias.filter((c) => c.estado === "En curso").length,
    ganancias,
    enCurso, porVenir, misCampanias, sugeridas, sesiones, sinPro,
  };
}

function rango(min: number | null, max: number | null): string {
  const corto = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`);
  if (min && max) return `${corto(min)}-${corto(max)}`;
  if (max) return `Hasta ${corto(max)}`;
  if (min) return `Desde ${corto(min)}`;
  return "A convenir";
}
