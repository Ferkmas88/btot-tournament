-- =========================================
-- v5 — Organizer auth (Supabase) + RLS para organizer self-CRUD
-- =========================================
-- Fase 2: cualquier organizador puede crearse cuenta, loguear, crear sus
-- torneos. Esta migración:
-- 1. Garantiza que organizers.user_id es único (1 organizer por user).
-- 2. Habilita RLS para que un organizer lea/escriba SOLO sus propios datos.
-- 3. Habilita RLS para que un organizer cree/edite/borre SOLO sus torneos.
-- 4. Mantiene profiles_public_read y subscribers_*  como v2/v3.
--
-- Idempotente.

-- -----------------------------------------
-- organizers.user_id — único (1 organizer por user)
-- -----------------------------------------
create unique index if not exists organizers_user_id_unique
  on public.organizers (user_id)
  where user_id is not null;

-- updated_at trigger
create or replace function public.touch_organizers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists organizers_touch_updated_at on public.organizers;
create trigger organizers_touch_updated_at
  before update on public.organizers
  for each row execute function public.touch_organizers_updated_at();

-- -----------------------------------------
-- organizers — RLS policies
-- -----------------------------------------
-- Lectura pública ya existe (v4 'organizers_public_read'). Solo agregamos
-- write-self.
drop policy if exists "organizers_self_write" on public.organizers;
create policy "organizers_self_write" on public.organizers
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------
-- tournaments — RLS policies organizer-aware
-- -----------------------------------------
-- v3 dejó `tournaments_public_read` (status in 'open'/'live'/'closed').
-- Ahora agregamos:
--   - organizer puede VER sus drafts (además del read público que solo
--     muestra open/live/closed).
--   - organizer puede INSERT/UPDATE/DELETE solo sus torneos.

drop policy if exists "tournaments_organizer_read_own" on public.tournaments;
create policy "tournaments_organizer_read_own" on public.tournaments
  for select
  to authenticated
  using (
    organizer_id in (
      select id from public.organizers where user_id = auth.uid()
    )
  );

drop policy if exists "tournaments_organizer_write_own" on public.tournaments;
create policy "tournaments_organizer_write_own" on public.tournaments
  for insert
  to authenticated
  with check (
    organizer_id in (
      select id from public.organizers where user_id = auth.uid()
    )
  );

drop policy if exists "tournaments_organizer_update_own" on public.tournaments;
create policy "tournaments_organizer_update_own" on public.tournaments
  for update
  to authenticated
  using (
    organizer_id in (
      select id from public.organizers where user_id = auth.uid()
    )
  )
  with check (
    organizer_id in (
      select id from public.organizers where user_id = auth.uid()
    )
  );

drop policy if exists "tournaments_organizer_delete_own" on public.tournaments;
create policy "tournaments_organizer_delete_own" on public.tournaments
  for delete
  to authenticated
  using (
    organizer_id in (
      select id from public.organizers where user_id = auth.uid()
    )
  );

-- -----------------------------------------
-- teams — organizer puede ver/editar teams DE SUS torneos (para admin futuro)
-- -----------------------------------------
drop policy if exists "teams_organizer_read_own" on public.teams;
create policy "teams_organizer_read_own" on public.teams
  for select
  to authenticated
  using (
    tournament_id in (
      select t.id from public.tournaments t
      join public.organizers o on o.id = t.organizer_id
      where o.user_id = auth.uid()
    )
  );

drop policy if exists "teams_organizer_update_own" on public.teams;
create policy "teams_organizer_update_own" on public.teams
  for update
  to authenticated
  using (
    tournament_id in (
      select t.id from public.tournaments t
      join public.organizers o on o.id = t.organizer_id
      where o.user_id = auth.uid()
    )
  )
  with check (
    tournament_id in (
      select t.id from public.tournaments t
      join public.organizers o on o.id = t.organizer_id
      where o.user_id = auth.uid()
    )
  );

-- =========================================
-- featured_tournament — fallback para /inscribirse
-- =========================================
-- v3 ya tiene la view active_tournament (open OR live). Agregamos
-- featured_tournament que combina active OR (último closed si nada abierto).
-- Esto permite que /inscribirse siempre apunte a algún torneo.
create or replace view public.featured_tournament as
  select * from (
    (select * from public.tournaments where status in ('open','live')
      order by starts_at desc nulls last, created_at desc limit 1)
    union all
    (select * from public.tournaments where status = 'closed'
      order by starts_at desc nulls last, created_at desc limit 1)
  ) sub
  limit 1;

revoke all on public.featured_tournament from public;
grant select on public.featured_tournament to anon, authenticated;
