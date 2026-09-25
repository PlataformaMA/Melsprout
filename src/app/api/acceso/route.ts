import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buscarUsuarioPorEmail } from "@/lib/usuarios-auth";
import { darAccesoCurso, quitarAccesoCurso } from "@/lib/acceso-actions";
import { notificar } from "@/lib/notificaciones-actions";
import { enviarBienvenidaCompra } from "@/lib/bienvenida";

// Alta y baja de acceso a un curso desde fuera (Hotmart vía n8n).
//
//   POST /api/acceso
//   Authorization: Bearer <ACCESO_API_TOKEN>
//   { evento, curso, email, nombre, telefono, transaccion }
//
// Es idempotente: la pareja (transaccion, evento) solo se aplica una vez.
// Hotmart y n8n reintentan, y el segundo aviso no vuelve a hacer nada.

type Evento = "compra_aprobada" | "acceso_revocado";

type Cuerpo = {
  evento?: string;
  curso?: string;
  email?: string;
  nombre?: string;
  telefono?: string;
  transaccion?: string;
};

const EVENTOS: Evento[] = ["compra_aprobada", "acceso_revocado"];

function noAutorizado() {
  return NextResponse.json({ ok: false, error: "no_autorizado" }, { status: 401 });
}
function malaPeticion(detalle: string) {
  return NextResponse.json({ ok: false, error: "peticion_invalida", detalle }, { status: 400 });
}

// Compara el token en tiempo constante: sin esto se puede adivinar carácter
// a carácter midiendo cuánto tarda en responder.
function tokenValido(recibido: string, esperado: string): boolean {
  if (recibido.length !== esperado.length) return false;
  let dif = 0;
  for (let i = 0; i < recibido.length; i++) dif |= recibido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return dif === 0;
}

