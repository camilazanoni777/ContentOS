-- content_series: séries/coleções que agrupam vários content_items
-- (ex.: "Série 5 erros de X").
create table public.content_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_series is 'Séries que agrupam vários content_items relacionados.';

alter table public.content_series enable row level security;

create policy "content_series_select_own"
  on public.content_series for select
  using (user_id = auth.uid());

create policy "content_series_insert_own"
  on public.content_series for insert
  with check (user_id = auth.uid());

create policy "content_series_update_own"
  on public.content_series for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "content_series_delete_own"
  on public.content_series for delete
  using (user_id = auth.uid());

create trigger set_content_series_updated_at
  before update on public.content_series
  for each row execute function public.set_updated_at();
