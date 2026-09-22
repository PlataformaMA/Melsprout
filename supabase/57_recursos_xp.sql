-- Recompensas del cofre: un recurso con `xp` se desbloquea al llegar a ese XP.
alter table public.recursos add column if not exists xp integer;
create index if not exists recursos_xp_idx on public.recursos (xp) where xp is not null;
