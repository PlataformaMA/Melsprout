-- Retos por clase con pasos propios (quiz, checklist, captura…), no solo un textarea.
alter table public.cursos_clases
  add column if not exists reto_pasos jsonb,
  add column if not exists reto_revisa text,          -- 'sola' (auto) | 'equipo'
  add column if not exists reto_descripcion text;