export async function POST(request: Request) {
  const esperado = process.env.ACCESO_API_TOKEN;
  if (!esperado) {
    console.error("/api/acceso: falta ACCESO_API_TOKEN");
    return NextResponse.json({ ok: false, error: "sin_configurar" }, { status: 503 });
  }

  const cabecera = request.headers.get("authorization") || "";
  const recibido = cabecera.startsWith("Bearer ") ? cabecera.slice(7).trim() : "";
  if (!recibido || !tokenValido(recibido, esperado)) return noAutorizado();

  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return malaPeticion("el cuerpo no es JSON válido");
  }

  const evento = (cuerpo.evento || "").trim() as Evento;
  const cursoSlug = (cuerpo.curso || "").trim().toLowerCase();
  const email = (cuerpo.email || "").trim().toLowerCase();
  const nombre = (cuerpo.nombre || "").trim();
  const telefono = (cuerpo.telefono || "").trim();
  const transaccion = (cuerpo.transaccion || "").trim();

  if (!EVENTOS.includes(evento)) return malaPeticion(`evento debe ser uno de: ${EVENTOS.join(", ")}`);
  if (!cursoSlug) return malaPeticion("falta curso");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return malaPeticion("email inválido");
  if (!transaccion) return malaPeticion("falta transaccion");

  const admin = createAdminClient();

  // ¿Ya procesamos este aviso CON ÉXITO? Solo entonces se corta. Antes se
  // cortaba también cuando el intento anterior había fallado, así que el
  // reintento de Hotmart recibía "ya está" y la compra se quedaba sin acceso.
  const { data: yaVisto } = await admin
    .from("accesos_eventos")
    .select("id, resultado, user_id")
    .eq("transaccion", transaccion)
    .eq("evento", evento)
    .eq("resultado", "aplicado")
    .maybeSingle();
  if (yaVisto) {
    return NextResponse.json({
      ok: true, duplicado: true, evento, email,
      mensaje: "Este aviso ya se había procesado; no se hizo nada.",
    });
  }

  const bitacora = async (resultado: string, detalle: string, userId?: string | null) => {
    await admin.from("accesos_eventos").insert({
      transaccion, evento, curso_slug: cursoSlug, email,
      user_id: userId ?? null, resultado, detalle,
      payload: cuerpo as unknown as Record<string, unknown>,
    });
  };

  // El curso tiene que existir.
  const { data: curso } = await admin
    .from("cursos_modulos").select("id, nombre").eq("slug", cursoSlug).maybeSingle();
  if (!curso) {
    await bitacora("error", `no existe el curso «${cursoSlug}»`);
    return NextResponse.json(
      { ok: false, error: "curso_no_encontrado", detalle: `no existe el curso «${cursoSlug}»` },
      { status: 404 },
    );
  }

  // ¿Ya tiene cuenta? (se busca en todas las páginas: con más de 1000 cuentas,
  //  mirar solo la primera dejaba sin acceso a compradores con cuenta vieja.)
  let usuario = await buscarUsuarioPorEmail(admin, email);
  let cuentaNueva = false;
  let correoEnviado = false;

  // ————— Baja —————
  if (evento === "acceso_revocado") {
    if (!usuario) {
      await bitacora("aplicado", "no había cuenta con ese correo; nada que quitar");
      return NextResponse.json({ ok: true, evento, email, mensaje: "No hay cuenta con ese correo." });
    }
    const r = await quitarAccesoCurso(usuario.id, curso.id as string);
    if ("error" in r) {
      await bitacora("error", r.error, usuario.id);
      return NextResponse.json({ ok: false, error: "no_se_pudo_revocar" }, { status: 500 });
    }
    await notificar(usuario.id, "general", "Tu acceso a Boost Your Web terminó",
      "Si crees que es un error, escríbenos y lo revisamos.", "/app/especiales");
    await bitacora("aplicado", `acceso a «${curso.nombre}» retirado`, usuario.id);

    return NextResponse.json({
      ok: true, evento, email, curso: cursoSlug,
      mensaje: `Se retiró el acceso a ${curso.nombre} y se salió de su grupo.`,
    });
  }

  // ————— Alta —————
  if (!usuario) {
    // Cuenta nueva. La creamos con una contraseña aleatoria que nadie conoce
    // y le mandamos aparte el enlace para que ponga la suya. Antes esto usaba
    // la invitación de Supabase, que va por su SMTP y está topado a 2 correos
    // por hora: con tres compras seguidas, dos alumnas se quedaban sin cuenta.
    const aleatoria = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: aleatoria,
      email_confirm: true,
      user_metadata: { full_name: nombre || "" },
    });
    if (error || !data.user) {
      await bitacora("error", `no se pudo crear la cuenta: ${error?.message || "desconocido"}`);
      return NextResponse.json(
        { ok: false, error: "no_se_pudo_crear_cuenta", detalle: error?.message },
        { status: 500 },
      );
    }
    usuario = data.user;
    cuentaNueva = true;

    const perfil: Record<string, unknown> = { id: usuario.id, full_name: nombre || "" };
    if (telefono) perfil.whatsapp = telefono;
    await admin.from("profiles").upsert(perfil);

    // El correo se manda DESPUÉS de dar el acceso (más abajo): si se mandaba
    // antes y el acceso fallaba, la persona recibía "ya tienes el curso" sin
    // tenerlo.
  } else if (nombre || telefono) {
    // Ya existía: solo completamos lo que le falte, sin pisar lo que ya puso.
    const { data: p } = await admin
      .from("profiles").select("full_name, whatsapp").eq("id", usuario.id).maybeSingle();
    const parche: Record<string, unknown> = {};
    if (nombre && !p?.full_name) parche.full_name = nombre;
    if (telefono && !p?.whatsapp) parche.whatsapp = telefono;
    if (Object.keys(parche).length) await admin.from("profiles").update(parche).eq("id", usuario.id);
  }

  const r = await darAccesoCurso(usuario.id, curso.id as string, "checkout");
  if ("error" in r) {
    await bitacora("error", r.error, usuario.id);
    return NextResponse.json({ ok: false, error: "no_se_pudo_dar_acceso" }, { status: 500 });
  }

  // Ya tiene el curso: ahora sí se le avisa. Si el correo falla se reintenta
  // una vez (Resend limita a 2 por segundo y en una ráfaga de compras rebota).
  if (cuentaNueva) {
    correoEnviado = await enviarBienvenidaCompra(email, nombre, curso.nombre as string);
    if (!correoEnviado) {
      await new Promise((r) => setTimeout(r, 1500));
      correoEnviado = await enviarBienvenidaCompra(email, nombre, curso.nombre as string);
    }
  }

  await bitacora(
    "aplicado",
    `${cuentaNueva ? `cuenta creada (correo ${correoEnviado ? "enviado" : "no enviado"})` : "cuenta existente"} · acceso a «${curso.nombre}»`,
    usuario.id,
  );

  return NextResponse.json({
    ok: true, evento, email, curso: cursoSlug,
    cuenta: cuentaNueva ? "creada" : "existente",
    correo_enviado: cuentaNueva ? correoEnviado : null,
    mensaje: cuentaNueva
      ? correoEnviado
        ? `Cuenta creada. Le llegó un correo para poner su contraseña y ya tiene ${curso.nombre}.`
        : `Cuenta creada con ${curso.nombre}, pero no se pudo mandar el correo. Que entre con «olvidé mi contraseña».`
      : `Ya tenía cuenta. Se le sumó ${curso.nombre}.`,
  });
}

// Para comprobar de un vistazo que el endpoint está vivo y configurado.
export async function GET() {
  return NextResponse.json({
    ok: true,
    servicio: "acceso a cursos de Melsprout",
    configurado: !!process.env.ACCESO_API_TOKEN,
    eventos: EVENTOS,
    metodo: "POST con Authorization: Bearer <token>",
  });
}
