-- Fase 5 (fim) — Agendamento, Publicados e Fase 6 (início) — Planejamento
-- semanal e Calendário mensal. Continua tudo em public.content_items;
-- planejamento semanal reaproveita a tabela weekly_reviews (já existente,
-- com unique(user_id, week_start) — uma "semana" tem uma linha só, seja na
-- fase de planejar ou de revisar); calendário ganha uma tabela nova e
-- pequena só para datas importantes (não é um content_item).

alter table public.content_items
  add column hashtags text[] not null default '{}'::text[],
  add column cover_image_url text,
  add column scheduling_checklist jsonb not null default '{}'::jsonb,
  add constraint content_items_published_requires_published_at
    check (status <> 'published' or published_at is not null);

comment on column public.content_items.hashtags is
  'Hashtags do post final (Agendamento, Prompt 8) — diferente de content_items.tags, que é organização interna, não texto publicado.';
comment on column public.content_items.cover_image_url is
  'Link da imagem de capa final (Agendamento) — Storage não está configurado neste projeto, então é só um link por enquanto (mesmo raciocínio de raw_file_url/edited_file_url na Fase 5).';
comment on column public.content_items.scheduling_checklist is
  'Checklist final antes de publicar (objeto JSON com 6 chaves fixas — ver SCHEDULING_CHECKLIST_KEYS em src/types/domain.ts). Orientativo.';
comment on constraint content_items_published_requires_published_at on public.content_items is
  'Regra do produto: nunca marcar como "published" sem uma data/hora real de publicação. A URL do post pode ficar vazia e ser adicionada depois (a UI mostra um alerta visível enquanto isso).';

alter table public.weekly_reviews
  add column strategic_focus text,
  add column weekly_experiment text,
  add column priority_content_id uuid references public.content_items (id) on delete set null,
  add column active_campaign_id uuid references public.campaigns (id) on delete set null,
  add column planned_hours numeric(5, 1),
  add constraint weekly_reviews_planned_hours_non_negative
    check (planned_hours is null or planned_hours >= 0);

comment on column public.weekly_reviews.strategic_focus is
  'Foco estratégico da semana (Planejamento semanal, Prompt 8) — preenchido no início da semana; strategic_analysis/decision (Fase 7) são preenchidos no fechamento, na mesma linha.';
comment on column public.weekly_reviews.priority_content_id is
  'Conteúdo prioritário da semana — aponta para content_items; on delete set null para não perder o plano se o conteúdo for excluído.';
comment on column public.weekly_reviews.active_campaign_id is
  'Campanha ativa da semana — aponta para campaigns; on delete set null pelo mesmo motivo.';
comment on column public.weekly_reviews.planned_hours is
  'Horas que a usuária planeja investir na semana — autorreportado (não há rastreamento automático de tempo neste produto).';

-- Datas importantes do calendário editorial (lançamentos, feriados, datas
-- comemorativas) — anotações livres, não ligadas a nenhum content_item.
create table public.calendar_important_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_date date not null,
  label text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_important_dates_label_not_blank check (btrim(label) <> '')
);

comment on table public.calendar_important_dates is
  'Datas importantes editáveis do Calendário (Prompt 8): lançamentos, feriados, datas comemorativas — anotações livres, não ligadas a content_items.';

create index calendar_important_dates_user_id_idx on public.calendar_important_dates (user_id);
create index calendar_important_dates_event_date_idx on public.calendar_important_dates (event_date);

alter table public.calendar_important_dates enable row level security;

create policy "calendar_important_dates_select_own" on public.calendar_important_dates for select using (user_id = auth.uid());
create policy "calendar_important_dates_insert_own" on public.calendar_important_dates for insert with check (user_id = auth.uid());
create policy "calendar_important_dates_update_own" on public.calendar_important_dates for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "calendar_important_dates_delete_own" on public.calendar_important_dates for delete using (user_id = auth.uid());

create trigger set_calendar_important_dates_updated_at
  before update on public.calendar_important_dates
  for each row execute function public.set_updated_at();
