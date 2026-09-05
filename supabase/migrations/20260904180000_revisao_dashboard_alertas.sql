-- Prompt 11: Revisão Semanal (campos manuais estruturados) e central de
-- Alertas (estado de dispensar/adiar, já que alertas em si são sempre
-- calculados ao vivo, nunca persistidos).

-- weekly_reviews: os 6 campos manuais de fechamento que faltavam. `decision`
-- (Prompt 8) já cobre "decisão estratégica da próxima semana". `strategic_analysis`
-- (Prompt 8) fica deliberadamente sem uso a partir de agora — superado por
-- estes campos mais estruturados (mantido só por compatibilidade, nunca
-- mais escrito pelo app).
alter table public.weekly_reviews
  add column what_worked text,
  add column what_didnt_work text,
  add column what_to_repeat text,
  add column what_to_stop text,
  add column what_to_test text,
  add column key_learning text;

comment on column public.weekly_reviews.strategic_analysis is
  'Coluna da Fase 2, superada pelos campos estruturados do Prompt 11 (what_worked, what_didnt_work, etc.) — mantida só por compatibilidade, o app não escreve mais aqui.';
comment on column public.weekly_reviews.what_worked is 'O que funcionou nesta semana (Revisão Semanal, Prompt 11).';
comment on column public.weekly_reviews.what_didnt_work is 'O que não funcionou nesta semana.';
comment on column public.weekly_reviews.what_to_repeat is 'O que repetir na próxima semana.';
comment on column public.weekly_reviews.what_to_stop is 'O que parar de fazer.';
comment on column public.weekly_reviews.what_to_test is 'O que testar na próxima semana.';
comment on column public.weekly_reviews.key_learning is 'Principal aprendizado da semana.';

-- alert_dismissals: estado de "dispensar"/"adiar" de um alerta acionável.
-- Alertas em si nunca são uma linha no banco — são sempre recalculados ao
-- vivo (mesma filosofia de Metas/Perfil/Métricas); esta tabela só guarda a
-- decisão da usuária sobre um alerta específico, identificado por uma chave
-- estável (ex.: "overdue:<content_item_id>", "goal_at_risk:<goal_id>").
create table public.alert_dismissals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  alert_key text not null,
  dismissed boolean not null default false,
  snoozed_until timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, alert_key)
);

comment on table public.alert_dismissals is
  'Estado de dispensar/adiar de um alerta acionável, por chave estável. O alerta em si nunca é persistido — sempre recalculado ao vivo (ver src/lib/alerts.ts).';
comment on column public.alert_dismissals.alert_key is
  'Chave estável do alerta (tipo + id da entidade), ex.: "overdue:<content_item_id>". Dispensar/adiar vale só enquanto a mesma condição gerar a mesma chave.';
comment on column public.alert_dismissals.dismissed is
  'true = dispensado indefinidamente (só volta a aparecer se a condição mudar e gerar outra ocorrência).';
comment on column public.alert_dismissals.snoozed_until is
  'Quando preenchido, o alerta fica escondido até esta data/hora, depois volta a aparecer normalmente.';

alter table public.alert_dismissals enable row level security;

create policy "alert_dismissals_select_own"
  on public.alert_dismissals for select
  using (user_id = auth.uid());

create policy "alert_dismissals_insert_own"
  on public.alert_dismissals for insert
  with check (user_id = auth.uid());

create policy "alert_dismissals_update_own"
  on public.alert_dismissals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "alert_dismissals_delete_own"
  on public.alert_dismissals for delete
  using (user_id = auth.uid());

create trigger set_alert_dismissals_updated_at
  before update on public.alert_dismissals
  for each row execute function public.set_updated_at();

create index alert_dismissals_user_id_idx on public.alert_dismissals (user_id);
