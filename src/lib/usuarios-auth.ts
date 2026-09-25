import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Las cuentas viven en auth, no en una tabla que se pueda consultar por correo.
// `listUsers` pagina de 1000 en 1000: pedir solo la primera página deja fuera a
// todo el mundo a partir de la cuenta 1001 (un comprador con cuenta vieja se
// quedaba sin su curso). Estas dos funciones recorren TODAS las páginas.

const POR_PAGINA = 1000;
const TOPE_PAGINAS = 100; // 100 000 cuentas; más que suficiente y evita un bucle infinito

type Admin = SupabaseClient;

export async function listarTodosLosUsuarios(admin: Admin): Promise<User[]> {
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

// Busca una cuenta por correo recorriendo las páginas hasta encontrarla.
export async function buscarUsuarioPorEmail(admin: Admin, email: string): Promise<User | null> {
  const buscado = email.trim().toLowerCase();
  if (!buscado) return null;
  for (let page = 1; page <= TOPE_PAGINAS; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: POR_PAGINA });
    if (error) return null;
    const lote = data?.users || [];
    const encontrado = lote.find((u) => (u.email || "").toLowerCase() === buscado);
    if (encontrado) return encontrado;
    if (lote.length < POR_PAGINA) return null;
  }
  return null;
}

// Mapa correo → cuenta, para procesos por tandas (importar CSV, reportes…).
export async function mapaPorEmail(admin: Admin): Promise<Map<string, User>> {
  const todos = await listarTodosLosUsuarios(admin);
  return new Map(todos.map((u) => [(u.email || "").toLowerCase(), u]));
}
