-- La bandeja del equipo con las marcas.
--
-- Hasta hoy una empresa solo podía escribirle al equipo por WhatsApp. Eso
-- funciona para una empresa; con veinte, nadie se acuerda de qué se acordó
-- con quién. Esto deja la conversación junto a la marca de la que se habla.
--
-- Es un hilo por marca, no por tema: así se lee como un chat y no hay que
-- decidir en cuál de tres conversaciones va cada cosa.

create table if not exists public.marca_mensajes (
  id          uuid primary key default gen_random_uuid(),
  marca_id    uuid not null references public.marcas(id) on delete cascade,
  -- Quién escribe: 'marca' o 'equipo'.
  autor_tipo  text not null default 'equipo',
  autor_id    uuid references auth.users(id) on delete set null,
  texto       text,
  -- [{ ruta, nombre, peso }]
  adjuntos    jsonb not null default '[]'::jsonb,
  -- Una creadora compartida dentro del mensaje, como en el diseño.
  creador_id  uuid references auth.users(id) on delete set null,
  -- Leído por el otro lado. Dos banderas porque cada lado lee por su cuenta.
  leido_equipo boolean not null default false,
  leido_marca  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists marca_mensajes_hilo_idx
  on public.marca_mensajes (marca_id, created_at);

-- Para contar sin leer todo el hilo.
create index if not exists marca_mensajes_sin_leer_idx
  on public.marca_mensajes (marca_id) where not leido_equipo;

-- Solo el servidor entra: las pantallas pasan por las funciones del panel,
-- que ya revisan si quien pregunta es el equipo o la dueña de la marca.
alter table public.marca_mensajes enable row level security;

-- Adjuntos de la conversación. Privado: aquí se cuelan briefs y cotizaciones.
insert into storage.buckets (id, name, public, file_size_limit)
values ('mensajes', 'mensajes', false, 10485760)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;
