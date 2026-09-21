-- Los enlaces de "olvidé mi contraseña" también pasan por activaciones,
-- pero caducan (24 h); los de compra no.
alter table public.activaciones add column if not exists tipo text not null default 'activacion';
