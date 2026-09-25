-- Se guarda el id de InsightIQ: sin esto, cada carga de /app/perfil recorría
-- TODOS los usuarios de InsightIQ (hasta 50 llamadas seguidas) para encontrarlo.
alter table public.profiles add column if not exists insightiq_user_id text;
