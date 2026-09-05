-- Prompt 13: configurações auditáveis, lotes idempotentes de importação e rastreabilidade legada.
alter table public.app_settings
  add column priorities text[] not null default array['alta','media','baixa'],
  add column stalled_idea_days smallint not null default 45,
  add column minimum_ideas_per_pillar smallint not null default 3;

alter table public.app_settings
  add constraint app_settings_weekly_target_nonnegative check (weekly_publish_target is null or weekly_publish_target >= 0),
  add constraint app_settings_stalled_days_positive check (stalled_idea_days > 0),
  add constraint app_settings_minimum_ideas_nonnegative check (minimum_ideas_per_pillar >= 0);

alter table public.content_series add column archived_at timestamptz;
create index content_series_user_active_idx on public.content_series(user_id, name) where archived_at is null;

create table public.taxonomy_options (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('pillar','format','objective','cta','priority')),
  value text not null check (btrim(value) <> ''),
  is_system boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index taxonomy_options_user_kind_value_key on public.taxonomy_options(user_id, kind, lower(value));
create index taxonomy_options_user_kind_idx on public.taxonomy_options(user_id, kind) where archived_at is null;
alter table public.taxonomy_options enable row level security;
create policy taxonomy_options_select_own on public.taxonomy_options for select to authenticated using ((select auth.uid()) = user_id);
create policy taxonomy_options_insert_own on public.taxonomy_options for insert to authenticated with check ((select auth.uid()) = user_id);
create policy taxonomy_options_update_own on public.taxonomy_options for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create trigger set_taxonomy_options_updated_at before update on public.taxonomy_options for each row execute function public.set_updated_at();

create table public.taxonomy_change_audit (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, old_value text not null, new_value text, action text not null check (action in ('archive','replace')),
  affected_rows integer not null default 0, created_at timestamptz not null default now()
);
create index taxonomy_change_audit_user_created_idx on public.taxonomy_change_audit(user_id, created_at desc);
alter table public.taxonomy_change_audit enable row level security;
create policy taxonomy_change_audit_select_own on public.taxonomy_change_audit for select to authenticated using ((select auth.uid()) = user_id);
create policy taxonomy_change_audit_insert_own on public.taxonomy_change_audit for insert to authenticated with check ((select auth.uid()) = user_id);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.instagram_accounts(id) on delete set null,
  file_name text not null, file_hash text not null, status text not null default 'preview' check (status in ('preview','confirmed','completed','failed')),
  schema_version text not null default '1.0', detected_sheets jsonb not null default '[]', mapping jsonb not null default '{}',
  payload jsonb not null default '{}', report jsonb not null default '{}', confirmed_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index import_batches_user_hash_key on public.import_batches(user_id, file_hash);
create index import_batches_user_created_idx on public.import_batches(user_id, created_at desc);
alter table public.import_batches enable row level security;
create policy import_batches_select_own on public.import_batches for select to authenticated using ((select auth.uid()) = user_id);
create policy import_batches_insert_own on public.import_batches for insert to authenticated with check ((select auth.uid()) = user_id and (account_id is null or exists(select 1 from public.instagram_accounts a where a.id=account_id and a.user_id=(select auth.uid()))));
create policy import_batches_update_own on public.import_batches for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create trigger set_import_batches_updated_at before update on public.import_batches for each row execute function public.set_updated_at();

create table public.import_entity_links (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  module text not null, legacy_id text not null, entity_id uuid not null, created_at timestamptz not null default now()
);
create unique index import_entity_links_user_module_legacy_key on public.import_entity_links(user_id,module,legacy_id);
create index import_entity_links_batch_idx on public.import_entity_links(import_batch_id);
alter table public.import_entity_links enable row level security;
create policy import_entity_links_select_own on public.import_entity_links for select to authenticated using ((select auth.uid()) = user_id);
create policy import_entity_links_insert_own on public.import_entity_links for insert to authenticated with check ((select auth.uid()) = user_id and exists(select 1 from public.import_batches b where b.id=import_batch_id and b.user_id=(select auth.uid())));

revoke all on public.taxonomy_options, public.taxonomy_change_audit, public.import_batches, public.import_entity_links from anon, authenticated;
grant select, insert, update on public.taxonomy_options to authenticated;
grant select, insert on public.taxonomy_change_audit to authenticated;
grant select, insert, update on public.import_batches to authenticated;
grant select, insert on public.import_entity_links to authenticated;

