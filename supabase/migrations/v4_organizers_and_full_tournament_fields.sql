-- =========================================
-- v4 — Organizers + tournament fields completos
-- =========================================
-- Expansión: papaque.online deja de ser "el sitio del torneo Papaque" y pasa
-- a ser plataforma para que CUALQUIER organizador LATAM cree su torneo Dota 2.
-- Este sprint NO construye el wizard de creación todavía — solo deja la tabla
-- organizers lista y los campos del torneo configurables a nivel schema.
-- El flyer Papaque #1 funciona como template de los campos editables.
--
-- También arregla el pricing: $15 USD es POR JUGADOR, $75 por equipo (5×15).
-- Renombra entry_fee_usd → entry_fee_per_team_usd y agrega
-- entry_fee_per_player_usd para UI transparente.
--
-- Idempotente.

-- -----------------------------------------
-- ORGANIZERS
-- -----------------------------------------
create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  contact_whatsapp text,
  contact_telegram text,
  contact_discord text,
  contact_email text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizers_user_idx on public.organizers (user_id);

alter table public.organizers enable row level security;

drop policy if exists "organizers_public_read" on public.organizers;
create policy "organizers_public_read" on public.organizers
  for select
  using (true);

-- -----------------------------------------
-- TOURNAMENTS — campos completos del flyer
-- -----------------------------------------
alter table public.tournaments
  add column if not exists organizer_id uuid references public.organizers(id) on delete restrict;

alter table public.tournaments
  add column if not exists description text;

alter table public.tournaments
  add column if not exists coach_required boolean not null default false;

alter table public.tournaments
  add column if not exists substitutes_allowed int not null default 0;

-- Eligibility
alter table public.tournaments
  add column if not exists mmr_min int;

alter table public.tournaments
  add column if not exists mmr_max_per_team int;

alter table public.tournaments
  add column if not exists rank_min text;

alter table public.tournaments
  add column if not exists required_immortal_per_team int not null default 0;

-- Pricing — separa per-player y per-team. El COBRO REAL va por equipo.
-- entry_fee_per_player_usd es solo display ("$15/jugador").
alter table public.tournaments
  add column if not exists entry_fee_per_player_usd numeric(10, 2) not null default 0;

alter table public.tournaments
  add column if not exists entry_fee_per_team_usd numeric(10, 2) not null default 0;

-- Backfill entry_fee_per_team_usd desde la columna vieja entry_fee_usd (v3).
update public.tournaments
  set entry_fee_per_team_usd = entry_fee_usd
  where entry_fee_per_team_usd = 0 and entry_fee_usd > 0;

-- Drop entry_fee_usd legacy (renamed effectively a entry_fee_per_team_usd).
alter table public.tournaments drop column if exists entry_fee_usd;

-- Prize pool — total + distribución como JSON.
alter table public.tournaments
  add column if not exists prize_pool_usd numeric(10, 2) not null default 0;

alter table public.tournaments
  add column if not exists prize_distribution jsonb;

-- Schedule
alter table public.tournaments
  add column if not exists schedule_notes text;

-- Rules
alter table public.tournaments
  add column if not exists servers_allowed text[];

alter table public.tournaments
  add column if not exists anti_cheat_rules text;

alter table public.tournaments
  add column if not exists refund_policy_days int not null default 1;

-- Payment methods aceptados — además de Lemon Squeezy, los organizadores LATAM
-- suelen aceptar WU / Remitly / efectivo / transferencia. UI los muestra como
-- secondary options. 'card' = Lemon Squeezy (default).
alter table public.tournaments
  add column if not exists payment_methods text[] not null default array['card']::text[];

-- updated_at trigger
alter table public.tournaments
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_tournaments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tournaments_touch_updated_at on public.tournaments;
create trigger tournaments_touch_updated_at
  before update on public.tournaments
  for each row execute function public.touch_tournaments_updated_at();

-- -----------------------------------------
-- TEAMS — coach + sustitutos (opcional, soporta el modelo de equipo del flyer)
-- -----------------------------------------
alter table public.teams
  add column if not exists coach_name text;

alter table public.teams
  add column if not exists coach_email text;

alter table public.teams
  add column if not exists payment_method text;
-- payment_method: 'card' | 'offline' | null. Cuando 'offline', el capitán
-- coordina pago via WhatsApp con el organizador y Pedritín marca paid a mano.

-- -----------------------------------------
-- SEED Pedritín como organizador + populate Papaque #1
-- -----------------------------------------
insert into public.organizers (display_name, contact_whatsapp, bio)
  select 'Pedritín', '+1 832 291 7750', 'Organizador de torneos Dota 2 LATAM. Cofundador papaque.online.'
  where not exists (select 1 from public.organizers where display_name = 'Pedritín');

-- Update Papaque #1 con todos los datos del flyer.
update public.tournaments t
  set
    organizer_id = (select id from public.organizers where display_name = 'Pedritín' limit 1),
    name = 'P''APA QUE!? — Torneo Dota 2',
    description = 'Torneo Dota 2 LATAM con prize pool USD 1000. Formato grupos + playoffs en double elimination.',
    game = 'dota2',
    format = 'groups_playoffs',
    max_teams = 16,
    team_size = 5,
    coach_required = true,
    substitutes_allowed = 2,
    mmr_max_per_team = 30000,
    rank_min = 'divine_1',
    required_immortal_per_team = 2,
    entry_fee_per_player_usd = 15,
    entry_fee_per_team_usd = 75,
    prize_pool_usd = 1000,
    prize_distribution = '{"1st": 600, "2nd": 200, "3rd": 200}'::jsonb,
    servers_allowed = array['US-East', 'US-West', 'Peru', 'Brazil'],
    schedule_notes = 'Viernes: Grupos A-B. Sábado: Grupos C-D + Quarterfinals. Domingo: Semifinals, Lower Final, Grand Final.',
    refund_policy_days = 1,
    payment_methods = array['card', 'whatsapp_alt']
  where slug = 'papaque-1';

-- -----------------------------------------
-- Constraint: tournaments.organizer_id obligatorio para torneos NUEVOS.
-- -----------------------------------------
-- No lo hacemos NOT NULL todavía porque podría haber torneos legacy sin
-- organizer. Hacemos NOT NULL una vez todos los rows tienen organizer_id.
do $$
begin
  if not exists (select 1 from public.tournaments where organizer_id is null) then
    alter table public.tournaments alter column organizer_id set not null;
  end if;
end$$;
