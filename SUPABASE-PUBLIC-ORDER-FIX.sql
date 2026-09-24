-- CORREÇÃO DO CHECKOUT PÚBLICO MULTI-LOJA
--
-- Esta migration é necessária porque o cliente final não faz login no Supabase.
-- O checkout chama a função abaixo, que grava orders + order_items em uma única
-- transação e não depende de liberar INSERT público diretamente nas tabelas.
--
-- Execute este arquivo UMA VEZ no SQL Editor do NOVO projeto Supabase.
-- Não execute os SQL antigos do projeto Grazia/Firebase.

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

    if v_product_id is not null then
      if not exists (
        select 1 from public.products p
        where p.id = v_product_id
          and p.store_id = v_store_id
      ) then
        raise exception 'Produto inválido para esta loja.' using errcode = 'P0001';
      end if;
    end if;

    insert into public.order_items (
      order_id,
      store_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      addons,
      total
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
