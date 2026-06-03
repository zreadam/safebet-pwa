-- ============================================================
-- Safebet — Initial schema (idempotent — safe to re-run)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  avatar_color text default '#10B981',
  country text default 'FR',
  favorite_team text,
  favorite_competitions text[] default array['L1'],
  balance numeric(10,2) default 50.00,
  tier text default 'free' check (tier in ('free','premium')),
  premium_until timestamptz,
  stripe_customer_id text unique,
  streak integer default 0,
  last_active date,
  total_bets integer default 0,
  won_bets integer default 0,
  onboarding_done boolean default false,
  pwa_tutorial_done boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Safety net: auto-credit 10B when balance < 5B (once per day)
create or replace function public.check_safety_net(user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_balance numeric;
  v_last_credit date;
begin
  select balance, last_active into v_balance, v_last_credit
  from profiles where id = user_id;

  if v_balance < 5 and (v_last_credit is null or v_last_credit < current_date) then
    update profiles set balance = balance + 10, last_active = current_date
    where id = user_id;
  end if;
end;
$$;

-- ============================================================
-- matches (cached from APIs)
-- ============================================================
create table if not exists matches (
  id text primary key,
  competition text not null,
  competition_name text not null,
  competition_color text default '#10B981',
  home_team text not null,
  away_team text not null,
  home_team_code text not null,
  away_team_code text not null,
  home_score integer,
  away_score integer,
  state text default 'soon' check (state in ('soon','live','done')),
  kickoff timestamptz not null,
  minute text,
  venue text,
  odds_1 numeric(6,2) default 2.00,
  odds_n numeric(6,2) default 3.25,
  odds_2 numeric(6,2) default 3.50,
  odds_updated_at timestamptz default now(),
  is_premium boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- bets
-- ============================================================
create table if not exists bets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  match_id text references matches(id) not null,
  match_label text not null,
  market text not null,
  selection text not null,
  odds numeric(6,2) not null,
  stake numeric(10,2) not null,
  potential_gain numeric(10,2) not null,
  status text default 'pending' check (status in ('pending','won','lost','void')),
  is_live boolean default false,
  placed_at timestamptz default now(),
  settled_at timestamptz
);

create or replace function public.place_bet(
  p_user_id uuid,
  p_match_id text,
  p_match_label text,
  p_market text,
  p_selection text,
  p_odds numeric,
  p_stake numeric,
  p_is_live boolean default false
) returns bets language plpgsql security definer as $$
declare
  v_balance numeric;
  v_new_bet bets;
begin
  select balance into v_balance from profiles where id = p_user_id;
  if v_balance < p_stake then
    raise exception 'Solde insuffisant';
  end if;

  update profiles set balance = balance - p_stake, total_bets = total_bets + 1
  where id = p_user_id;

  insert into bets (user_id, match_id, match_label, market, selection, odds, stake, potential_gain, is_live)
  values (p_user_id, p_match_id, p_match_label, p_market, p_selection, p_odds, p_stake, round(p_odds * p_stake, 2), p_is_live)
  returning * into v_new_bet;

  return v_new_bet;
end;
$$;

create or replace function public.settle_bet(p_bet_id uuid, p_result text)
returns void language plpgsql security definer as $$
declare
  v_bet bets;
begin
  select * into v_bet from bets where id = p_bet_id;
  if not found then return; end if;

  update bets set status = p_result, settled_at = now() where id = p_bet_id;

  if p_result = 'won' then
    update profiles set
      balance = balance + v_bet.potential_gain,
      won_bets = won_bets + 1
    where id = v_bet.user_id;
  elsif p_result = 'void' then
    update profiles set balance = balance + v_bet.stake where id = v_bet.user_id;
  end if;
end;
$$;

-- ============================================================
-- leagues
-- ============================================================
create table if not exists leagues (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text default '#10B981',
  emoji text default '⚽',
  is_private boolean default false,
  created_by uuid references profiles(id) on delete cascade not null,
  invite_code text unique default substring(md5(random()::text) from 1 for 8),
  created_at timestamptz default now()
);

create table if not exists league_members (
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

create table if not exists league_activity (
  id uuid default uuid_generate_v4() primary key,
  league_id uuid references leagues(id) on delete cascade,
  text text not null,
  emoji text default '⚽',
  created_at timestamptz default now()
);

-- ============================================================
-- quests
-- ============================================================
create table if not exists quest_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  quest_key text not null,
  progress integer default 0,
  is_done boolean default false,
  rewarded_at timestamptz,
  period_key text,
  unique(user_id, quest_key, period_key)
);

-- ============================================================
-- push subscriptions
-- ============================================================
create table if not exists push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS — activer
-- ============================================================
alter table profiles enable row level security;
alter table matches enable row level security;
alter table bets enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table league_activity enable row level security;
alter table quest_progress enable row level security;
alter table push_subscriptions enable row level security;

-- ============================================================
-- RLS — supprimer les anciennes policies avant de recréer
-- ============================================================
drop policy if exists "Own profile"          on profiles;
drop policy if exists "Public matches"       on matches;
drop policy if exists "Own bets"             on bets;
drop policy if exists "League members view"  on leagues;
drop policy if exists "Create league"        on leagues;
drop policy if exists "League member"        on league_members;
drop policy if exists "Join league"          on league_members;
drop policy if exists "League activity"      on league_activity;
drop policy if exists "Own quests"           on quest_progress;
drop policy if exists "Own push"             on push_subscriptions;

-- ============================================================
-- RLS — créer les policies
-- ============================================================
create policy "Own profile"         on profiles       for all using (auth.uid() = id);
create policy "Public matches"      on matches        for select using (true);
create policy "Own bets"            on bets           for all using (auth.uid() = user_id);

create policy "League members view" on leagues        for select
  using (id in (select league_id from league_members where user_id = auth.uid()));
create policy "Create league"       on leagues        for insert
  with check (auth.uid() = created_by);

create policy "League member"       on league_members for select
  using (user_id = auth.uid() or league_id in (
    select league_id from league_members where user_id = auth.uid()
  ));
create policy "Join league"         on league_members for insert
  with check (auth.uid() = user_id);

create policy "League activity"     on league_activity for select
  using (league_id in (select league_id from league_members where user_id = auth.uid()));

create policy "Own quests"          on quest_progress  for all using (auth.uid() = user_id);
create policy "Own push"            on push_subscriptions for all using (auth.uid() = user_id);
