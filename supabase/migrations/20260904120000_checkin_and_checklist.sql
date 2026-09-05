-- Fase 4 — redesenha daily_checkins para o fluxo real de check-in diário
-- (Página Hoje + Check-in) e adiciona checklist personalizável.
--
-- daily_checkins ainda não tinha nenhuma coluna usada pela aplicação (só
-- existia o esqueleto da Fase 2), então redesenhamos as colunas aqui em vez
-- de manter campos genéricos (morning_*/evening_summary/evening_notes) que
-- não correspondem aos campos pedidos pelo produto. Nenhuma migration já
-- aplicada é editada — isto é uma migration nova.

-- 1) daily_checkins: um registro por dia E conta (não só por dia).
alter table public.daily_checkins
  drop constraint if exists daily_checkins_user_id_checkin_date_key;

alter table public.daily_checkins
  drop column if exists morning_mood,
  drop column if exists morning_focus,
  drop column if exists morning_notes,
  drop column if exists evening_summary,
  drop column if exists evening_notes;

alter table public.daily_checkins
  add column account_id uuid references public.instagram_accounts (id) on delete set null,
  add column objective_main text,
  add column priorities jsonb not null default '[]'::jsonb,
  add column main_content_item_id uuid references public.content_items (id) on delete set null,
  add column planned_stories text,
  add column focus_product_id uuid references public.products (id) on delete set null,
  add column focus_campaign_id uuid references public.campaigns (id) on delete set null,
  add column observed_trend text,
  add column community_action text,
  add column notes text,
  add column daily_learning text,
  add column tomorrow_priority text,
  add column night_closed_at timestamptz;

comment on column public.daily_checkins.priorities is
  'Até 3 prioridades do dia: array JSON de { label: text, content_item_id?: uuid, goal_id?: uuid }. Validação de "no máximo 3" é feita na camada de aplicação (Zod).';
comment on column public.daily_checkins.evening_wins is
  'Fechamento noturno: principal vitória do dia.';
comment on column public.daily_checkins.evening_blockers is
  'Fechamento noturno: principal bloqueio do dia.';
comment on column public.daily_checkins.daily_learning is
  'Aprendizado do dia — preenchido durante o dia e/ou no fechamento noturno (mesmo campo, não duplicado).';
comment on column public.daily_checkins.night_closed_at is
  'Timestamp de quando o fechamento noturno foi concluído explicitamente (null = ainda não fechado).';

-- Um check-in por usuário, conta e data. Contas nulas (usuária ainda sem
-- nenhuma conta do Instagram cadastrada) são bloqueadas na aplicação antes
-- de chegar aqui (ver src/lib/data/instagram-accounts.ts:getActiveAccount),
-- então a constraint pode exigir account_id preenchido com segurança.
alter table public.daily_checkins
  alter column account_id set not null;

alter table public.daily_checkins
  add constraint daily_checkins_user_account_date_key unique (user_id, account_id, checkin_date);

-- 2) checklist_items: template de checklist diário, personalizável por usuária.
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint checklist_items_label_not_blank check (btrim(label) <> '')
);

comment on table public.checklist_items is
  'Template de itens do checklist diário do check-in, personalizável por usuária (adicionar/renomear/desativar itens). "is_active" aqui é o padrão para novos dias — a ativação por dia específico vive em daily_actions.is_active.';

create unique index checklist_items_user_label_key
  on public.checklist_items (user_id, lower(label));

alter table public.checklist_items enable row level security;

create policy "checklist_items_select_own"
  on public.checklist_items for select
  using (user_id = auth.uid());

create policy "checklist_items_insert_own"
  on public.checklist_items for insert
  with check (user_id = auth.uid());

create policy "checklist_items_update_own"
  on public.checklist_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "checklist_items_delete_own"
  on public.checklist_items for delete
  using (user_id = auth.uid());

create trigger set_checklist_items_updated_at
  before update on public.checklist_items
  for each row execute function public.set_updated_at();

-- 3) daily_actions: liga ao template e permite desativar só para o dia (sem
-- apagar o histórico), para o cálculo de percentual usar só ações ativas.
alter table public.daily_actions
  add column checklist_item_id uuid references public.checklist_items (id) on delete set null,
  add column is_active boolean not null default true,
  add column sort_order smallint not null default 0;

comment on column public.daily_actions.is_active is
  'Se false, esta ação não conta no cálculo do percentual do dia (ex.: "trabalhei em campanha" quando não há campanha ativa hoje) — sem apagar o item.';
