-- Fase 6 — campos de roteirização e histórico básico de versões do
-- roteiro. Não cria uma tabela de roteiros separada: continua tudo em
-- public.content_items (registro central), mais uma tabela de histórico
-- imutável para as versões salvas do roteiro (mesmo padrão de
-- content_status_history: só select/insert, sem update/delete).

alter table public.content_items
  add column hook_variations jsonb not null default '[]'::jsonb,
  add column script_structure jsonb not null default '[]'::jsonb,
  add column on_screen_text text,
  add column shot_list jsonb not null default '[]'::jsonb,
  add column estimated_duration_seconds integer,
  add column script_checklist jsonb not null default '{}'::jsonb,
  add constraint content_items_estimated_duration_non_negative
    check (estimated_duration_seconds is null or estimated_duration_seconds >= 0);

comment on column public.content_items.hook_variations is
  'Até 5 variações de gancho testadas (array JSON de strings) — validação de "no máximo 5" é feita na camada de aplicação (Zod). O gancho escolhido continua em content_items.hook.';
comment on column public.content_items.script_structure is
  'Estrutura por blocos do roteiro: array JSON de { content, note? }, na ordem em que aparecem (a posição no array É a ordem — sem campo order redundante). A UI rotula os blocos como slides (Carrossel), cenas (Reel) ou telas (Stories) conforme content_items.format, mas o formato de dado é o mesmo para qualquer formato de conteúdo.';
comment on column public.content_items.shot_list is
  'Lista de takes e B-roll: array JSON de { type: "take" | "broll", description }, na ordem em que aparecem.';
comment on column public.content_items.script_checklist is
  'Checklist de roteiro (objeto JSON com 6 chaves booleanas fixas: clear_promise, strong_hook, delivery, proof_example, cta, objective_coherence) — validação de conteúdo e coerência antes de marcar como pronto para gravar.';
comment on column public.content_items.on_screen_text is
  'Texto que aparece na tela durante a gravação (legendas embutidas, texto de apoio) — diferente de caption (legenda da publicação).';

-- Histórico básico de versões do roteiro: uma linha por salvamento
-- relevante (clique em "salvar rascunho", ou autosave quando o conteúdo
-- mudou de forma significativa desde a última versão — throttle feito na
-- camada de aplicação, não aqui). Imutável como content_status_history:
-- sem policy de update/delete, então nem a própria dona pode alterar uma
-- versão já salva.
create table public.content_script_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.content_script_versions is
  'Histórico básico de versões do roteiro de um content_item. Imutável (só select/insert) — mesmo padrão de content_status_history.';
comment on column public.content_script_versions.snapshot is
  'Cópia dos campos de roteiro no momento do salvamento: { hook, hookVariations, script, scriptStructure, onScreenText, shotList, caption, estimatedDurationSeconds } (mesmas chaves de ScriptSnapshot em src/types/domain.ts).';

create index content_script_versions_content_item_id_idx
  on public.content_script_versions (content_item_id, created_at desc);

alter table public.content_script_versions enable row level security;

create policy "content_script_versions_select_own"
  on public.content_script_versions for select
  using (user_id = auth.uid());

create policy "content_script_versions_insert_own"
  on public.content_script_versions for insert
  with check (user_id = auth.uid());
