-- Early-user feedback. Users can insert their own rows; only the service role
-- (Supabase dashboard / scripts) can read them back.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating int check (rating between 1 and 5),
  message text not null,
  page text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback(created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback insert own" on public.feedback;
create policy "feedback insert own" on public.feedback
  for insert with check (auth.uid() = user_id);
