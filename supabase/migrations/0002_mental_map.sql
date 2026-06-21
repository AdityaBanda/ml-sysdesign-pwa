alter table public.topics
  add column if not exists mental_map jsonb;
