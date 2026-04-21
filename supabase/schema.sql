-- BTOT Tournament registrations
-- Run this in Supabase SQL Editor to set up the teams table

create extension if not exists "pgcrypto";

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

create index if not exists teams_created_at_idx on public.teams (created_at desc);
create index if not exists teams_province_idx on public.teams (province);
create index if not exists teams_status_idx on public.teams (status);
create unique index if not exists teams_team_name_lower_idx on public.teams (lower(team_name));

-- Newsletter subscribers (people who don't register a team but want updates)
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact text not null unique,
  contact_type text not null check (contact_type in ('whatsapp', 'telegram', 'email')),
  province text,
  utm_source text
);

-- Lock down with RLS. Writes only via service-role key from API routes.
alter table public.teams enable row level security;
alter table public.subscribers enable row level security;

-- Optional: allow anon to read aggregate counts only via a view (not the raw rows)
create or replace view public.team_stats as
  select
    count(*)::int as total_teams,
    count(distinct province)::int as provinces_represented
  from public.teams
  where status in ('pending', 'confirmed');

grant select on public.team_stats to anon, authenticated;
