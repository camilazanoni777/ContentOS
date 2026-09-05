-- Fase 5 — Gravação (sessões em lote) e Edição (arquivos, checklist de
-- qualidade e comentários/revisões). Continua tudo em public.content_items
-- como registro central; sessões de gravação agrupam vários content_items
-- (nunca duplicam o registro), e comentários de edição vivem em tabela
-- própria (cada um pode ser resolvido/reaberto individualmente — diferente
-- de um histórico imutável).

alter table public.content_items
  add column raw_file_url text,
  add column edited_file_url text,
  add column editor_name text,
  add column edit_visual_references jsonb not null default '[]'::jsonb,
  add column edit_cuts_notes text,
  add column edit_on_screen_text_notes text,
  add column edit_captions_notes text,
  add column edit_audio_notes text,
  add column recording_checklist jsonb not null default '{}'::jsonb,
  add column edit_checklist jsonb not null default '{}'::jsonb;

comment on column public.content_items.editing_notes is
  'Reaproveitado pela página Edição como "instruções de edição" (Prompt 7) — mesmo campo provisionado desde a Fase 1, sem coluna nova.';
comment on column public.content_items.cover_notes is
  'Reaproveitado pela página Edição como notas de capa (Prompt 7).';
comment on column public.content_items.recording_notes is
  'Preenchido no workspace de Roteiros ("notas de gravação", Prompt 6) e reaproveitado como referência na página Gravação (Prompt 7) — mesmo campo, sem duplicar.';
comment on column public.content_items.production_due_at is
  'Prazo de produção genérico do pipeline (já usado por Hoje/alertas) — reaproveitado como "prazo" na página Edição (Prompt 7).';
comment on column public.content_items.edit_visual_references is
  'Referências visuais da edição: array JSON de { label, url }.';
comment on column public.content_items.recording_checklist is
  'Checklist de gravação (objeto JSON com 8 chaves fixas — ver RECORDING_CHECKLIST_KEYS em src/types/domain.ts): roteiro aberto, cenário, iluminação, áudio, take principal, B-roll, capa, backup. Orientativo — não bloqueia "Marcar como gravado".';
comment on column public.content_items.edit_checklist is
  'Checklist de qualidade da edição (objeto JSON com 9 chaves fixas — ver EDIT_CHECKLIST_KEYS em src/types/domain.ts). Orientativo — não bloqueia "Enviar para aprovação"/"Aprovar".';

-- Sessão de gravação em lote: agrupa vários content_items sob um único
-- cenário/roupa/local/equipamento, para reduzir trocas durante a gravação.
create table public.recording_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date,
  location text,
  scenario text,
  outfit text,
  equipment text,
  available_minutes integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recording_sessions_available_minutes_non_negative
    check (available_minutes is null or available_minutes >= 0)
);

comment on table public.recording_sessions is
  'Sessão de gravação em lote: agrupa vários content_items (via recording_session_items) sob um único cenário/roupa/local/equipamento, para reduzir trocas durante a gravação.';

create index recording_sessions_user_id_idx on public.recording_sessions (user_id);
create index recording_sessions_session_date_idx on public.recording_sessions (session_date);

alter table public.recording_sessions enable row level security;

create policy "recording_sessions_select_own" on public.recording_sessions for select using (user_id = auth.uid());
create policy "recording_sessions_insert_own" on public.recording_sessions for insert with check (user_id = auth.uid());
create policy "recording_sessions_update_own" on public.recording_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recording_sessions_delete_own" on public.recording_sessions for delete using (user_id = auth.uid());

create trigger set_recording_sessions_updated_at
  before update on public.recording_sessions
  for each row execute function public.set_updated_at();

-- Um content_item dentro de uma sessão de gravação, com a ordem de
-- gravação (sort_order) — usada para reduzir trocas de cenário/roupa. O
-- checklist de gravação em si vive em content_items.recording_checklist
-- (o mesmo item pode ser visto/marcado fora de uma sessão também, no modo
-- lista/cards).
create table public.recording_session_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.recording_sessions (id) on delete cascade,
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint recording_session_items_unique_pair unique (session_id, content_item_id)
);

comment on table public.recording_session_items is
  'Um content_item dentro de uma sessão de gravação, com a ordem de gravação (sort_order) para reduzir trocas de cenário/roupa.';

create index recording_session_items_session_id_idx on public.recording_session_items (session_id, sort_order);
create index recording_session_items_content_item_id_idx on public.recording_session_items (content_item_id);

alter table public.recording_session_items enable row level security;

create policy "recording_session_items_select_own" on public.recording_session_items for select using (user_id = auth.uid());
create policy "recording_session_items_insert_own" on public.recording_session_items for insert with check (user_id = auth.uid());
create policy "recording_session_items_update_own" on public.recording_session_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recording_session_items_delete_own" on public.recording_session_items for delete using (user_id = auth.uid());

-- Comentários/revisões da página Edição: cada linha é um comentário
-- independente, com status aberto/resolvido (pode ser reaberto) —
-- diferente de um histórico imutável como content_status_history.
create table public.content_review_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  author_name text,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_review_comments_body_not_blank check (btrim(body) <> ''),
  constraint content_review_comments_status_valid check (status in ('open', 'resolved'))
);

comment on table public.content_review_comments is
  'Comentários/revisões da página Edição, um por linha, com status aberto/resolvido (pode ser reaberto) — diferente de um histórico imutável.';

create index content_review_comments_content_item_id_idx on public.content_review_comments (content_item_id, created_at);

alter table public.content_review_comments enable row level security;

create policy "content_review_comments_select_own" on public.content_review_comments for select using (user_id = auth.uid());
create policy "content_review_comments_insert_own" on public.content_review_comments for insert with check (user_id = auth.uid());
create policy "content_review_comments_update_own" on public.content_review_comments for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "content_review_comments_delete_own" on public.content_review_comments for delete using (user_id = auth.uid());

create trigger set_content_review_comments_updated_at
  before update on public.content_review_comments
  for each row execute function public.set_updated_at();
