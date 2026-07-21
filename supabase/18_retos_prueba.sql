-- Retos iniciales de PRUEBA (aparecen en /app/retos bajo "Más retos de la semana").
-- Se pueden volver a correr sin duplicar (borra por título y reinserta).
-- El tipo de revisión (Sola / Equipo 48h) se muestra en la sección "Sobre este reto".

delete from public.retos where titulo in (
  'Tu propósito y tu meta de 90 días',
  'Optimiza tu perfil: bio, foto y nombre',
  'Graba un clip de 15-30s',
  'Publica tu primer video (reto estrella)'
);

insert into public.retos (tipo, titulo, emoji, descripcion, intro, accion, xp, orden, pasos, tips, sobre, consejo) values

-- 1) Propósito + meta 90 días  (revisión: SOLA / auto)
('semanal', 'Tu propósito y tu meta de 90 días', '🎯',
 'Clarifica tu porqué y define una meta realista que te enfoque cada día.',
 'Este reto te ayuda a conectar con tu propósito y a trazar un plan a 90 días.',
 'publicarlo', 50, 1,
 '[
   {"id":"porque","titulo":"Escribe tu porqué","subtitulo":"¿Qué te motiva a crear contenido? ¿Qué impacto quieres generar?","tipo":"textarea","placeholder":"Escribe tu porqué...","max":500,"octi":"Empecemos por lo más importante: tu porqué. Sin filtros. 💜"},
   {"id":"meta","titulo":"Define tu meta de 90 días","subtitulo":"¿Qué quieres lograr en los próximos 90 días en tus redes?","tipo":"textarea","placeholder":"Escribe tu meta...","max":500,"octi":"Ahora tu meta: que sea concreta y medible. 🎯"}
 ]'::jsonb,
 '{"titulo":"Tips para una buena meta:","items":["Sé específico","Debe ser medible","Alcanzable","Con un plazo"]}'::jsonb,
 '["Se revisa: tú misma (automático) ✅","Comparte tu porqué y tu meta con la comunidad.","Inspira a otros y recibe apoyo en tu camino."]'::jsonb,
 'Tu porqué es tu brújula; tu meta es tu mapa. La acción diaria te lleva ahí. 💜'),

-- 2) Optimiza tu perfil  (revisión: EQUIPO 48h)
('semanal', 'Optimiza tu perfil: bio, foto y nombre', '✨',
 'Deja tu bio, foto y nombre optimizados en tu red y sube la captura.',
 'Un perfil claro genera confianza y hace que te encuentren.',
 'compartir tu captura', 50, 2,
 '[
   {"id":"bio","titulo":"Tu nueva bio","subtitulo":"Qué haces + para quién + un toque tuyo.","tipo":"textarea","placeholder":"Ej: Ayudo a nuevos creadores a...","max":300,"octi":"Tu bio es tu carta de presentación: clara y con personalidad. ✨"},
   {"id":"nombre","titulo":"Tu nombre optimizado","subtitulo":"Nombre + palabra clave de tu nicho (para que te encuentren).","tipo":"texto","placeholder":"Ej: Melissa | Marketing para creadores","max":60,"octi":"Suma una palabra clave de tu nicho al nombre. 🔍"},
   {"id":"captura","titulo":"Sube la captura de tu perfil","subtitulo":"Muestra tu perfil ya optimizado (bio + foto + nombre).","tipo":"archivo","archivoImagen":true,"acepta":"image/*","ayudaArchivo":"Sube una captura de pantalla (imagen).","octi":"¡Presume tu perfil renovado! 📸"}
 ]'::jsonb,
 '{"titulo":"Tips:","items":["Bio clara","Foto que se vea bien","Nombre + nicho"]}'::jsonb,
 '["Se revisa: el equipo en 48h ⏳","Optimiza bio, foto y nombre en tu red.","Sube la captura para validarlo."]'::jsonb,
 'Un buen perfil convierte visitas en seguidores. Cuídalo. 💜'),

-- 3) Graba un clip 15-30s  (revisión: EQUIPO 48h)
('semanal', 'Graba un clip de 15-30s', '🎬',
 'Graba un clip corto aplicando encuadre, luz y audio.',
 'Practica lo técnico con un clip corto y sencillo.',
 'compartirlo', 50, 3,
 '[
   {"id":"idea","titulo":"¿Qué vas a mostrar?","subtitulo":"Describe en una frase el clip que vas a grabar.","tipo":"textarea","placeholder":"Ej: Un tip rápido sobre...","max":200,"octi":"Una idea simple y clara funciona mejor. 🎬"},
   {"id":"clip","titulo":"Sube tu clip (15-30s)","subtitulo":"Aplica encuadre, buena luz y audio claro.","tipo":"archivo","archivoImagen":false,"acepta":"video/mp4,video/quicktime","ayudaArchivo":"Video de 15 a 30 segundos (mp4).","octi":"Encuadre, luz y audio: esos 3 hacen la diferencia. ✨"}
 ]'::jsonb,
 '{"titulo":"Tips:","items":["Buena luz","Encuadre estable","Audio claro"]}'::jsonb,
 '["Se revisa: el equipo en 48h ⏳","Practica encuadre, luz y audio.","Sube tu clip para recibir feedback."]'::jsonb,
 'Hecho es mejor que perfecto. Graba y mejora sobre la marcha. 💜'),

-- 4) Primer video estructura completa  (reto ESTRELLA, revisión: EQUIPO 48h)
('semanal', 'Publica tu primer video (reto estrella)', '⭐',
 'Publica tu primer video con la estructura completa: gancho, desarrollo y cierre.',
 'El reto estrella: aplica todo lo aprendido en un video real.',
 'publicarlo', 100, 4,
 '[
   {"id":"estructura","titulo":"Tu estructura (gancho, desarrollo, cierre)","subtitulo":"Escribe tu guión con las 3 partes.","tipo":"textarea","placeholder":"Gancho: ... Desarrollo: ... Cierre: ...","max":600,"octi":"Gancho fuerte en los primeros 3 segundos. 🔥"},
   {"id":"video","titulo":"Sube tu video final","subtitulo":"Tu primer video con la estructura completa.","tipo":"archivo","archivoImagen":false,"acepta":"video/mp4,video/quicktime","ayudaArchivo":"Tu video final (mp4).","octi":"¡Este es el reto estrella! Dale con todo. ⭐"},
   {"id":"link","titulo":"Link de tu publicación","subtitulo":"Pega el enlace de tu video ya publicado.","tipo":"texto","placeholder":"https://...","max":200,"octi":"Comparte el link para que la comunidad te apoye. 💜"}
 ]'::jsonb,
 '{"titulo":"Tips:","items":["Gancho en 3s","Una sola idea","Cierre con llamada a la acción"]}'::jsonb,
 '["Se revisa: el equipo en 48h ⏳","El reto estrella: aplica todo lo aprendido.","Publica y comparte el link con la comunidad."]'::jsonb,
 'Tu primer video no será perfecto, será tu punto de partida. 🚀');

-- Verifica:
select titulo, tipo, xp, jsonb_array_length(pasos) as pasos from public.retos
where tipo = 'semanal' order by orden;
