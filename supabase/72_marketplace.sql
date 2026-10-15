-- Marketplace: marcas, campañas y aplicaciones.
--
-- Las marcas publican campañas; las alumnas aplican con un mensaje y un enlace
-- a su contenido. El equipo da de alta todo desde el panel y revisa quién
-- aplicó. Nada de esto se ve sin Boost Pro.

create table if not exists public.marcas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  lema        text,                       -- "Aventuras que vale la pena compartir"
  categoria   text,                       -- Viajes, Belleza, Moda…
  logo_url    text,
  destacada   boolean not null default false,
  activa      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.campanias (
  id              uuid primary key default gen_random_uuid(),
  marca_id        uuid not null references public.marcas(id) on delete cascade,
  titulo          text not null,
  descripcion     text,
  imagen_url      text,
  -- Rango de pago. Se guarda en centavos para no pelear con los decimales.
  pago_min        integer,
  pago_max        integer,
  moneda          text not null default 'USD',
  etiquetas       text[] not null default '{}',   -- UGC, Post patrocinado, Embajador…
  plataformas     text[] not null default '{}',   -- Instagram, TikTok, YouTube…
  categoria       text,
  -- Nivel de XP mínimo para poder aplicar. 0 = abierta para cualquiera.
  -- Es lo que en el diseño sale como "🔒 Nivel Booster".
  nivel_minimo    integer not null default 0,
  popular         boolean not null default false,
  cierra_at       timestamptz,
  activa          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.campania_aplicaciones (
  id            uuid primary key default gen_random_uuid(),
  campania_id   uuid not null references public.campanias(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  mensaje       text,
  enlace        text,
  -- enviada → el equipo la revisa; aceptada → la alumna entra a la campaña.
  estado        text not null default 'enviada',
  nota_equipo   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (campania_id, user_id)            -- una aplicación por persona
);

create index if not exists campanias_marca_idx on public.campanias (marca_id);
create index if not exists campanias_activa_idx on public.campanias (activa, created_at desc);
create index if not exists aplicaciones_user_idx on public.campania_aplicaciones (user_id);
create index if not exists aplicaciones_campania_idx on public.campania_aplicaciones (campania_id);

-- Todo pasa por el servidor con la llave de servicio (igual que el resto de la
-- plataforma): se cierra el acceso directo desde el navegador.
alter table public.marcas enable row level security;
alter table public.campanias enable row level security;
alter table public.campania_aplicaciones enable row level security;
