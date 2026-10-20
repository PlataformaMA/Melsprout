-- Calificación de la marca (0 a 5), la que sale con la estrellita en su
-- tarjeta del Marketplace. La pone el equipo; no se calcula sola.
alter table public.marcas
  add column if not exists calificacion numeric(2,1);
