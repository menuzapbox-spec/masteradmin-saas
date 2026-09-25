-- Phase: Planos SaaS + vencimento exclusivo do Super Admin + configuração de impressora por loja
-- Execute UMA vez no NOVO projeto Supabase.

create table if not exists public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_price numeric(10,2) not null default 0,
  duration_days integer not null default 30 check (duration_days > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.store_subscriptions (
  store_id uuid primary key references public.stores(id) on delete cascade,
  plan_id uuid references public.saas_plans(id) on delete set null,
  started_at timestamptz,
  expires_at timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','EXPIRED','CANCELLED')),
  updated_at timestamptz not null default now()
);

alter table public.store_settings add column if not exists printer_config jsonb not null default '{"width_mm":58,"auto_print":false}'::jsonb;

alter table public.saas_plans enable row level security;
alter table public.store_subscriptions enable row level security;

drop policy if exists saas_plans_super_admin_all on public.saas_plans;
create policy saas_plans_super_admin_all on public.saas_plans
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists store_subscriptions_super_admin_all on public.store_subscriptions;
create policy store_subscriptions_super_admin_all on public.store_subscriptions
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Mantém a configuração da impressora disponível apenas para a própria loja/super admin
-- pelas políticas já existentes de store_settings.

-- Verificação
select id,name,monthly_price,duration_days,active from public.saas_plans order by created_at desc;
