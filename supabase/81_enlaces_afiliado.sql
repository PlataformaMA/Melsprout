-- Los enlaces de embajador.
--
-- Cada persona seleccionada en una campaña de afiliados recibe SU enlace. No
-- es el checkout pelón: es un enlace nuestro, corto, que cuenta el clic y de
-- ahí manda al checkout con el código pegado. Así sabemos cuánto movió cada
-- quien aunque la venta se cierre en Hotmart.

create table if not exists public.campania_enlaces (
  id          uuid primary key default gen_random_uuid(),
  campania_id uuid not null references public.campanias(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- Lo que va en la URL: melsprout.boostacademy.io/r/<codigo>
  codigo      text not null unique,
  clics       integer not null default 0,
  ventas      integer not null default 0,
  ultimo_clic timestamptz,
  created_at  timestamptz not null default now(),
  -- Un solo enlace por persona y campaña.
  unique (campania_id, user_id)
);

create index if not exists campania_enlaces_campania_idx
  on public.campania_enlaces (campania_id);

-- A dónde manda el enlace. Si está vacío se usa el checkout del curso que la
-- campaña pide, que es lo normal; esta columna es para apuntar a otro lado
-- (una landing, una oferta distinta) sin tocar código.
alter table public.campanias
  add column if not exists enlace_destino text;

-- Solo el servidor entra aquí: las pantallas pasan por las funciones del
-- panel, que ya revisan quién es quien pregunta.
alter table public.campania_enlaces enable row level security;

-- OJO con el delimitador: tiene que ser ASCII ($fn$). Con uno acentuado,
-- el editor de Supabase no lo reconoce, parte el cuerpo en el primer ; y la
-- función nunca se crea (pasó el 29-oct).
--
-- Sumar el clic y decir a dónde ir, de una sola vez. Va en la base y no en la
-- app porque si se leyera y luego se escribiera, dos clics al mismo tiempo
-- contarían como uno.
create or replace function public.sumar_clic(p_codigo text)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_campania uuid;
  v_destino  text;
begin
  update public.campania_enlaces
     set clics = clics + 1,
         ultimo_clic = now()
   where codigo = p_codigo
  returning campania_id into v_campania;

  -- Código que no existe: no hay a dónde mandar.
  if v_campania is null then
    return null;
  end if;

  select coalesce(c.enlace_destino, m.checkout_url)
    into v_destino
    from public.campanias c
    left join public.cursos_modulos m on m.id = c.requiere_curso
   where c.id = v_campania;

  return v_destino;
end;
$fn$;

-- Sumar una venta cuando el webhook de compras la reporte con el código.
create or replace function public.sumar_venta(p_codigo text)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_total integer;
begin
  update public.campania_enlaces
     set ventas = ventas + 1
   where codigo = p_codigo
  returning ventas into v_total;

  return v_total;   -- null si el código no existe
end;
$fn$;

-- Que PostgREST se entere de las tablas y funciones nuevas sin esperar.
notify pgrst, 'reload schema';

-- ── Comprobación: esto tiene que devolver 4 renglones ──
select 'tabla campania_enlaces' as parte,
       to_regclass('public.campania_enlaces') is not null as existe
union all
select 'columna campanias.enlace_destino',
       exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'campanias'
                  and column_name = 'enlace_destino')
union all
select 'función sumar_clic',  to_regproc('public.sumar_clic(text)')  is not null
union all
select 'función sumar_venta', to_regproc('public.sumar_venta(text)') is not null;
