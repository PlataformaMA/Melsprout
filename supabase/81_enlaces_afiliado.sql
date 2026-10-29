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

alter table public.campania_enlaces enable row level security;

-- Sumar un clic sin leer-escribir desde la app: así dos clics al mismo tiempo
-- no se pisan y se pierde la cuenta.
create or replace function public.sumar_clic(p_codigo text)
returns table (destino text)
language sql
security definer
set search_path = public
as $$
  update public.campania_enlaces e
     set clics = e.clics + 1,
         ultimo_clic = now()
   where e.codigo = p_codigo
  returning coalesce(
    (select c.enlace_destino from public.campanias c where c.id = e.campania_id),
    (select m.checkout_url from public.cursos_modulos m
      where m.id = (select c.requiere_curso from public.campanias c where c.id = e.campania_id))
  );
$$;

-- Sumar una venta cuando el webhook de compras la reporte con el código.
create or replace function public.sumar_venta(p_codigo text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.campania_enlaces
     set ventas = ventas + 1
   where codigo = p_codigo;
$$;
