-- El onboarding nuevo usa nichos "Tecnología" y "Marketing", que el CHECK viejo
-- no permitía (por eso fallaba "No se pudo guardar"). Quitamos el CHECK rígido
-- para permitir cualquier nicho (los define el producto, no la BD).
alter table public.profiles drop constraint if exists profiles_nicho_check;

-- (Opcional) si prefieres validar, usa esta lista en vez del drop de arriba:
-- alter table public.profiles add constraint profiles_nicho_check
--   check (nicho in ('Moda','Salud','Belleza','Tecnología','Tech','Lifestyle','Marketing'));
