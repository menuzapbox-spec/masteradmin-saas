-- PHASE 13: financeiro SaaS, vencimentos, identidade da loja e checkout compatível
-- Execute UMA vez no NOVO projeto Supabase.
-- Não execute SQL antigo do projeto Grazia/Firebase.

-- 1) Mantém o checkout compatível com versões anteriores do schema.
alter table public.orders add column if not exists customer_reference text;
alter table public.orders add column if not exists delivery_type text default 'entrega';
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists change_for numeric(10,2);
alter table public.orders add column if not exists observation text;
alter table public.orders add column if not exists subtotal numeric(10,2) default 0;
alter table public.orders add column if not exists delivery_fee numeric(10,2) default 0;
alter table public.orders add column if not exists total numeric(10,2) default 0;
alter table public.orders add column if not exists payment_status text default 'PENDING';
alter table public.orders add column if not exists paid_at timestamptz;

-- 2) Itens do pedido: garante as colunas usadas pelo checkout público.
alter table public.order_items add column if not exists store_id uuid;
alter table public.order_items add column if not exists product_id uuid;
alter table public.order_items add column if not exists product_name text;
alter table public.order_items add column if not exists quantity integer default 1;
alter table public.order_items add column if not exists unit_price numeric(10,2) default 0;
alter table public.order_items add column if not exists addons jsonb default '[]'::jsonb;
alter table public.order_items add column if not exists total numeric(10,2) default 0;

-- 3) Configurações por loja: WhatsApp, endereço e logomarca ficam na própria loja.
alter table public.store_settings add column if not exists whatsapp text;
alter table public.store_settings add column if not exists address text;
alter table public.store_settings add column if not exists city text;
alter table public.store_settings add column if not exists logo_url text;

-- 4) Controle de pagamento da mensalidade SaaS.
alter table public.store_subscriptions add column if not exists payment_status text not null default 'PENDING';
alter table public.store_subscriptions add column if not exists paid_at timestamptz;

-- 5) Normaliza valores existentes.
update public.store_subscriptions
set payment_status = coalesce(nullif(payment_status,''),'PENDING')
where payment_status is null or payment_status='';

-- 6) Checkout público: valida a loja, valida produtos e grava pedido + itens.
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
    store_id, customer_name, customer_address, customer_reference,
    delivery_type, payment_method, change_for, observation,
    subtotal, delivery_fee, total, payment_status
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
    coalesce((p_order->>'total')::numeric, 0),
    'PENDING'
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
      order_id, store_id, product_id, product_name,
      quantity, unit_price, addons, total
    ) values (
      v_order_id, v_store_id, v_product_id,
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

-- 7) Planos e assinaturas: somente Super Admin vê/edita.
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

-- 8) RLS da configuração continua isolando cada loja conforme as políticas existentes.
-- A função pública não expõe a configuração financeira do lojista.

select 'PHASE 13 OK' as result;
