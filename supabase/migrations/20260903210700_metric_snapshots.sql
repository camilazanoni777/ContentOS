-- metric_snapshots: leituras de métricas de um content_item. Aceita MÚLTIPLAS
-- leituras por conteúdo (24h, 7d, 30d ou custom). Regra crítica: ausência de
-- dado é null e nunca zero — todo campo de métrica é opcional (nullable).
create table public.metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  window_type public.metric_window not null,
  window_start timestamptz,
  window_end timestamptz,
  captured_at timestamptz not null default now(),

  views bigint,
  reach bigint,
  impressions bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  replies bigint,
  profile_visits bigint,
  followers_gained bigint,
  link_clicks bigint,
  leads bigint,
  sales bigint,
  revenue numeric(12, 2),
  average_watch_time_seconds numeric(10, 2),
  video_duration_seconds numeric(10, 2),
  three_second_views bigint,
  completed_views bigint,
  retention_rate numeric(5, 2),
  story_exits bigint,
  taps_forward bigint,
  taps_back bigint,

  created_at timestamptz not null default now(),

  constraint metric_snapshots_retention_rate_range_chk
    check (retention_rate is null or (retention_rate >= 0 and retention_rate <= 100)),
  constraint metric_snapshots_custom_window_bounds_chk
    check (
      window_type <> 'custom'
      or (window_start is not null and window_end is not null and window_start <= window_end)
    )
);

comment on table public.metric_snapshots is
  'Leituras de métricas de um content_item. Múltiplas leituras por conteúdo (24h/7d/30d/custom). Regra crítica: ausência de dado é null, nunca zero.';

-- Uma única leitura por janela fixa (24h/7d/30d) por conteúdo; janelas
-- customizadas podem se repetir (períodos diferentes).
create unique index metric_snapshots_content_fixed_window_key
  on public.metric_snapshots (content_item_id, window_type)
  where window_type <> 'custom';

create index metric_snapshots_content_item_id_idx
  on public.metric_snapshots (content_item_id);
create index metric_snapshots_captured_at_idx
  on public.metric_snapshots (captured_at);

alter table public.metric_snapshots enable row level security;

create policy "metric_snapshots_select_own"
  on public.metric_snapshots for select
  using (user_id = auth.uid());

create policy "metric_snapshots_insert_own"
  on public.metric_snapshots for insert
  with check (user_id = auth.uid());

create policy "metric_snapshots_update_own"
  on public.metric_snapshots for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "metric_snapshots_delete_own"
  on public.metric_snapshots for delete
  using (user_id = auth.uid());
