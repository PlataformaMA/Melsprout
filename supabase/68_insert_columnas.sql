-- P2-40: las políticas de insert solo miraban "el autor eres tú", así que desde
-- el navegador se podía publicar ya "aprobado", con `oculto=false` forzado, en
-- un grupo privado o atribuido a otro reto. Se limita por columnas: lo demás lo
-- pone el servidor.
revoke insert on public.foros_posts from authenticated;
grant insert (autor_id, categoria, titulo, texto, imagen_url, video_url, enlace_url, grupo_id) on public.foros_posts to authenticated;

revoke insert on public.foros_respuestas from authenticated;
grant insert (post_id, autor_id, texto) on public.foros_respuestas to authenticated;

revoke insert on public.comunidad_reto_posts from authenticated;
grant insert (reto_id, user_id, dia, texto, media_url) on public.comunidad_reto_posts to authenticated;

-- Editar lo propio: solo el texto y sus adjuntos (no el estado ni la moderación).
revoke update on public.foros_posts from authenticated;
grant update (titulo, texto, imagen_url, video_url, enlace_url, editado_at) on public.foros_posts to authenticated;
revoke update on public.foros_respuestas from authenticated;
grant update (texto, editado_at) on public.foros_respuestas to authenticated;
