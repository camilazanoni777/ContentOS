-- Fase 5 - campos especificos do Banco de Ideias que ainda nao existiam no
-- registro central. Nao cria uma tabela de ideias: todas as visoes continuam
-- lendo e atualizando public.content_items.
alter table public.content_items
  add column can_be_series boolean not null default false,
  add column notes text,
  add column tags text[] not null default '{}';

comment on column public.content_items.can_be_series is
  'Marca ideias com potencial para se tornarem serie; a serie associada continua em series_id.';
comment on column public.content_items.notes is
  'Observacoes gerais do item no Banco de Ideias.';
comment on column public.content_items.tags is
  'Tags livres para busca e organizacao do Banco de Ideias.';

create index content_items_tags_idx on public.content_items using gin (tags);
