"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdminUsuario } from "@/lib/admin";
import { darAccesoCurso } from "@/lib/acceso-actions";
import { enviarBienvenidaCompra } from "@/lib/bienvenida";

// Importación masiva desde el panel: un CSV con nombre, correo y teléfono,
// todos con el mismo rol y (si se quiere) todos con acceso a un curso.
// El navegador manda las filas ya leídas, en tandas, para ir mostrando avance.

export type FilaImportar = { nombre: string; email: string; telefono?: string };
export type RolImportar = "alumna" | "instructor" | "admin";

export type ResultadoFila = {
  email: string;
  estado: "creada" | "existente" | "error";
  detalle: string;
};

const MAX_POR_TANDA = 25;

async function comoAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await esAdminUsuario(user.id, user.email))) return null;
  return createAdminClient();
}

// Cursos a los que se puede dar acceso al importar: los especiales (los de
// la ruta son de todas y no necesitan acceso).
export async function cursosParaImportar(): Promise<{ id: string; nombre: string }[]> {
  const admin = await comoAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("cursos_modulos").select("id, nombre")
    .eq("especial", true).eq("activo", true)
    .order("orden", { ascending: true });
  return (data || []).map((c) => ({ id: c.id as string, nombre: c.nombre as string }));
}

export async function importarContactos(args: {
  filas: FilaImportar[];
  rol: RolImportar;
  cursoId?: string | null;
  enviarCorreo: boolean;
}): Promise<{ resultados: ResultadoFila[] } | { error: string }> {
  const admin = await comoAdmin();
  if (!admin) return { error: "No autorizado." };

  const filas = (args.filas || []).slice(0, MAX_POR_TANDA);
  if (!filas.length) return { resultados: [] };

  let cursoNombre: string | null = null;
  if (args.cursoId) {
    const { data: curso } = await admin
      .from("cursos_modulos").select("id, nombre").eq("id", args.cursoId).maybeSingle();
    if (!curso) return { error: "Ese curso ya no existe." };
    cursoNombre = curso.nombre as string;
  }

  // Una sola lectura de cuentas por tanda; así no se pregunta por cada fila.
  const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const porEmail = new Map(
    (lista?.users || []).map((u) => [(u.email || "").toLowerCase(), u.id]),
  );

  const resultados: ResultadoFila[] = [];

  for (const f of filas) {
    const email = (f.email || "").trim().toLowerCase();
    const nombre = (f.nombre || "").trim();
    const telefono = (f.telefono || "").trim();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      resultados.push({ email: email || "(vacío)", estado: "error", detalle: "Correo inválido." });
      continue;
    }

    let userId = porEmail.get(email) || null;
    let estado: ResultadoFila["estado"] = "existente";
    const notas: string[] = [];

    if (!userId) {
      // Igual que en la compra: contraseña aleatoria que nadie conoce y un
      // enlace por correo para que ponga la suya. No se usa la invitación de
      // Supabase porque su SMTP se tapa a los 2 correos por hora.
      const aleatoria = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({
        email, password: aleatoria, email_confirm: true,
        user_metadata: { full_name: nombre },
      });
      if (error || !data.user) {
        resultados.push({ email, estado: "error", detalle: `No se pudo crear la cuenta: ${error?.message || "desconocido"}` });
        continue;
      }
      userId = data.user.id;
      porEmail.set(email, userId);
      estado = "creada";

      const perfil: Record<string, unknown> = { id: userId, full_name: nombre, is_admin: args.rol === "admin" };
      if (telefono) perfil.whatsapp = telefono;
      await admin.from("profiles").upsert(perfil);
    } else {
      // Ya existía: se completa lo que le falte y se ajusta el rol.
      const { data: p } = await admin
        .from("profiles").select("full_name, whatsapp, is_admin").eq("id", userId).maybeSingle();
      const parche: Record<string, unknown> = {};
      if (nombre && !p?.full_name) parche.full_name = nombre;
      if (telefono && !p?.whatsapp) parche.whatsapp = telefono;
      if (args.rol === "admin" && !p?.is_admin) { parche.is_admin = true; notas.push("ahora es admin"); }
      if (Object.keys(parche).length) {
        await admin.from("profiles").upsert({ id: userId, ...parche });
      }
    }

    if (args.cursoId) {
      const r = await darAccesoCurso(userId, args.cursoId, "manual");
      if ("error" in r) {
        resultados.push({ email, estado: "error", detalle: `Cuenta ${estado === "creada" ? "creada" : "existente"}, pero ${r.error.toLowerCase()}` });
        continue;
      }
      notas.push(`acceso a ${cursoNombre}`);
    }

    if (estado === "creada" && args.enviarCorreo) {
      const ok = await enviarBienvenidaCompra(email, nombre, cursoNombre);
      notas.push(ok ? "correo enviado" : "correo NO enviado (que use «olvidé mi contraseña»)");
      // Resend admite 2 correos por segundo.
      await new Promise((res) => setTimeout(res, 550));
    }

    resultados.push({
      email, estado,
      detalle: notas.length ? notas.join(" · ") : (estado === "creada" ? "cuenta creada" : "ya tenía cuenta"),
    });
  }

  return { resultados };
}
