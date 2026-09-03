-- instagram_accounts: contas do Instagram vinculadas ao usuário (sem
-- integração real com a API do Instagram nesta fase — apenas cadastro manual).
create table public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  handle text not null,
  display_name text,
  is_primary boolean not null default false,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.instagram_accounts is
  'Contas do Instagram cadastradas pelo usuário (cadastro manual, sem integração via API nesta fase).';

create unique index instagram_accounts_user_handle_key
  on public.instagram_accounts (user_id, lower(handle));

alter table public.instagram_accounts enable row level security;

create policy "instagram_accounts_select_own"
  on public.instagram_accounts for select
  using (user_id = auth.uid());

create policy "instagram_accounts_insert_own"
  on public.instagram_accounts for insert
  with check (user_id = auth.uid());

create policy "instagram_accounts_update_own"
  on public.instagram_accounts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "instagram_accounts_delete_own"
  on public.instagram_accounts for delete
  using (user_id = auth.uid());

create trigger set_instagram_accounts_updated_at
  before update on public.instagram_accounts
  for each row execute function public.set_updated_at();
