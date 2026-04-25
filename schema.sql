-- ═══════════════════════════════════════════════════════════════
-- TEAM APP — Kompletní databázové schéma MVP Level 1
-- Verze 1.0 | 2025
-- ═══════════════════════════════════════════════════════════════

-- ── Rozšíření ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── CLUBS ───────────────────────────────────────────────────────
create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null default 'fotbal',
  city text,
  logo_url text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── SEASONS ─────────────────────────────────────────────────────
create table seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  autumn_end date,
  spring_start date,
  is_active boolean default true,
  is_archived boolean default false,
  created_at timestamptz default now()
);

-- ── CATEGORIES ──────────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade not null,
  season_id uuid references seasons(id) on delete cascade not null,
  name text not null,
  age_group text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ── TEAMS ───────────────────────────────────────────────────────
create table teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- ── USERS (rozšíření Supabase auth.users) ───────────────────────
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  club_id uuid references clubs(id) on delete set null,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  role text not null default 'player' check (role in ('super_admin','club_admin','head_coach','coach','assistant','player','parent')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TEAM MEMBERS (přiřazení trenérů k týmům) ────────────────────
create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references user_profiles(id) on delete cascade not null,
  role text not null check (role in ('head_coach','coach','assistant')),
  created_at timestamptz default now(),
  unique(team_id, user_id)
);

-- ── PLAYERS ─────────────────────────────────────────────────────
create table players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade not null,
  user_id uuid references user_profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  birth_date date,
  photo_url text,
  position text default 'field' check (position in ('field','goalkeeper')),
  jersey_number integer,
  goalkeeper_number integer,
  internal_notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TEAM PLAYERS (hráči v týmu v dané sezóně) ───────────────────
create table team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  season_id uuid references seasons(id) on delete cascade not null,
  joined_at date default current_date,
  left_at date,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(team_id, player_id, season_id)
);

-- ── PARENT CONTACTS ─────────────────────────────────────────────
create table parent_contacts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade not null,
  user_id uuid references user_profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  relation text default 'parent',
  is_primary boolean default true,
  created_at timestamptz default now()
);

-- ── EVENTS (akce: tréninky, zápasy, turnaje) ────────────────────
create table events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('training','match','tournament','other')),
  date date not null,
  time_start time,
  time_end time,
  location text,
  description text,
  is_recurring boolean default false,
  recurrence_rule text,
  parent_event_id uuid references events(id) on delete set null,
  is_cancelled boolean default false,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── ATTENDANCE ──────────────────────────────────────────────────
create table attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  status text not null default 'present' check (status in ('present','excused','unexcused','unknown')),
  excuse_reason text,
  confirmed_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, player_id)
);

-- ── MATCH STATS ─────────────────────────────────────────────────
create table match_stats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  goals integer default 0,
  assists integer default 0,
  minutes_played integer default 0,
  rating numeric(3,1) check (rating >= 1 and rating <= 5),
  internal_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, player_id)
);

-- ── NOMINATIONS ─────────────────────────────────────────────────
create table nominations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  status text default 'nominated' check (status in ('nominated','confirmed','declined')),
  created_at timestamptz default now(),
  unique(event_id, player_id)
);

