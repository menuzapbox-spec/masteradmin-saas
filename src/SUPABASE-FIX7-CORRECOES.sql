-- FIX 7 — checkout, pagamentos, WhatsApp e fotos
-- Execute UMA vez no NOVO projeto Supabase.
-- Este arquivo é idempotente: pode ser executado mesmo que algumas partes já existam.

-- 1) Compatibilidade com pedidos criados pelo checkout atual.
alter table public.orders add column if not exists customer_reference text;

-- 2) Configurações por loja.
alter table public.stores add column if not exists whatsapp text;
alter table public.store_settings add column if not exists pix_key text;
alter table public.store_settings add column if not exists pix_beneficiary text;
alter table public.store_settings add column if not exists payment_methods jsonb not null default '{"pix":true,"debito":true,"credito":true,"dinheiro":true}'::jsonb;

insert into public.store_settings (store_id, payment_methods)
select s.id, '{"pix":true,"debito":true,"credito":true,"dinheiro":true}'::jsonb
from public.stores s
where not exists (select 1 from public.store_settings ss where ss.store_id = s.id);

-- 3) Bucket das fotos dos produtos.
insert into storage.buckets (id, name, public)
values ('cardapio', 'cardapio', true)
on conflict (id) do update set public = excluded.public;

-- 4) Permissões de Storage por loja.
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

-- 5) Checkout público: valida a loja, grava pedido + itens e retorna o ID.
create or replace function public.create_public_order(
  p_order jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_store_id uuid;
  v_store_status text;
  v_operation_status text;
  v_item jsonb;
  v_product_id uuid;
begin
  v_store_id := nullif(p_order->>'store_id', '')::uuid;

  if v_store_id is null then
    raise exception 'Loja não identificada.' using errcode = 'P0001';
  end if;

  select status::text, operation_status::text
    into v_store_status, v_operation_status
  from public.stores
  where id = v_store_id;

  if not found then
    raise exception 'Loja não encontrada.' using errcode = 'P0001';
  end if;

  if v_store_status not in ('TRIAL', 'ACTIVE') then
    raise exception 'A loja não está disponível para receber pedidos.' using errcode = 'P0001';
  end if;

  if v_operation_status <> 'OPEN' then
    raise exception 'A loja está fechada para novos pedidos.' using errcode = 'P0001';
  end if;

  insert into public.orders (
    store_id,
    customer_name,
    customer_address,
    customer_reference,
    delivery_type,
    payment_method,
    change_for,
    observation,
    subtotal,
    delivery_fee,
    total
  ) values (
    v_store_id,
    coalesce(p_order->>'customer_name', ''),
    coalesce(p_order->>'customer_address', ''),
    coalesce(p_order->>'customer_reference', ''),
    coalesce(p_order->>'delivery_type', 'entrega'),
    coalesce(p_order->>'payment_method', ''),
    case when nullif(p_order->>'change_for', '') is null then null else (p_order->>'change_for')::numeric end,
    coalesce(p_order->>'observation', ''),
    coalesce((p_order->>'subtotal')::numeric, 0),
    coalesce((p_order->>'delivery_fee')::numeric, 0),
    coalesce((p_order->>'total')::numeric, 0)
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;

    if v_product_id is not null and not exists (
      select 1 from public.products p
      where p.id = v_product_id and p.store_id = v_store_id
    ) then
      raise exception 'Produto inválido para esta loja.' using errcode = 'P0001';
    end if;

    insert into public.order_items (
      order_id, store_id, product_id, product_name, quantity, unit_price, addons, total
    ) values (
      v_order_id,
      v_store_id,
      v_product_id,
      coalesce(v_item->>'product_name', ''),
      coalesce((v_item->>'quantity')::integer, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      coalesce(v_item->'addons', '[]'::jsonb),
      coalesce((v_item->>'total')::numeric, 0)
    );
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_public_order(jsonb, jsonb) from public;
grant execute on function public.create_public_order(jsonb, jsonb) to anon, authenticated;
