-- profile_snapshots: leituras periódicas do perfil do Instagram (seguidores,
-- alcance geral etc.), uma por conta por dia. Métricas ausentes são null.
create table public.profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.instagram_accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  snapshot_date date not null,
  followers bigint,
  following bigint,
  posts_count bigint,
  profile_visits bigint,
  reach bigint,
  impressions bigint,
  website_clicks bigint,

  created_at timestamptz not null default now(),

  unique (account_id, snapshot_date)
);

comment on table public.profile_snapshots is
  'Leituras periódicas do perfil do Instagram, uma por conta por dia. Métricas ausentes são null.';

create index profile_snapshots_account_id_idx on public.profile_snapshots (account_id);
create index profile_snapshots_snapshot_date_idx on public.profile_snapshots (snapshot_date);

alter table public.profile_snapshots enable row level security;

create policy "profile_snapshots_select_own"
  on public.profile_snapshots for select
  using (user_id = auth.uid());

create policy "profile_snapshots_insert_own"
  on public.profile_snapshots for insert
  with check (user_id = auth.uid());

create policy "profile_snapshots_update_own"
  on public.profile_snapshots for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "profile_snapshots_delete_own"
  on public.profile_snapshots for delete
  using (user_id = auth.uid());
