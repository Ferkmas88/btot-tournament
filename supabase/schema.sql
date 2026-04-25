-- BTOT Tournament — schema completo
-- Idempotente: re-ejecutar es seguro.
-- Run en Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- =========================================
-- TEAMS — registro inicial del capitán
-- =========================================
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  team_name text not null,
  captain_name text not null,
  captain_steam text not null,
  captain_contact text not null,
  contact_type text not null check (contact_type in ('whatsapp', 'telegram')),
  province text not null,

  player_2 text not null,
  player_3 text not null,
  player_4 text not null,
  player_5 text not null,

  notes text,
  referral_source text,

  utm_source text,
  utm_medium text,
  utm_campaign text,

  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'withdrawn'))
);

-- join_code: código corto que el capitán comparte con sus jugadores.
alter table public.teams add column if not exists join_code text;
create unique index if not exists teams_join_code_idx on public.teams (join_code);

create index if not exists teams_created_at_idx on public.teams (created_at desc);
create index if not exists teams_province_idx on public.teams (province);
create index if not exists teams_status_idx on public.teams (status);
create unique index if not exists teams_team_name_lower_idx on public.teams (lower(team_name));

-- =========================================
-- TEAM_MEMBERS — confirmación opcional por jugador
-- =========================================
-- El capitán ya queda registrado como slot 1 en la tabla teams (captain_*).
-- Los slots 2-5 son los nicks tentativos que el capitán puso.
-- Cuando un jugador entra al link de invitación, se inserta una fila acá
-- con su Steam ID, contacto y nick definitivo (puede corregir el del capitán).
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  slot int not null check (slot between 2 and 5),

  nick text not null,
  steam_id text not null,
  contact text,
  contact_type text check (contact_type in ('whatsapp', 'telegram')),
  self_mmr int,

  confirmed_at timestamptz not null default now(),
  unique (team_id, slot)
);

create index if not exists team_members_team_idx on public.team_members (team_id);

-- =========================================
-- SUBSCRIBERS — newsletter para próximos eventos
-- =========================================
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact text not null unique,
  contact_type text not null check (contact_type in ('whatsapp', 'telegram', 'email')),
  province text,
  utm_source text
);

-- =========================================
-- RLS
-- =========================================
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.subscribers enable row level security;

-- =========================================
-- VISTAS PÚBLICAS (lectura agregada para anon)
-- =========================================
create or replace view public.team_stats as
  select
    count(*)::int as total_teams,
    count(distinct province)::int as provinces_represented
  from public.teams
  where status in ('pending', 'confirmed');

grant select on public.team_stats to anon, authenticated;
