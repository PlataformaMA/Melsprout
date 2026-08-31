-- Detalles de la landing que el diseño pide y no teníamos.
alter table public.cursos_modulos
  add column if not exists instructores  jsonb default '[]'::jsonb,  -- [{nombre, foto}]
  add column if not exists horas_semana  int,
  add column if not exists inscritos     int;                        -- si se deja vacío, se usa el real
