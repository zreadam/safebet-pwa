-- ============================================================
-- team_logos — Store club/team logos from API-Football
-- ============================================================

create table if not exists team_logos (
  id bigint primary key,
  team_name text not null,
  team_code text,
  logo_url text,
  country_code text,
  league_ids text[] default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index on team_name for faster lookups
create index if not exists idx_team_logos_name on team_logos (team_name);
create index if not exists idx_team_logos_code on team_logos (team_code);

-- RLS Policy: Allow public read, authenticated write
alter table team_logos enable row level security;

create policy "Allow public read on team_logos" on team_logos
  for select using (true);

create policy "Allow authenticated write on team_logos" on team_logos
  for insert with check (auth.role() = 'authenticated');

create policy "Allow authenticated update on team_logos" on team_logos
  for update with check (auth.role() = 'authenticated');
