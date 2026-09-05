-- Prompt 12 — Campanhas, monetização e vínculo com conteúdo.
-- Evolui campaigns/products existentes e cria estruturas normalizadas para
-- entregáveis, parcelas/recebimentos e vendas. Totais financeiros são sempre
-- derivados; nenhum saldo agregado é persistido.

alter table public.campaigns
  add column brand_name text,
  add column contact_name text,
  add column contact_email text,
  add column contact_phone text,
  add column contact_notes text,
  add column first_contact_date date,
  add column campaign_type text not null default 'other',
  add column account_id uuid references public.instagram_accounts (id) on delete set null,
  add column delivery_due_date date,
  add column published_at timestamptz,
  add column contracted_fee numeric(14, 2),
  add column currency text not null default 'BRL',
  add column negotiation_status text not null default 'prospecting',
  add column contract_status text not null default 'not_sent',
  add column delivery_status text not null default 'not_started',
  add column payment_status text not null default 'to_be_agreed',
  add column expected_payment_date date,
  add column briefing_url text,
  add column contract_url text,
  add column folder_url text,
  add column publication_url text,
  add column responsible_name text,
  add column notes text,
  add column archived_at timestamptz;

-- Compatibilidade com campanhas já cadastradas no modelo inicial.
update public.campaigns
set
  negotiation_status = case status
    when 'active' then 'approved'
    when 'completed' then 'approved'
    when 'canceled' then 'declined'
    else 'prospecting'
  end,
  delivery_status = case status
    when 'active' then 'in_production'
    when 'completed' then 'published'
    else 'not_started'
  end,
  delivery_due_date = coalesce(delivery_due_date, ends_at),
  notes = coalesce(notes, description);

alter table public.campaigns
  drop constraint campaigns_status_check,
  drop column status,
  add constraint campaigns_name_not_blank check (btrim(name) <> ''),
  add constraint campaigns_type_valid check (campaign_type in (
    'barter', 'paid_post', 'ambassador', 'affiliate', 'event_appearance',
    'exclusive_content', 'image_licensing', 'other'
  )),
  add constraint campaigns_negotiation_status_valid check (negotiation_status in (
    'prospecting', 'first_contact', 'proposal_sent', 'negotiating', 'approved', 'declined', 'standby'
  )),
  add constraint campaigns_contract_status_valid check (contract_status in (
    'not_applicable', 'not_sent', 'sent', 'under_review', 'signed'
  )),
  add constraint campaigns_delivery_status_valid check (delivery_status in (
    'not_started', 'in_production', 'sent_for_approval', 'approved', 'published', 'late'
  )),
  add constraint campaigns_payment_status_valid check (payment_status in (
    'not_applicable', 'to_be_agreed', 'awaiting_invoice', 'awaiting_payment',
    'partially_paid', 'paid', 'overdue', 'canceled'
  )),
  add constraint campaigns_contracted_fee_non_negative check (contracted_fee is null or contracted_fee >= 0),
  add constraint campaigns_currency_iso_like check (currency ~ '^[A-Z]{3}$'),
  add constraint campaigns_contact_email_valid check (contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

comment on column public.campaigns.contracted_fee is 'Cachê contratado. Saldo a receber é derivado deste valor menos recebimentos confirmados em campaign_payments.';
comment on column public.campaigns.archived_at is 'Arquivamento lógico; exclusão permanente não é o fluxo normal da interface.';

create index campaigns_user_id_idx on public.campaigns (user_id);
create index campaigns_account_id_idx on public.campaigns (account_id);
create index campaigns_user_delivery_due_idx on public.campaigns (user_id, delivery_due_date) where archived_at is null;
create index campaigns_user_negotiation_idx on public.campaigns (user_id, negotiation_status) where archived_at is null;

drop policy "campaigns_insert_own" on public.campaigns;
drop policy "campaigns_update_own" on public.campaigns;
create policy "campaigns_insert_own" on public.campaigns for insert to authenticated with check (
  (select auth.uid()) = user_id
  and (account_id is null or exists (select 1 from public.instagram_accounts a where a.id = account_id and a.user_id = (select auth.uid())))
);
create policy "campaigns_update_own" on public.campaigns for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (account_id is null or exists (select 1 from public.instagram_accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );

alter table public.products
  rename column price to reference_price;

alter table public.products
  add column status text not null default 'active',
  add column notes text,
  add column archived_at timestamptz,
  add constraint products_name_not_blank check (btrim(name) <> ''),
  add constraint products_status_valid check (status in ('draft', 'active', 'inactive', 'archived')),
  add constraint products_reference_price_non_negative check (reference_price is null or reference_price >= 0);

update public.products
set status = case when is_active then 'active' else 'inactive' end,
    notes = coalesce(notes, description);

alter table public.products drop column is_active;

create index products_user_id_idx on public.products (user_id);
create index products_user_status_idx on public.products (user_id, status) where archived_at is null;

create table public.campaign_deliverables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  content_item_id uuid references public.content_items (id) on delete set null,
  title text not null,
  quantity integer not null default 1,
  status text not null default 'pending',
  due_date date,
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_deliverables_title_not_blank check (btrim(title) <> ''),
  constraint campaign_deliverables_quantity_positive check (quantity > 0),
  constraint campaign_deliverables_status_valid check (status in (
    'pending', 'in_progress', 'sent_for_approval', 'approved', 'published', 'canceled'
  ))
);

create index campaign_deliverables_user_id_idx on public.campaign_deliverables (user_id);
create index campaign_deliverables_campaign_id_idx on public.campaign_deliverables (campaign_id, sort_order);
create index campaign_deliverables_content_item_id_idx on public.campaign_deliverables (content_item_id);
alter table public.campaign_deliverables enable row level security;
create policy "campaign_deliverables_select_own" on public.campaign_deliverables for select to authenticated using ((select auth.uid()) = user_id);
create policy "campaign_deliverables_insert_own" on public.campaign_deliverables for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = (select auth.uid()))
  and (content_item_id is null or exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = (select auth.uid())))
);
create policy "campaign_deliverables_update_own" on public.campaign_deliverables for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = (select auth.uid()))
  and (content_item_id is null or exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = (select auth.uid())))
);
create policy "campaign_deliverables_delete_own" on public.campaign_deliverables for delete to authenticated using ((select auth.uid()) = user_id);
create trigger set_campaign_deliverables_updated_at before update on public.campaign_deliverables for each row execute function public.set_updated_at();

