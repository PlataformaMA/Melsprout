-- Melsprout · Subtitulos automaticos de las clases.
-- El .vtt se genera con AssemblyAI y se guarda en Storage; aqui solo va la URL
-- y el id del trabajo (para poder consultarlo si tarda en terminar).
alter table public.cursos_clases
  add column if not exists subtitulos_url text,
  add column if not exists subtitulos_job text;
