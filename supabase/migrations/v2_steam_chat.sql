-- =========================================
-- v2 — Steam OpenID + Cuentas + Chat
-- =========================================
-- Aditivo: solo agrega tablas + columnas nullable.
-- Compatible con v1 en producción (papaque.online).
-- Correr una sola vez en Supabase SQL Editor del MISMO proyecto.

-- -----------------------------------------
-- PROFILES — perfil público linkeado a auth.users
-- -----------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  steam_id_64 text unique,
  steam_persona text,
  steam_avatar_url text,
  mmr_estimate int,
  mmr_self_reported int,
  mmr_cached_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_steam_idx on public.profiles (steam_id_64);

-- Trigger: cuando se crea un auth.users, crear row en profiles automaticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------
-- LINK auth.users con teams + team_members (nullable, no rompe v1)
-- -----------------------------------------
alter table public.team_members
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.teams
  add column if not exists captain_user_id uuid references auth.users(id) on delete set null;

create index if not exists team_members_user_idx on public.team_members (user_id);
create index if not exists teams_captain_user_idx on public.teams (captain_user_id);

-- -----------------------------------------
-- CHAT MESSAGES — global + por equipo
-- -----------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_type text not null check (channel_type in ('global', 'team')),
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  -- Constraint: si channel_type=team, team_id requerido. Si global, team_id null.
  constraint chat_team_consistency check (
    (channel_type = 'team' and team_id is not null)
    or (channel_type = 'global' and team_id is null)
  )
);

create index if not exists chat_messages_team_idx on public.chat_messages (team_id, created_at desc);
create index if not exists chat_messages_global_idx on public.chat_messages (channel_type, created_at desc) where channel_type = 'global';

-- -----------------------------------------
-- RLS POLICIES
-- -----------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_write" on public.profiles;
create policy "profiles_self_write" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles
  for select
  using (true);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_global_read" on public.chat_messages;
create policy "chat_global_read" on public.chat_messages
  for select
  using (channel_type = 'global' and auth.uid() is not null);

drop policy if exists "chat_team_read" on public.chat_messages;
create policy "chat_team_read" on public.chat_messages
  for select
  using (
    channel_type = 'team'
    and team_id in (
      select team_id from public.team_members where user_id = auth.uid()
      union
      select id from public.teams where captain_user_id = auth.uid()
    )
  );

drop policy if exists "chat_insert_self" on public.chat_messages;
create policy "chat_insert_self" on public.chat_messages
  for insert
  with check (
    auth.uid() = user_id
    and (
      channel_type = 'global'
      or team_id in (
        select team_id from public.team_members where user_id = auth.uid()
        union
        select id from public.teams where captain_user_id = auth.uid()
      )
    )
  );

-- -----------------------------------------
-- REALTIME — habilitar broadcast de chat_messages
-- -----------------------------------------
-- Nota: Supabase Realtime puede requerir agregar la tabla a la publication.
-- Si la siguiente linea falla, ya estaba agregada.
alter publication supabase_realtime add table public.chat_messages;
