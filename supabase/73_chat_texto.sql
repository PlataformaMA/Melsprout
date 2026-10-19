-- Mensajes escritos en el chat.
--
-- Hasta ahora el chat solo mandaba stickers (frases hechas). Esta columna
-- guarda el texto que la persona escribe. Los stickers siguen funcionando:
-- en un mensaje escrito la columna `sticker` va vacía (es obligatoria desde
-- que el chat solo mandaba stickers, y se dejó así para no migrar lo viejo).
alter table public.chat_mensajes
  add column if not exists texto text;