-- Uma substituição atualiza todas as referências textuais numa única transação e registra seu impacto.
create or replace function public.replace_taxonomy_option(p_kind text, p_old text, p_new text)
returns integer language plpgsql security invoker set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_count integer := 0; v_step integer;
begin
  if v_user is null or p_kind not in ('pillar','format','objective','cta','priority') or btrim(p_new)='' then raise exception 'Parâmetros inválidos'; end if;
  if p_kind='pillar' then update public.content_items set pillar=p_new where user_id=v_user and lower(pillar)=lower(p_old);
  elsif p_kind='format' then update public.content_items set format=p_new where user_id=v_user and lower(format)=lower(p_old);
  elsif p_kind='objective' then update public.content_items set objective=p_new where user_id=v_user and lower(objective)=lower(p_old);
  elsif p_kind='cta' then update public.content_items set cta=p_new where user_id=v_user and lower(cta)=lower(p_old);
  else update public.content_items set priority=p_new where user_id=v_user and lower(priority)=lower(p_old); end if;
  get diagnostics v_count = row_count;
  update public.taxonomy_options set archived_at=now() where user_id=v_user and kind=p_kind and lower(value)=lower(p_old);
  insert into public.taxonomy_options(user_id,kind,value) values(v_user,p_kind,p_new) on conflict do nothing;
  insert into public.taxonomy_change_audit(user_id,kind,old_value,new_value,action,affected_rows) values(v_user,p_kind,p_old,p_new,'replace',v_count);
  return v_count;
end $$;
revoke execute on function public.replace_taxonomy_option(text,text,text) from public, anon;
grant execute on function public.replace_taxonomy_option(text,text,text) to authenticated;

-- Aplica o conteúdo já sanitizado do lote. A função inteira é atômica: qualquer erro desfaz tudo.
create or replace function public.apply_import_batch(p_batch_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_batch public.import_batches%rowtype; v_row jsonb; v_id uuid; v_count int:=0; v_updated int:=0; v_skipped int:=0;
begin
  select * into v_batch from public.import_batches where id=p_batch_id and user_id=v_user for update;
  if not found then raise exception 'Lote não encontrado'; end if;
  if v_batch.status='completed' then return v_batch.report; end if;
  if v_batch.status <> 'confirmed' then raise exception 'Confirmação explícita obrigatória'; end if;
  for v_row in select value from jsonb_array_elements(coalesce(v_batch.payload->'content_items','[]')) loop
    select entity_id into v_id from public.import_entity_links where user_id=v_user and module='content_items' and legacy_id=v_row->>'legacy_id';
    if v_id is not null and coalesce(v_row->>'resolution','skip')='skip' then v_skipped:=v_skipped+1; continue; end if;
    if v_id is not null and v_row->>'resolution'='update' then
      update public.content_items set title=coalesce(nullif(v_row->>'title',''),title), hook=v_row->>'hook', summary=v_row->>'summary', pillar=v_row->>'pillar', format=v_row->>'format', objective=v_row->>'objective', cta=v_row->>'cta', priority=v_row->>'priority', status=coalesce(nullif(v_row->>'status','')::public.content_status,status), planned_at=nullif(v_row->>'planned_at','')::timestamptz, published_at=nullif(v_row->>'published_at','')::timestamptz, published_url=v_row->>'published_url', notes=v_row->>'notes' where id=v_id and user_id=v_user;
      v_updated:=v_updated+1;
    else
      insert into public.content_items(user_id,account_id,title,hook,summary,pillar,format,objective,cta,priority,status,potential,production_ease,reference_text,reference_url,planned_at,production_due_at,published_at,published_url,notes)
      values(v_user,v_batch.account_id,v_row->>'title',v_row->>'hook',v_row->>'summary',v_row->>'pillar',v_row->>'format',v_row->>'objective',v_row->>'cta',v_row->>'priority',coalesce(nullif(v_row->>'status','')::public.content_status,'idea'),v_row->>'potential',v_row->>'production_ease',v_row->>'reference_text',v_row->>'reference_url',nullif(v_row->>'planned_at','')::timestamptz,nullif(v_row->>'production_due_at','')::timestamptz,nullif(v_row->>'published_at','')::timestamptz,v_row->>'published_url',v_row->>'notes') returning id into v_id;
      if nullif(v_row->>'legacy_id','') is not null then insert into public.import_entity_links(user_id,import_batch_id,module,legacy_id,entity_id) values(v_user,p_batch_id,'content_items',v_row->>'legacy_id',v_id) on conflict do nothing; end if;
      v_count:=v_count+1;
    end if;
  end loop;
  update public.import_batches set status='completed',completed_at=now(),report=jsonb_build_object('read',jsonb_array_length(coalesce(payload->'content_items','[]')),'imported',v_count,'updated',v_updated,'ignored',v_skipped,'rejected',jsonb_array_length(coalesce(payload->'errors','[]'))) where id=p_batch_id;
  select report into v_row from public.import_batches where id=p_batch_id; return v_row;
end $$;
revoke execute on function public.apply_import_batch(uuid) from public, anon;
grant execute on function public.apply_import_batch(uuid) to authenticated;
