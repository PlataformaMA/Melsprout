"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { notificar } from "@/lib/notificaciones-actions";

// La cuenta de una empresa.
//
// Una empresa NO es una alumna: no ve la ruta, ni la comunidad, ni el XP. Entra
// a su propio panel. Por debajo es la misma fila de `marcas` que las creadoras
// ven en su Marketplace, con un dueño: así la campaña que publica la empresa es
// exactamente la que ve la creadora, sin duplicar nada.
//
// Mientras no se corra supabase/75_portal_marcas.sql, `miMarca` devuelve null y
// la plataforma se comporta como siempre.

export type MiMarca = {
  id: string;
  nombre: string;
  lema: string | null;
  categoria: string | null;
  logoUrl: string | null;
  sitio: string | null;
  plan: string;
  // El equipo ya la revisó: hasta entonces no puede publicar campañas.
  aprobada: boolean;
};

// La marca de quien está usando la plataforma, si es una cuenta de empresa.
export async function miMarca(): Promise<MiMarca | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await createAdminClient()
      .from("marcas")
      .select("id, nombre, lema, categoria, logo_url, sitio, plan, aprobada")
      .eq("dueno_id", user.id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id as string,
      nombre: data.nombre as string,
      lema: (data.lema as string) || null,
      categoria: (data.categoria as string) || null,
      logoUrl: (data.logo_url as string) || null,
      sitio: (data.sitio as string) || null,
      plan: (data.plan as string) || "free",
      aprobada: data.aprobada === true,
    };
  } catch {
    return null;   // la migración todavía no corre
  }
}

// Alta de la empresa después de crear la cuenta.
//
// Cualquiera puede registrarse; publicar es otra cosa: la campaña no sale al
// Marketplace hasta que el equipo apruebe primero a la empresa y luego la
// campaña.
export async function registrarEmpresa(datos: {
  nombre: string; sitio?: string; categoria?: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const nombre = datos.nombre.trim();
  if (nombre.length < 2) return { error: "Escribe el nombre de la empresa." };

  const sitio = datos.sitio?.trim();
  if (sitio && !/^https?:\/\//i.test(sitio)) {
    return { error: "El sitio tiene que empezar con http o https." };
  }

  try {
    const admin = createAdminClient();

    // ¿Ya tiene marca? Entonces solo se actualiza; no se crean dos.
    const { data: ya } = await admin.from("marcas").select("id").eq("dueno_id", user.id).maybeSingle();
    if (ya) {
      await admin.from("marcas")
        .update({ nombre, sitio: sitio || null, categoria: datos.categoria || null })
        .eq("id", ya.id);
      return { ok: true };
    }

    const { data: marca, error } = await admin.from("marcas").insert({
      nombre,
      sitio: sitio || null,
      categoria: datos.categoria || null,
      dueno_id: user.id,
      // No se publica sola: ni la marca se lista ni sus campañas salen hasta
      // que el equipo la apruebe.
      aprobada: false,
      activa: false,
    }).select("id").single();
    if (error || !marca) return { error: "No se pudo registrar la empresa." };

    await admin.from("profiles")
      .update({ tipo: "empresa", full_name: nombre, onboarding_completo: true })
      .eq("id", user.id);

    // Al equipo le toca revisarla.
    const { data: equipo } = await admin.from("profiles").select("id").eq("is_admin", true);
    await Promise.all(
      (equipo || []).map((p) => notificar(p.id as string, "general",
        "Una empresa quiere colaborar",
        `${nombre} se registró y espera tu aprobación.`,
        "/app/admin"))
    );
    return { ok: true };
  } catch {
    return { error: "El registro de empresas todavía no está activado." };
  }
}

// ————— Panel del equipo —————
export type EmpresaAdmin = {
  id: string; nombre: string; sitio: string | null; categoria: string | null;
  logoUrl: string | null; aprobada: boolean; plan: string;
  correo: string | null; campanias: number; fecha: string;
};

export async function listarEmpresas(): Promise<EmpresaAdmin[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return [];

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("marcas").select("*").not("dueno_id", "is", null)
      .order("created_at", { ascending: false });
    if (!data?.length) return [];

    const { data: camps } = await admin.from("campanias").select("marca_id");
    const cuenta = new Map<string, number>();
    for (const c of camps || []) {
      const k = c.marca_id as string;
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
    }

    const { listarTodosLosUsuarios } = await import("@/lib/usuarios-auth");
    const usuarios = await listarTodosLosUsuarios(admin);
    const correos = new Map(usuarios.map((u) => [u.id, u.email ?? null]));

    return data.map((m) => ({
      id: m.id as string,
      nombre: m.nombre as string,
      sitio: (m.sitio as string) || null,
      categoria: (m.categoria as string) || null,
      logoUrl: (m.logo_url as string) || null,
      aprobada: m.aprobada === true,
      plan: (m.plan as string) || "free",
      correo: correos.get(m.dueno_id as string) ?? null,
      campanias: cuenta.get(m.id as string) || 0,
      fecha: m.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function aprobarEmpresa(
  id: string, aprobada: boolean
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return { error: "No autorizado." };

  try {
    const admin = createAdminClient();
    const { data: m } = await admin
      .from("marcas").select("dueno_id, nombre").eq("id", id).maybeSingle();

    const { error } = await admin.from("marcas")
      .update({ aprobada, activa: aprobada }).eq("id", id);
    if (error) return { error: "No se pudo guardar." };

    if (m?.dueno_id) {
      await notificar(m.dueno_id as string, "general",
        aprobada ? "¡Tu empresa quedó aprobada! 🎉" : "Tu empresa quedó en pausa",
        aprobada
          ? "Ya puedes publicar campañas y buscar creadoras."
          : "El equipo puso tu cuenta en pausa. Escríbenos si tienes dudas.",
        "/app/marca");
    }
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar." };
  }
}
