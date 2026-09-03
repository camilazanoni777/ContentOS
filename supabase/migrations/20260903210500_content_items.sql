-- content_items: o registro central do produto. Uma ideia é UM ÚNICO
-- registro que muda de status ao longo do pipeline (idea -> researching ->
-- scripting -> ready_to_record -> recorded -> editing -> awaiting_approval
-- -> scheduled -> published -> repurpose/archived/canceled). Nunca duplicar
-- o registro ao avançar de etapa.
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.instagram_accounts (id) on delete set null,

  title text not null,
  hook text,
  summary text,
  script text,
  caption text,

  format text,
  pillar text,
  objective text,
  cta text,

  priority text,
  status public.content_status not null default 'idea',
  potential text,
  production_ease text,

  series_id uuid references public.content_series (id) on delete set null,
  reference_text text,
  reference_url text,
  audience_intent text,

  planned_at timestamptz,
  production_due_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  published_url text,

  campaign_id uuid references public.campaigns (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  -- Para repost/repurpose: aponta para o content_item original que deu origem
  -- a este novo registro (repurposing gera um NOVO registro ligado ao original,
  -- diferente de avançar de etapa, que reaproveita o mesmo registro).
  source_content_id uuid references public.content_items (id) on delete set null,

  recording_notes text,
  editing_notes text,
  cover_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  constraint content_items_title_not_blank check (btrim(title) <> ''),
  constraint content_items_not_self_source check (source_content_id is distinct from id)
);

comment on table public.content_items is
  'Registro central do pipeline editorial. Uma ideia é um único registro que muda de status; nunca é duplicada por etapa. Exclusão usa archived_at por padrão (soft delete).';

comment on column public.content_items.archived_at is
  'Regra crítica: exclusão de conteúdo deve usar archived_at por padrão (soft delete). Hard delete continua possível via SQL/admin quando necessário.';

create index content_items_user_id_idx on public.content_items (user_id);
create index content_items_account_id_idx on public.content_items (account_id);
create index content_items_series_id_idx on public.content_items (series_id);
create index content_items_campaign_id_idx on public.content_items (campaign_id);
create index content_items_product_id_idx on public.content_items (product_id);
create index content_items_source_content_id_idx on public.content_items (source_content_id);
create index content_items_status_idx on public.content_items (status);
create index content_items_scheduled_at_idx on public.content_items (scheduled_at);
-- Índice parcial para as listagens do dia a dia (conteúdo ainda não arquivado).
create index content_items_active_idx
  on public.content_items (user_id, status)
  where archived_at is null;

alter table public.content_items enable row level security;

create policy "content_items_select_own"
  on public.content_items for select
  using (user_id = auth.uid());

create policy "content_items_insert_own"
  on public.content_items for insert
  with check (user_id = auth.uid());

create policy "content_items_update_own"
  on public.content_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "content_items_delete_own"
  on public.content_items for delete
  using (user_id = auth.uid());

create trigger set_content_items_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();
