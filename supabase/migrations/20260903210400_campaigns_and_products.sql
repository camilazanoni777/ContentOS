-- campaigns: campanhas de marketing/lançamento que podem ser associadas a
-- vários content_items.
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'canceled')),
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_date_order_chk check (
    starts_at is null or ends_at is null or starts_at <= ends_at
  )
);

comment on table public.campaigns is 'Campanhas de marketing/lançamento associáveis a content_items.';

alter table public.campaigns enable row level security;

create policy "campaigns_select_own"
  on public.campaigns for select
  using (user_id = auth.uid());

create policy "campaigns_insert_own"
  on public.campaigns for insert
  with check (user_id = auth.uid());

create policy "campaigns_update_own"
  on public.campaigns for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "campaigns_delete_own"
  on public.campaigns for delete
  using (user_id = auth.uid());

create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- products: produtos/ofertas que um content_item pode promover.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Produtos/ofertas que um content_item pode promover.';

alter table public.products enable row level security;

create policy "products_select_own"
  on public.products for select
  using (user_id = auth.uid());

create policy "products_insert_own"
  on public.products for insert
  with check (user_id = auth.uid());

create policy "products_update_own"
  on public.products for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "products_delete_own"
  on public.products for delete
  using (user_id = auth.uid());

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
