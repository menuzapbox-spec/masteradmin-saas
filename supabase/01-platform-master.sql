-- MENU GORILA SaaS
-- Camada de administrador da plataforma.
-- Execute depois do SQL principal do banco SaaS.

create table if not exists public.platform_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

revoke all on public.platform_admins from anon, authenticated;
grant select on public.platform_admins to authenticated;

drop policy if exists "platform_admin_read_own" on public.platform_admins;

create policy "platform_admin_read_own"
on public.platform_admins
for select
to authenticated
using (user_id = (select auth.uid()));

-- Seu usuário Master atual:
insert into public.platform_admins (user_id)
values ('c62196a6-8a21-45a7-8c07-cafa8c309835'::uuid)
on conflict (user_id) do nothing;

-- Verificação:
select
    pa.user_id,
    u.email,
    pa.created_at
from public.platform_admins pa
join auth.users u on u.id = pa.user_id;
