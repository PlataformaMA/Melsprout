-- Mensajes escritos en el chat.
--
-- Hasta ahora el chat solo mandaba stickers (frases hechas). Esta columna
-- guarda el texto que la persona escribe. Los stickers siguen funcionando: un
-- mensaje lleva sticker O texto.
alter table public.chat_mensajes
  add column if not exists texto text;