-- ── HOMEWORK ────────────────────────────────────────────────────
create table homework (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  title text not null,
  description text,
  deadline date,
  media_url text,
  assigned_to text default 'all' check (assigned_to in ('all','selected')),
  created_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

-- ── HOMEWORK ASSIGNMENTS (pro koho platí) ───────────────────────
create table homework_assignments (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid references homework(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  unique(homework_id, player_id)
);

-- ── HOMEWORK SUBMISSIONS (splnění) ──────────────────────────────
create table homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid references homework(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  media_url text,
  note text,
  rating integer check (rating >= 1 and rating <= 5),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references user_profiles(id),
  unique(homework_id, player_id)
);

-- ── FINANCE ITEMS ───────────────────────────────────────────────
create table finance_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  title text not null,
  amount numeric(10,2),
  deadline date,
  description text,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

-- ── FINANCE PAYMENTS ────────────────────────────────────────────
create table finance_payments (
  id uuid primary key default gen_random_uuid(),
  finance_item_id uuid references finance_items(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  paid boolean default false,
  paid_at timestamptz,
  note text,
  created_at timestamptz default now(),
  unique(finance_item_id, player_id)
);

-- ── GEAR ITEMS ──────────────────────────────────────────────────
create table gear_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  name text not null,
  price numeric(10,2),
  issue_date date,
  created_at timestamptz default now()
);

-- ── GEAR ASSIGNMENTS ────────────────────────────────────────────
create table gear_assignments (
  id uuid primary key default gen_random_uuid(),
  gear_item_id uuid references gear_items(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  size text,
  paid boolean default false,
  delivered boolean default false,
  created_at timestamptz default now(),
  unique(gear_item_id, player_id)
);

-- ── PLAYER REPORTS ──────────────────────────────────────────────
create table player_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade not null,
  team_id uuid references teams(id) on delete cascade not null,
  season_id uuid references seasons(id) on delete cascade not null,
  type text not null check (type in ('autumn','spring','full_season','monthly')),
  strengths text,
  improvements text,
  coach_note text,
  pdf_url text,
  published boolean default false,
  published_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table clubs enable row level security;
alter table seasons enable row level security;
alter table categories enable row level security;
alter table teams enable row level security;
alter table user_profiles enable row level security;
alter table team_members enable row level security;
alter table players enable row level security;
alter table team_players enable row level security;
alter table parent_contacts enable row level security;
alter table events enable row level security;
alter table attendance enable row level security;
alter table match_stats enable row level security;
alter table nominations enable row level security;
alter table homework enable row level security;
alter table homework_assignments enable row level security;
alter table homework_submissions enable row level security;
alter table finance_items enable row level security;
alter table finance_payments enable row level security;
alter table gear_items enable row level security;
alter table gear_assignments enable row level security;
alter table player_reports enable row level security;

-- Políky — veřejné čtení + zápis pro přihlášené (MVP, zpřísníme v Level 2)
do $$ 
declare t text;
begin
  foreach t in array array['clubs','seasons','categories','teams','user_profiles',
    'team_members','players','team_players','parent_contacts','events','attendance',
    'match_stats','nominations','homework','homework_assignments','homework_submissions',
    'finance_items','finance_payments','gear_items','gear_assignments','player_reports']
  loop
    execute format('create policy "read_%s" on %s for select using (true)', t, t);
    execute format('create policy "write_%s" on %s for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')', t, t);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- FUNKCE pro automatické triggery
-- ═══════════════════════════════════════════════════════════════

-- Automaticky vytvoří user_profile po registraci
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'coach')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Automaticky aktualizuje updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_clubs_updated_at before update on clubs for each row execute procedure update_updated_at();
create trigger update_user_profiles_updated_at before update on user_profiles for each row execute procedure update_updated_at();
create trigger update_players_updated_at before update on players for each row execute procedure update_updated_at();
create trigger update_events_updated_at before update on events for each row execute procedure update_updated_at();
create trigger update_match_stats_updated_at before update on match_stats for each row execute procedure update_updated_at();
create trigger update_reports_updated_at before update on player_reports for each row execute procedure update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- VIEWS pro agregované statistiky
-- ═══════════════════════════════════════════════════════════════

-- Statistiky hráče v sezóně
create or replace view player_season_stats as
select
  tp.player_id,
  tp.team_id,
  tp.season_id,
  p.first_name,
  p.last_name,
  p.jersey_number,
  p.position,
  coalesce(sum(ms.goals), 0) as total_goals,
  coalesce(sum(ms.assists), 0) as total_assists,
  coalesce(sum(ms.goals), 0) + coalesce(sum(ms.assists), 0) as total_points,
  coalesce(sum(ms.minutes_played), 0) as total_minutes,
  round(avg(ms.rating), 2) as avg_rating,
  count(distinct case when a.status = 'present' then a.event_id end) as attended,
  count(distinct a.event_id) as total_events,
  case when count(distinct a.event_id) > 0
    then round((count(distinct case when a.status = 'present' then a.event_id end)::numeric / count(distinct a.event_id)) * 100)
    else 0 end as attendance_pct
from team_players tp
join players p on p.id = tp.player_id
left join match_stats ms on ms.player_id = tp.player_id
left join events e on e.id = ms.event_id and e.team_id = tp.team_id
left join attendance a on a.player_id = tp.player_id
group by tp.player_id, tp.team_id, tp.season_id, p.first_name, p.last_name, p.jersey_number, p.position;
