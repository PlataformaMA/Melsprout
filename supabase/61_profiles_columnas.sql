-- La política RLS de `profiles` solo decía "tu fila es tuya", y eso incluía
-- columnas que NO son del usuario: is_admin (volverse admin), xp, gemas, racha,
-- email_verificado, onboarding_completo, notas_equipo, renovacion.
-- RLS no distingue columnas: se limita con GRANT.
revoke update on public.profiles from authenticated;
grant update (
  full_name, avatar_url, cover_url, headline, bio,
  ciudad, pais, estado, fecha_nacimiento,
  whatsapp, whatsapp_optin,
  nicho, objetivo, plataforma_principal, tamano_audiencia,
  redes, especialidades, abierto_colab, username, genero,
  experiencia, tiempo_semanal, habilidades, como_conocio, canal_origen,
  updated_at
) on public.profiles to authenticated;

-- Insert: solo su propia fila (la crea el trigger de alta, pero por si acaso).
revoke insert on public.profiles from authenticated;
grant insert (id, full_name, avatar_url) on public.profiles to authenticated;

-- Lo demás (xp, gemas, racha, is_admin, notas del equipo…) solo lo escribe el
-- servidor con la llave de servicio, que se salta RLS.
