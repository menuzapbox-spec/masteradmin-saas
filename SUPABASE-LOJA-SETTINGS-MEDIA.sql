-- Migração da Phase 10 - configurações por loja + pagamentos + fotos
-- NOVO projeto Supabase do Delivery SaaS.
-- Execute uma única vez no SQL Editor.

alter table public.stores add column if not exists whatsapp text;
alter table public.stores add column if not exists address text;
alter table public.stores add column if not exists city text;

alter table public.store_settings add column if not exists pix_key text;
alter table public.store_settings add column if not exists pix_beneficiary text;
alter table public.store_settings add column if not exists payment_methods jsonb not null default '{"pix":true,"debito":true,"credito":true,"dinheiro":true}'::jsonb;

create unique index if not exists store_settings_store_id_unique on public.store_settings(store_id);

-- Garante que toda loja já existente tenha uma linha de configurações.
insert into public.store_settings (store_id, payment_methods)
select s.id, '{"pix":true,"debito":true,"credito":true,"dinheiro":true}'::jsonb
from public.stores s
where not exists (
  select 1 from public.store_settings ss where ss.store_id = s.id
);

-- Storage: cada loja grava suas fotos em stores/{STORE_ID}/...
-- A leitura continua pública; escrita fica limitada ao Super Admin ou ao
-- administrador da própria loja.
drop policy if exists cardapio_public_read on storage.objects;
create policy cardapio_public_read
on storage.objects for select
using (bucket_id = 'cardapio');

drop policy if exists cardapio_admin_insert on storage.objects;
create policy cardapio_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'cardapio'
  and (
    public.is_super_admin()
    or public.current_store_id() = nullif(split_part(name, '/', 2), '')::uuid
  )
);

drop policy if exists cardapio_admin_update on storage.objects;
create policy cardapio_admin_update
on storage.objects for update to authenticated
using (
  bucket_id = 'cardapio'
  and (
    public.is_super_admin()
    or public.current_store_id() = nullif(split_part(name, '/', 2), '')::uuid
  )
)
with check (
  bucket_id = 'cardapio'
  and (
    public.is_super_admin()
    or public.current_store_id() = nullif(split_part(name, '/', 2), '')::uuid
  )
);

drop policy if exists cardapio_admin_delete on storage.objects;
create policy cardapio_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'cardapio'
  and (
    public.is_super_admin()
    or public.current_store_id() = nullif(split_part(name, '/', 2), '')::uuid
  )
);

-- Confirmação visual no SQL Editor: uma linha por loja.
select s.name, s.slug, s.whatsapp, ss.pix_key, ss.payment_methods
from public.stores s
left join public.store_settings ss on ss.store_id = s.id
order by s.created_at desc;
