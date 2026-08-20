-- Melsprout · Clases "Proximamente" y niveles del curriculum.
-- proximamente: la clase se ve en la ruta pero todavia no esta grabada. NO entra
-- en la secuencia: si entrara, frenaria a todos los alumnos al llegar a ella.
alter table public.cursos_clases
  add column if not exists proximamente boolean not null default false;

-- nivel: agrupa los modulos (Starter / Creator / Booster).
alter table public.cursos_modulos
  add column if not exists nivel text;
