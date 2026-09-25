import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Las cuentas viven en `auth.users`, que la API no deja consultar por correo.
// La forma barata de preguntar "¿quién tiene este correo?" es una función SQL
// (ver supabase/60_usuarios_por_correo.sql): una búsqueda indexada, instantánea
// por muchas cuentas que haya. Listar páginas de 1000 queda solo como respaldo
// por si la función no estuviera instalada; pedir solo la primera página —como
// se hacía antes— dejaba sin acceso a cualquiera a partir de la cuenta 1001.

const POR_PAGINA = 1000;
const TOPE_PAGINAS = 100;

type Admin = SupabaseClient;

async function porPaginas(admin: Admin): Promise<User[]> {
  const todos: User[] = [];
  for (let page = 1; page <= TOPE_PAGINAS; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: POR_PAGINA });
    if (error) break;
    const lote = data?.users || [];
    todos.push(...lote);
    if (lote.length < POR_PAGINA) break;
  }
  return todos;
}

// Busca una cuenta por correo. Devuelve el usuario completo (con sus
// proveedores de acceso), que es lo que necesita quien llama.
export async function buscarUsuarioPorEmail(admin: Admin, email: string): Promise<User | null> {
  const buscado = email.trim().toLowerCase();
  if (!buscado) return null;

  const { data: id, error } = await admin.rpc("usuario_por_correo", { p_email: buscado });
  if (!error) {
    if (!id) return null;
    const { data } = await admin.auth.admin.getUserById(id as string);
    return data?.user ?? null;
  }

  // Respaldo: recorrer páginas hasta encontrarlo.
  for (let page = 1; page <= TOPE_PAGINAS; page++) {
    const { data, error: e } = await admin.auth.admin.listUsers({ page, perPage: POR_PAGINA });
    if (e) return null;
    const lote = data?.users || [];
    const encontrado = lote.find((u) => (u.email || "").toLowerCase() === buscado);
    if (encontrado) return encontrado;
    if (lote.length < POR_PAGINA) return null;
  }
  return null;
}

// Solo id + correo de todas las cuentas (para pintar tablas y reportes).
export async function correosDeUsuarios(admin: Admin): Promise<Map<string, string>> {
  const { data, error } = await admin.rpc("correos_de_usuarios");
  if (!error && Array.isArray(data)) {
    return new Map((data as { id: string; email: string | null }[]).map((u) => [u.id, u.email ?? ""]));
  }
  return new Map((await porPaginas(admin)).map((u) => [u.id, u.email ?? ""]));
}

// Todas las cuentas con sus datos completos (lista de usuarios del panel).
export async function listarTodosLosUsuarios(admin: Admin): Promise<User[]> {
  return porPaginas(admin);
}

// Mapa correo → cuenta, para procesos por tandas (importar CSV).
export async function mapaPorEmail(admin: Admin): Promise<Map<string, User>> {
  return new Map((await porPaginas(admin)).map((u) => [(u.email || "").toLowerCase(), u]));
}
