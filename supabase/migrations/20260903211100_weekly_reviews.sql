-- weekly_reviews: revisão semanal estratégica (resumo automático + análise +
-- decisão do usuário).
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  week_start date not null,
  auto_summary jsonb not null default '{}'::jsonb,
  strategic_analysis text,
  decision text,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, week_start)
);

comment on table public.weekly_reviews is
  'Revisão semanal estratégica: resumo automático (auto_summary), análise e decisão do usuário.';

alter table public.weekly_reviews enable row level security;

create policy "weekly_reviews_select_own"
  on public.weekly_reviews for select
  using (user_id = auth.uid());

create policy "weekly_reviews_insert_own"
  on public.weekly_reviews for insert
  with check (user_id = auth.uid());

create policy "weekly_reviews_update_own"
  on public.weekly_reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "weekly_reviews_delete_own"
  on public.weekly_reviews for delete
  using (user_id = auth.uid());

create trigger set_weekly_reviews_updated_at
  before update on public.weekly_reviews
  for each row execute function public.set_updated_at();
