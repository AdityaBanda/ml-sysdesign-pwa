-- ML SysDesign — initial schema
-- Run via Supabase CLI: `supabase db reset` (local) or paste into the SQL editor (cloud).

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  avatar_url text,
  level int not null default 1,
  total_xp int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  hearts int not null default 5,
  hearts_refilled_at timestamptz not null default now(),
  last_active_date date,
  daily_xp_goal int not null default 30,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- content tables — populated by scripts/ingest-content.ts
-- ---------------------------------------------------------------------------
create table if not exists public.topics (
  slug text primary key,
  title text not null,
  "order" int not null,
  prereq_slugs text[] not null default '{}',
  intro text
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_slug text not null references public.topics(slug) on delete cascade,
  "order" int not null,
  title text not null,
  prompts jsonb not null,
  unique (topic_slug, "order")
);

create table if not exists public.cases (
  slug text primary key,
  title text not null,
  difficulty int not null,
  prerequisites text[] not null default '{}',
  xp_reward int not null,
  summary text,
  stages jsonb not null
);

-- ---------------------------------------------------------------------------
-- progress + xp
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('lesson', 'case')),
  ref_id text not null,             -- lesson id (uuid as text) or case slug
  stage_index int not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  best_score int not null default 0,
  mistakes int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);

create index if not exists progress_user_idx on public.progress(user_id);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  amount int not null,
  created_at timestamptz not null default now()
);

create index if not exists xp_events_user_created_idx on public.xp_events(user_id, created_at desc);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_slug text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_slug)
);

-- ---------------------------------------------------------------------------
-- weekly leaderboard view (ISO week)
-- ---------------------------------------------------------------------------
create or replace view public.leaderboard_weekly as
select
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  coalesce(sum(x.amount) filter (where x.created_at >= date_trunc('week', now())), 0)::int as week_xp,
  p.level,
  p.current_streak
from public.profiles p
left join public.xp_events x on x.user_id = p.id
group by p.id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.cases enable row level security;
alter table public.progress enable row level security;
alter table public.xp_events enable row level security;
alter table public.achievements enable row level security;

-- Anyone authenticated can read content.
drop policy if exists "topics readable" on public.topics;
create policy "topics readable" on public.topics for select using (auth.role() = 'authenticated');

drop policy if exists "lessons readable" on public.lessons;
create policy "lessons readable" on public.lessons for select using (auth.role() = 'authenticated');

drop policy if exists "cases readable" on public.cases;
create policy "cases readable" on public.cases for select using (auth.role() = 'authenticated');

-- Profiles: read all, write only your own.
drop policy if exists "profiles read all" on public.profiles;
create policy "profiles read all" on public.profiles for select using (auth.role() = 'authenticated');

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles for insert with check (auth.uid() = id);

-- Progress: own rows only.
drop policy if exists "progress own rows" on public.progress;
create policy "progress own rows" on public.progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- xp_events: insert own + read own.
drop policy if exists "xp_events own rows" on public.xp_events;
create policy "xp_events own rows" on public.xp_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- achievements: own rows only.
drop policy if exists "achievements own rows" on public.achievements;
create policy "achievements own rows" on public.achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
