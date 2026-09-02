-- Datos que el equipo lleva de cada alumna desde el panel.
alter table public.profiles
  add column if not exists notas_equipo text,
  add column if not exists renovacion   boolean;
