-- =========================================
-- v2 — Security hardening
-- =========================================
-- Cierra leak de email + steam_id_64 via tabla profiles.
-- Anterior policy "profiles_public_read" permitía SELECT all cols a cualquiera.
-- Nuevo: solo self lee full profile. Resto del mundo lee VIEW filtrada.

-- 1. Drop policy ancha
drop policy if exists "profiles_public_read" on public.profiles;

-- 2. Self-read del row entero (incluye email + steam_id_64)
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- 3. View pública con SOLO columnas no sensibles.
--    security_invoker = off (default) → view bypass RLS, controlamos vía grants.
create or replace view public.public_profiles as
  select
    id,
    display_name,
    steam_persona,
    steam_avatar_url,
    mmr_estimate
  from public.profiles;

-- Acceso explícito anon + authenticated. Sin email, sin steam_id_64.
revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;
