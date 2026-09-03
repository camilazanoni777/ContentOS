-- Extensões e funções auxiliares compartilhadas pelas próximas migrations.
--
-- Observação: gen_random_uuid() é nativo do Postgres (core) desde a versão 13,
-- então não é necessário habilitar a extensão pgcrypto para gerar UUIDs.

-- Função genérica para manter updated_at sempre atualizado em UPDATEs.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Atualiza automaticamente a coluna updated_at em qualquer UPDATE.';

-- Status possíveis de um content_item ao longo do pipeline editorial.
-- Um "content_item" é um único registro que muda de status conforme avança
-- (nunca é duplicado por etapa).
create type public.content_status as enum (
  'idea',
  'researching',
  'scripting',
  'ready_to_record',
  'recorded',
  'editing',
  'awaiting_approval',
  'scheduled',
  'published',
  'repurpose',
  'archived',
  'canceled'
);

-- Janelas de leitura de métricas (metric_snapshots aceita múltiplas leituras
-- por conteúdo: 24h, 7d, 30d ou uma janela customizada).
create type public.metric_window as enum (
  '24h',
  '7d',
  '30d',
  'custom'
);
