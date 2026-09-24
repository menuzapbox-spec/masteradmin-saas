-- Grazia White Label v2.0 - Supabase
-- Execute this script in Supabase SQL Editor.
-- The public client uses only the anon key. Never put the service_role key in Vite/Render VITE_* variables.

create extension if not exists pgcrypto;

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.catalogo (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.configuracoes (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.duvidas (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalogo_touch on public.catalogo;
create trigger catalogo_touch before update on public.catalogo for each row execute function public.touch_updated_at();
drop trigger if exists configuracoes_touch on public.configuracoes;
create trigger configuracoes_touch before update on public.configuracoes for each row execute function public.touch_updated_at();
drop trigger if exists config_touch on public.config;
create trigger config_touch before update on public.config for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins a
    where a.id = auth.uid() and a.ativo = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admins enable row level security;
alter table public.catalogo enable row level security;
alter table public.configuracoes enable row level security;
alter table public.config enable row level security;
alter table public.pedidos enable row level security;
alter table public.duvidas enable row level security;


-- Data API privileges. RLS remains the final authorization layer.
grant select on public.catalogo, public.configuracoes, public.config to anon, authenticated;
grant select, insert, update, delete on public.catalogo, public.configuracoes, public.config to authenticated;
grant insert on public.pedidos, public.duvidas to anon, authenticated;
grant select, insert, update, delete on public.pedidos, public.duvidas to authenticated;
grant select on public.admins to authenticated;


drop policy if exists admins_select on public.admins;
create policy admins_select on public.admins for select using (auth.uid() = id or public.is_admin());
drop policy if exists admins_write on public.admins;
create policy admins_write on public.admins for all using (false) with check (false);

drop policy if exists catalogo_public_read on public.catalogo;
create policy catalogo_public_read on public.catalogo for select using (true);
drop policy if exists catalogo_admin_write on public.catalogo;
create policy catalogo_admin_write on public.catalogo for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists configuracoes_public_read on public.configuracoes;
create policy configuracoes_public_read on public.configuracoes for select using (true);
drop policy if exists configuracoes_admin_write on public.configuracoes;
create policy configuracoes_admin_write on public.configuracoes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists config_public_read on public.config;
create policy config_public_read on public.config for select using (true);
drop policy if exists config_admin_write on public.config;
create policy config_admin_write on public.config for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists pedidos_public_insert on public.pedidos;
create policy pedidos_public_insert on public.pedidos for insert with check (true);
drop policy if exists pedidos_admin_all on public.pedidos;
create policy pedidos_admin_all on public.pedidos for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists duvidas_public_insert on public.duvidas;
create policy duvidas_public_insert on public.duvidas for insert with check (true);
drop policy if exists duvidas_admin_all on public.duvidas;
create policy duvidas_admin_all on public.duvidas for all using (public.is_admin()) with check (public.is_admin());

-- Storage: one public bucket for product/category/store images.
insert into storage.buckets (id, name, public)
values ('cardapio', 'cardapio', true)
on conflict (id) do update set public = true;

drop policy if exists cardapio_public_read on storage.objects;
create policy cardapio_public_read on storage.objects for select using (bucket_id = 'cardapio');
drop policy if exists cardapio_admin_insert on storage.objects;
create policy cardapio_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'cardapio' and public.is_admin());
drop policy if exists cardapio_admin_update on storage.objects;
create policy cardapio_admin_update on storage.objects for update to authenticated using (bucket_id = 'cardapio' and public.is_admin()) with check (bucket_id = 'cardapio' and public.is_admin());
drop policy if exists cardapio_admin_delete on storage.objects;
create policy cardapio_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'cardapio' and public.is_admin());

-- Enable Realtime for the tables used by the UI.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'catalogo') then
    alter publication supabase_realtime add table public.catalogo;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'configuracoes') then
    alter publication supabase_realtime add table public.configuracoes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'config') then
    alter publication supabase_realtime add table public.config;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pedidos') then
    alter publication supabase_realtime add table public.pedidos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'duvidas') then
    alter publication supabase_realtime add table public.duvidas;
  end if;
end $$;

-- After creating the Admin user in Authentication, insert its UID here:
-- insert into public.admins (id, ativo) values ('COLE-O-UID-DO-USUARIO-AQUI', true);
