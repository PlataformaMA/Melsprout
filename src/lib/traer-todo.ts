import "server-only";

// Supabase corta cualquier consulta en 1000 filas SIN avisar. Con eso, quien
// quedaba fuera del corte veía "Unirse" en un grupo donde ya estaba, progreso
// 0/7, o no recibía el aviso masivo. Esta función pide de 1000 en 1000 hasta
// que ya no vengan más.
//
//   const filas = await traerTodo((d, h) =>
//     admin.from("grupo_miembros").select("grupo_id, user_id").range(d, h));

const TAM = 1000;
const TOPE = 200; // 200 000 filas; evita un bucle infinito si algo va mal

export async function traerTodo<T>(
  hacer: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const todo: T[] = [];
  for (let i = 0; i < TOPE; i++) {
    const desde = i * TAM;
    const { data, error } = await hacer(desde, desde + TAM - 1);
    if (error) break;
    const lote = (data || []) as T[];
    todo.push(...lote);
    if (lote.length < TAM) break;
  }
  return todo;
}
