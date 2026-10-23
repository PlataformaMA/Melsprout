-- El lado del CREADOR de una campaña: sus datos de cobro y envío, lo que
-- entrega, los comentarios de la marca y sus pagos.
--
-- Todo cuelga de `campania_colaboraciones`, la fila que ya nace cuando la marca
-- selecciona a alguien (migración 76). No se duplica nada: la misma fila que la
-- empresa edita en su panel es la que la creadora ve en «Campañas».

-- ————— Datos de la creadora: se piden UNA vez, no por campaña —————
-- Razón social y CLABE son para pagarle; la dirección, para mandarle el kit.
create table if not exists public.creador_datos (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  razon_social    text,
  clabe           text,
  correo          text,
  nombre_completo text,
  direccion       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ————— Lo que la campaña le promete a la creadora —————
alter table public.campania_colaboraciones
  -- "Bloom Glow Kit" y "1 post + 1 historia en Instagram": lo concreto de ESTA
  -- colaboración, que puede no ser igual para todas las seleccionadas.
  add column if not exists producto    text,
  add column if not exists entregable  text,
  add column if not exists fecha_inicio date,
  -- Compensación acordada con esta creadora (la campaña trae un rango).
  add column if not exists compensacion integer,
  add column if not exists moneda       text not null default 'MXN',
  -- activa | en_revision | completada | cancelada
  add column if not exists estado       text not null default 'activa',
  -- Las cuatro fechas del rastreador de envío. Sin fecha = paso no alcanzado.
  add column if not exists envio_preparacion date,
  add column if not exists envio_transito    date,
  add column if not exists envio_reparto     date,
  add column if not exists envio_entregado   date,
  -- Enlace de rastreo de la paquetería, si la marca lo pega.
  add column if not exists guia_url text;

-- ————— Lo que la creadora sube —————
-- Una fila por archivo entregado. `tipo`: guion | video | extra.
create table if not exists public.colaboracion_entregas (
  id              uuid primary key default gen_random_uuid(),
  colaboracion_id uuid not null
                    references public.campania_colaboraciones(id) on delete cascade,
  tipo            text not null default 'video',
  -- Ruta dentro del bucket privado `entregas`. Nunca una URL pública: el
  -- servidor firma el enlace cada vez que alguien tiene derecho a verlo.
  ruta            text not null,
  nombre          text,
  peso            bigint,
  -- pendiente | en_revision | aprobado | por_corregir
  estado          text not null default 'en_revision',
  created_at      timestamptz not null default now()
);

create index if not exists entregas_colaboracion_idx
  on public.colaboracion_entregas (colaboracion_id, created_at desc);

-- ————— La conversación sobre cada entregable —————
-- La marca pide correcciones con capturas; la creadora responde. `sobre` separa
-- el hilo del guion del hilo del video final.
create table if not exists public.colaboracion_comentarios (
  id              uuid primary key default gen_random_uuid(),
  colaboracion_id uuid not null
                    references public.campania_colaboraciones(id) on delete cascade,
  -- Quién escribe: marca | equipo | creador. El id queda por si hay que
  -- auditar, pero el nombre que se muestra sale del tipo.
  autor_tipo      text not null default 'marca',
  autor_id        uuid references auth.users(id) on delete set null,
  sobre           text not null default 'video',
  texto           text,
  -- [{ ruta, nombre }] — capturas con las correcciones marcadas.
  adjuntos        jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists comentarios_colaboracion_idx
  on public.colaboracion_comentarios (colaboracion_id, created_at);

-- ————— Los pagos, uno por fila —————
-- La migración 76 guardaba pago1/pago2 en columnas. El diseño muestra "Pago 1,
-- 2, 3…" con su propio tipo, monto y fecha, así que se vuelven filas. Las
-- columnas viejas se quedan donde están: el panel de la empresa aún las usa.
create table if not exists public.colaboracion_pagos (
  id              uuid primary key default gen_random_uuid(),
  colaboracion_id uuid not null
                    references public.campania_colaboraciones(id) on delete cascade,
  numero          integer not null default 1,
  -- economico | intercambio | afiliados
  tipo            text not null default 'economico',
  monto           integer,
  -- Para intercambio: "1 paquete de café". Si viene, se muestra en vez del monto.
  valor           text,
  moneda          text not null default 'MXN',
  fecha_estimada  date,
  -- pendiente | en_proceso | pagado | entregado
  estado          text not null default 'pendiente',
  created_at      timestamptz not null default now(),
  unique (colaboracion_id, numero)
);

create index if not exists pagos_colaboracion_idx
  on public.colaboracion_pagos (colaboracion_id, numero);

-- ————— Bucket privado para las entregas —————
-- Privado a propósito: el video de una campaña no se publica hasta que la marca
-- lo aprueba, y aun así solo lo abren quienes participan. Todo sube y baja por
-- el servidor con enlaces firmados.
-- 500 MB por archivo, que es el tope que anuncia la pantalla. Sin esta línea
-- el bucket hereda el límite global del proyecto y un video largo se rechaza
-- con un error que no dice nada.
insert into storage.buckets (id, name, public, file_size_limit)
values ('entregas', 'entregas', false, 524288000)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

alter table public.creador_datos enable row level security;
alter table public.colaboracion_entregas enable row level security;
alter table public.colaboracion_comentarios enable row level security;
alter table public.colaboracion_pagos enable row level security;

-- El diseño muestra la audiencia como un rango ("10K – 500K"). La 75 solo
-- guardaba el mínimo.
alter table public.campanias
  add column if not exists seguidores_max integer;
