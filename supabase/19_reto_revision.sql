-- Tipo de revisión del reto: 'sola' = se auto-publica en la comunidad,
-- 'equipo' = lo revisa el equipo (48h). Por defecto 'equipo'.
alter table public.retos
  add column if not exists revisa text not null default 'equipo'
  check (revisa in ('sola','equipo'));

-- Comentario del equipo al rechazar (o aprobar) un envío.
alter table public.reto_submissions
  add column if not exists revision_comentario text;

-- Los retos de prueba: 'Tu propósito y tu meta de 90 días' es auto (Sola);
-- los demás quedan en 'equipo' (revisión 48h) por defecto.
update public.retos set revisa = 'sola'
  where titulo = 'Tu propósito y tu meta de 90 días';

select titulo, tipo, revisa from public.retos where tipo = 'semanal' order by orden;
