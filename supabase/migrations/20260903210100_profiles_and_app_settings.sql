-- profiles: um registro por usuário autenticado (id = auth.users.id).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil básico de cada usuário autenticado.';

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Sem policy de insert/delete: a linha é criada apenas pelo trigger
-- handle_new_user() e removida via cascade quando o usuário é excluído.

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- app_settings: preferências e listas configuráveis por usuário
-- (pilares, formatos, objetivos, ctas etc. usados nos formulários de conteúdo).
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  timezone text not null default 'America/Sao_Paulo',
  pillars text[] not null default '{}',
  formats text[] not null default '{}',
  objectives text[] not null default '{}',
  ctas text[] not null default '{}',
  weekly_publish_target smallint,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is 'Preferências e listas configuráveis por usuário.';

alter table public.app_settings enable row level security;

create policy "app_settings_select_own"
  on public.app_settings for select
  using (user_id = auth.uid());

create policy "app_settings_update_own"
  on public.app_settings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger set_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Cria profiles + app_settings automaticamente quando um novo usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.app_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
