-- goals: metas semanais/mensais configuráveis (métrica em texto livre para
-- permitir metas de qualquer natureza: publicações, seguidores, receita etc.).
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_start date not null,
  metric text not null,
  target_value numeric(14, 2),
  achieved_value numeric(14, 2),
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, period_type, period_start, metric)
);

comment on table public.goals is
  'Metas semanais/mensais configuráveis. Regra crítica: valores ausentes são null, nunca zero.';

alter table public.goals enable row level security;

create policy "goals_select_own"
  on public.goals for select
  using (user_id = auth.uid());

create policy "goals_insert_own"
  on public.goals for insert
  with check (user_id = auth.uid());

create policy "goals_update_own"
  on public.goals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "goals_delete_own"
  on public.goals for delete
  using (user_id = auth.uid());

create trigger set_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
