-- Round-robin format (todos vs todos), BO3 cada match.
-- Aditivo: no toca nada existente.

create table if not exists public.round_robin_matches (
  id uuid primary key default gen_random_uuid(),
  team_a_id uuid not null references public.teams(id) on delete cascade,
  team_b_id uuid not null references public.teams(id) on delete cascade,
  score_a int not null default 0 check (score_a between 0 and 2),
  score_b int not null default 0 check (score_b between 0 and 2),
  winner_id uuid references public.teams(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_teams check (team_a_id <> team_b_id),
  constraint unique_pair unique (team_a_id, team_b_id)
);

create index if not exists round_robin_team_a_idx on public.round_robin_matches (team_a_id);
create index if not exists round_robin_team_b_idx on public.round_robin_matches (team_b_id);

alter table public.round_robin_matches enable row level security;
