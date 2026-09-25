-- Índices que faltaban: sin ellos, cada consulta recorre la tabla entera.
create index if not exists foros_respuestas_post_idx on public.foros_respuestas (post_id, created_at);
create index if not exists profiles_xp_idx on public.profiles (xp desc);
create index if not exists reto_submissions_estado_idx on public.reto_submissions (estado, revision, updated_at desc);
create index if not exists clase_progreso_user_idx on public.clase_progreso (user_id, completada);
create index if not exists curso_accesos_modulo_idx on public.curso_accesos (modulo_id);
create index if not exists foros_likes_post_idx on public.foros_likes (post_id);
create index if not exists grupo_miembros_grupo_idx on public.grupo_miembros (grupo_id);
create index if not exists notificaciones_user_idx on public.notificaciones (user_id, leida, created_at desc);
create index if not exists chat_mensajes_par_idx on public.chat_mensajes (de_id, para_id, created_at desc);
