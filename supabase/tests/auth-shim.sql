-- Shim mínimo do schema "auth" do Supabase, usado apenas nos testes locais
-- (pglite). Não é aplicado em produção — no Supabase real, o schema auth já
-- existe e é gerenciado pela plataforma.
create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- auth.uid(): nos testes, lemos o claim "sub" setado via
-- set_config('request.jwt.claim.sub', ...) para simular o usuário autenticado.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create role authenticated;
create role anon;

-- Importante: usamos "alter default privileges" (não "grant ... on all
-- tables") porque este shim roda ANTES das migrations criarem as tabelas —
-- "on all tables" só afetaria tabelas que já existem no momento em que roda.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

grant usage on schema public to authenticated;
grant usage on schema auth to authenticated;
grant select on auth.users to authenticated;
