-- =========================================
-- v3 — Tournaments table + ticket-unico payment scaffolding
-- =========================================
-- Hasta v2 todo el código asumía UN solo torneo (Papaque #1).
-- Esta migración introduce la tabla `tournaments` y agrega FKs en las tablas
-- existentes para que el sistema soporte múltiples torneos en paralelo.
-- También deja columnas `payment_*` en `teams` para el flow ticket-único con
-- Lemon Squeezy. Mientras `tournaments.entry_fee_usd = 0`, payment es no-op
-- (registros gratis siguen funcionando como hoy).
-- Idempotente: re-ejecutar es seguro.

-- -----------------------------------------
-- TOURNAMENTS
-- -----------------------------------------
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  game text not null default 'dota2',
  format text not null default 'double_elim'
    check (format in ('single_elim', 'double_elim', 'round_robin')),
  max_teams int not null default 16,
  team_size int not null default 5,
  entry_fee_usd numeric(10, 2) not null default 0,
  prize_pool_pct numeric(3, 2) not null default 0.50,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'live', 'closed')),
  starts_at timestamptz,
  registration_closes_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tournaments_status_idx on public.tournaments (status);
create index if not exists tournaments_starts_at_idx on public.tournaments (starts_at desc);

-- -----------------------------------------
-- TEAMS — añadir tournament_id + payment_*
-- -----------------------------------------
alter table public.teams
  add column if not exists tournament_id uuid references public.tournaments(id) on delete cascade;

alter table public.teams
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded', 'free'));

alter table public.teams
  add column if not exists payment_provider text;

alter table public.teams
  add column if not exists payment_ref text;

alter table public.teams
  add column if not exists payment_amount_usd numeric(10, 2);

alter table public.teams
  add column if not exists paid_at timestamptz;

create index if not exists teams_tournament_idx
  on public.teams (tournament_id, created_at desc);

create index if not exists teams_payment_status_idx
  on public.teams (payment_status);

-- payment_ref único por proveedor cuando esté seteado.
create unique index if not exists teams_payment_ref_idx
  on public.teams (payment_provider, payment_ref)
  where payment_ref is not null;

-- -----------------------------------------
-- MATCHES (bracket) — añadir tournament_id
-- -----------------------------------------
alter table public.matches
  add column if not exists tournament_id uuid references public.tournaments(id) on delete cascade;

create index if not exists matches_tournament_idx
  on public.matches (tournament_id);

-- Drop old slot UNIQUE (slot solo no puede ser único con múltiples torneos).
-- El constraint anterior es del CREATE TABLE inline, así que el name lo asigna
-- Postgres: `matches_slot_key`. Drop si existe.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'matches_slot_key' and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches drop constraint matches_slot_key;
  end if;
end$$;

create unique index if not exists matches_tournament_slot_idx
  on public.matches (tournament_id, slot);

-- -----------------------------------------
-- ROUND_ROBIN_MATCHES — añadir tournament_id
-- -----------------------------------------
-- El unique_pair viejo (team_a_id, team_b_id) ya no aplica cuando hay múltiples
-- torneos: el mismo par puede jugar dos torneos distintos.
alter table public.round_robin_matches
  add column if not exists tournament_id uuid references public.tournaments(id) on delete cascade;

create index if not exists round_robin_tournament_idx
  on public.round_robin_matches (tournament_id);

-- Drop unique_pair viejo si existe y reemplazar por (tournament_id, team_a_id, team_b_id).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'unique_pair' and conrelid = 'public.round_robin_matches'::regclass
  ) then
    alter table public.round_robin_matches drop constraint unique_pair;
  end if;
end$$;

create unique index if not exists round_robin_unique_pair_per_tournament
  on public.round_robin_matches (tournament_id, team_a_id, team_b_id);

-- -----------------------------------------
-- CHAT_MESSAGES — añadir tournament_id (nullable: mensajes globales del sitio
-- siguen siendo cross-tournament). Cuando se setea, scope = lobby del torneo.
-- -----------------------------------------
alter table public.chat_messages
  add column if not exists tournament_id uuid references public.tournaments(id) on delete cascade;

create index if not exists chat_messages_tournament_idx
  on public.chat_messages (tournament_id, created_at desc);

-- -----------------------------------------
-- SEED + BACKFILL — Papaque #1 (el torneo actual)
-- -----------------------------------------
-- Inserta el torneo Papaque histórico SOLO si no existe ya. Después backfillea
-- todas las filas existentes que no tengan tournament_id.
insert into public.tournaments
  (slug, name, game, format, max_teams, team_size, entry_fee_usd, prize_pool_pct, status)
values
  ('papaque-1', 'Papaque #1', 'dota2', 'round_robin', 6, 5, 0, 0.50, 'closed')
on conflict (slug) do nothing;

-- Backfill teams sin tournament_id → Papaque #1.
update public.teams
  set tournament_id = (select id from public.tournaments where slug = 'papaque-1'),
      payment_status = 'free'
  where tournament_id is null;

-- Backfill matches sin tournament_id.
update public.matches
  set tournament_id = (select id from public.tournaments where slug = 'papaque-1')
  where tournament_id is null;

-- Backfill round_robin_matches.
update public.round_robin_matches
  set tournament_id = (select id from public.tournaments where slug = 'papaque-1')
  where tournament_id is null;

-- Backfill chat_messages: solo los mensajes de tipo 'team' (los globales quedan null).
update public.chat_messages
  set tournament_id = (select id from public.tournaments where slug = 'papaque-1')
  where tournament_id is null and channel_type = 'team';

-- -----------------------------------------
-- RLS
-- -----------------------------------------
alter table public.tournaments enable row level security;

-- Lectura pública de torneos abiertos / vivos / cerrados. Drafts quedan ocultos.
drop policy if exists "tournaments_public_read" on public.tournaments;
create policy "tournaments_public_read" on public.tournaments
  for select
  using (status in ('open', 'live', 'closed'));

-- Sólo service role puede insertar / editar / eliminar. (Sin policies p/ otros
-- roles → bloqueado por default tras RLS enable.)

-- -----------------------------------------
-- VIEW conveniente: el torneo "activo" (open o live, más reciente).
-- -----------------------------------------
create or replace view public.active_tournament as
  select *
  from public.tournaments
  where status in ('open', 'live')
  order by starts_at desc nulls last, created_at desc
  limit 1;

revoke all on public.active_tournament from public;
grant select on public.active_tournament to anon, authenticated;
