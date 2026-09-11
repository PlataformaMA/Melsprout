-- Cuándo entró por primera vez al curso después de recibir el acceso.
-- Mientras esté vacío, al entrar a la plataforma se le manda directo al curso.
alter table public.curso_accesos add column if not exists entrada_at timestamptz;
