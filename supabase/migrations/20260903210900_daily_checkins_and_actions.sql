-- daily_checkins: check-in diário de rotina/produção de conteúdo (manhã/noite).
-- Um por usuário por dia.
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null,

  morning_mood text,
  morning_focus text,
  morning_notes text,

  evening_summary text,
  evening_wins text,
  evening_blockers text,
  evening_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, checkin_date)
);

comment on table public.daily_checkins is 'Check-in diário de rotina/produção, um por usuário por dia.';

alter table public.daily_checkins enable row level security;

create policy "daily_checkins_select_own"
  on public.daily_checkins for select
  using (user_id = auth.uid());

create policy "daily_checkins_insert_own"
  on public.daily_checkins for insert
  with check (user_id = auth.uid());

create policy "daily_checkins_update_own"
  on public.daily_checkins for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "daily_checkins_delete_own"
  on public.daily_checkins for delete
  using (user_id = auth.uid());

create trigger set_daily_checkins_updated_at
  before update on public.daily_checkins
  for each row execute function public.set_updated_at();

-- daily_actions: itens de ação do dia (checklist), opcionalmente ligados a um check-in.
create table public.daily_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_id uuid references public.daily_checkins (id) on delete set null,

  action_date date not null,
  title text not null,
  is_done boolean not null default false,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_actions_title_not_blank check (btrim(title) <> '')
);

comment on table public.daily_actions is 'Itens de ação/checklist do dia, opcionalmente ligados a um daily_checkin.';

create index daily_actions_user_action_date_idx on public.daily_actions (user_id, action_date);
create index daily_actions_checkin_id_idx on public.daily_actions (checkin_id);

alter table public.daily_actions enable row level security;

create policy "daily_actions_select_own"
  on public.daily_actions for select
  using (user_id = auth.uid());

create policy "daily_actions_insert_own"
  on public.daily_actions for insert
  with check (user_id = auth.uid());

create policy "daily_actions_update_own"
  on public.daily_actions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "daily_actions_delete_own"
  on public.daily_actions for delete
  using (user_id = auth.uid());

create trigger set_daily_actions_updated_at
  before update on public.daily_actions
  for each row execute function public.set_updated_at();
