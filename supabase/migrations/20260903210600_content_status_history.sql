-- content_status_history: histórico imutável de mudanças de status de cada
-- content_item. Toda mudança de status DEVE gerar uma linha aqui, com status
-- anterior, novo status, data e usuário responsável.
create table public.content_status_history (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  previous_status public.content_status,
  new_status public.content_status not null,
  changed_at timestamptz not null default now()
);

comment on table public.content_status_history is
  'Histórico imutável de mudanças de status de um content_item (previous_status, new_status, data, usuário). Gerado automaticamente por trigger, nunca editado manualmente.';

create index content_status_history_content_item_id_idx
  on public.content_status_history (content_item_id);
create index content_status_history_changed_at_idx
  on public.content_status_history (changed_at);

alter table public.content_status_history enable row level security;

create policy "content_status_history_select_own"
  on public.content_status_history for select
  using (user_id = auth.uid());

create policy "content_status_history_insert_own"
  on public.content_status_history for insert
  with check (user_id = auth.uid());

-- Sem policy de update/delete: o Postgres nega por padrão qualquer comando
-- sem policy correspondente, tornando o histórico efetivamente imutável.

-- Registra o status inicial ao criar um content_item.
create or replace function public.log_content_item_created()
returns trigger
language plpgsql
security invoker
as $$
begin
  insert into public.content_status_history (content_item_id, user_id, previous_status, new_status)
  values (new.id, coalesce(auth.uid(), new.user_id), null, new.status);
  return new;
end;
$$;

create trigger content_items_log_created
  after insert on public.content_items
  for each row execute function public.log_content_item_created();

-- Registra toda mudança de status em UPDATE (ignora updates que não mudam status).
create or replace function public.log_content_item_status_change()
returns trigger
language plpgsql
security invoker
as $$
begin
  if new.status is distinct from old.status then
    insert into public.content_status_history (content_item_id, user_id, previous_status, new_status)
    values (new.id, coalesce(auth.uid(), new.user_id), old.status, new.status);
  end if;
  return new;
end;
$$;

create trigger content_items_log_status_change
  after update on public.content_items
  for each row execute function public.log_content_item_status_change();
