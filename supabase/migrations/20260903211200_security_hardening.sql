-- Corrige avisos do linter de segurança do Supabase (Database Advisors):
--
-- 1. "Function Search Path Mutable": funções sem search_path fixo podem, em
--    teoria, ser manipuladas por um search_path malicioso na sessão. Fixamos
--    search_path = public nas 3 funções que ainda não tinham isso definido
--    (set_updated_at, log_content_item_created, log_content_item_status_change
--    — handle_new_user já tinha desde a criação).
-- 2. "Public Can Execute SECURITY DEFINER Function": handle_new_user() só
--    deve rodar via trigger em auth.users, nunca ser chamada diretamente via
--    API REST (/rest/v1/rpc/handle_new_user) por um usuário anônimo ou
--    autenticado. Revogamos EXECUTE de PUBLIC (o que remove de anon e
--    authenticated também, já que ambos herdam de PUBLIC por padrão); o
--    trigger continua funcionando normalmente, pois triggers não passam pela
--    checagem de EXECUTE de role.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_content_item_created()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.content_status_history (content_item_id, user_id, previous_status, new_status)
  values (new.id, coalesce(auth.uid(), new.user_id), null, new.status);
  return new;
end;
$$;

create or replace function public.log_content_item_status_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.content_status_history (content_item_id, user_id, previous_status, new_status)
    values (new.id, coalesce(auth.uid(), new.user_id), old.status, new.status);
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;

-- O Supabase concede EXECUTE explicitamente a anon/authenticated/service_role
-- via "alter default privileges" no momento da criação da função (não apenas
-- herdado de PUBLIC) — por isso o revoke de PUBLIC acima não bastou.
-- Revogamos explicitamente de anon e authenticated; mantemos service_role
-- (role de servidor, não exposta publicamente sem a service key).
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