create table public.campaign_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  amount numeric(14, 2) not null,
  received_amount numeric(14, 2),
  due_date date,
  received_at timestamptz,
  status text not null default 'awaiting_payment',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_payments_amount_positive check (amount > 0),
  constraint campaign_payments_received_amount_valid check (
    received_amount is null or (received_amount >= 0 and received_amount <= amount)
  ),
  constraint campaign_payments_status_valid check (status in (
    'awaiting_invoice', 'awaiting_payment', 'partially_paid', 'paid', 'overdue', 'canceled'
  )),
  constraint campaign_payments_paid_requires_receipt check (
    status <> 'paid' or (received_at is not null and received_amount = amount)
  ),
  constraint campaign_payments_partial_requires_receipt check (
    status <> 'partially_paid' or (received_at is not null and received_amount > 0 and received_amount < amount)
  )
);

create index campaign_payments_user_id_idx on public.campaign_payments (user_id);
create index campaign_payments_campaign_id_idx on public.campaign_payments (campaign_id);
create index campaign_payments_user_due_idx on public.campaign_payments (user_id, due_date) where status not in ('paid', 'canceled');
alter table public.campaign_payments enable row level security;
create policy "campaign_payments_select_own" on public.campaign_payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "campaign_payments_insert_own" on public.campaign_payments for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = (select auth.uid()))
);
create policy "campaign_payments_update_own" on public.campaign_payments for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = (select auth.uid()))
);
create policy "campaign_payments_delete_own" on public.campaign_payments for delete to authenticated using ((select auth.uid()) = user_id);
create trigger set_campaign_payments_updated_at before update on public.campaign_payments for each row execute function public.set_updated_at();

create table public.sales_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  campaign_id uuid references public.campaigns (id) on delete set null,
  content_item_id uuid references public.content_items (id) on delete set null,
  metric_snapshot_id uuid references public.metric_snapshots (id) on delete restrict,
  source text not null default 'manual',
  sale_date date not null,
  cta text,
  link_clicks bigint,
  leads bigint,
  sales_count bigint,
  revenue numeric(14, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_records_source_valid check (source in ('manual', 'metric_snapshot')),
  constraint sales_records_source_consistency check (
    (source = 'manual' and metric_snapshot_id is null)
    or
    (source = 'metric_snapshot' and metric_snapshot_id is not null and link_clicks is null and leads is null and sales_count is null and revenue is null)
  ),
  constraint sales_records_non_negative check (
    (link_clicks is null or link_clicks >= 0) and
    (leads is null or leads >= 0) and
    (sales_count is null or sales_count >= 0) and
    (revenue is null or revenue >= 0)
  )
);

comment on table public.sales_records is 'Livro-razão de atribuição de vendas. Registros manuais guardam métricas próprias; registros metric_snapshot derivam cliques/leads/vendas/receita do snapshot referenciado, sem copiar valores.';
comment on column public.sales_records.metric_snapshot_id is 'Único por registro de métricas; impede que a mesma captura seja somada duas vezes no livro-razão.';

create unique index sales_records_metric_snapshot_key on public.sales_records (metric_snapshot_id) where metric_snapshot_id is not null;
create index sales_records_user_id_idx on public.sales_records (user_id);
create index sales_records_product_id_idx on public.sales_records (product_id);
create index sales_records_campaign_id_idx on public.sales_records (campaign_id);
create index sales_records_content_item_id_idx on public.sales_records (content_item_id);
create index sales_records_user_sale_date_idx on public.sales_records (user_id, sale_date);
alter table public.sales_records enable row level security;
create policy "sales_records_select_own" on public.sales_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "sales_records_insert_own" on public.sales_records for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.products p where p.id = product_id and p.user_id = (select auth.uid()))
  and (campaign_id is null or exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = (select auth.uid())))
  and (content_item_id is null or exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = (select auth.uid())))
  and (metric_snapshot_id is null or exists (select 1 from public.metric_snapshots ms where ms.id = metric_snapshot_id and ms.content_item_id = content_item_id and ms.user_id = (select auth.uid())))
);
create policy "sales_records_update_own" on public.sales_records for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.products p where p.id = product_id and p.user_id = (select auth.uid()))
  and (campaign_id is null or exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = (select auth.uid())))
  and (content_item_id is null or exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = (select auth.uid())))
  and (metric_snapshot_id is null or exists (select 1 from public.metric_snapshots ms where ms.id = metric_snapshot_id and ms.content_item_id = content_item_id and ms.user_id = (select auth.uid())))
);
create policy "sales_records_delete_own" on public.sales_records for delete to authenticated using ((select auth.uid()) = user_id);
create trigger set_sales_records_updated_at before update on public.sales_records for each row execute function public.set_updated_at();

-- Tabelas do app são privadas para anon e expostas somente à role autenticada;
-- RLS continua sendo a autorização por linha.
revoke all on table public.campaign_deliverables, public.campaign_payments, public.sales_records from anon;
grant select, insert, update, delete on table public.campaign_deliverables, public.campaign_payments, public.sales_records to authenticated;
