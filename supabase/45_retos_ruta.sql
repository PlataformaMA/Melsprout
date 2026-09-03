-- Cada clase lleva su reto; estos campos son los que el panel edita.
alter table public.cursos_clases
  add column if not exists reto_tipo    text,          -- Tarea | Entrega | Reto | Proyecto | Análisis
  add column if not exists reto_xp      int default 50,
  add column if not exists reto_activo  boolean default true;
