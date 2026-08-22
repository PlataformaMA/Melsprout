-- Melsprout · Retos en comunidad: portada, fecha de inicio y recursos.
-- portada: imagen tipo poster de la tarjeta.
-- inicia_at: si es futura, el reto sale como "Proximamente" con cuenta regresiva.
-- recursos: lista [{titulo, tipo, url}] que se muestra en el detalle del reto.
alter table public.comunidad_retos
  add column if not exists portada text,
  add column if not exists inicia_at timestamptz,
  add column if not exists recursos jsonb not null default '[]'::jsonb;
