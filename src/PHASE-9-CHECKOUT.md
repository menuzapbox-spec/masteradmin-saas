# Fase 9 — Checkout público multi-loja

## Correção

O checkout público não usa login do cliente. Por isso, uma gravação direta em `orders`/`order_items` pode ser bloqueada pelas políticas RLS do Supabase.

A Fase 9 usa a função `create_public_order` (`SECURITY DEFINER`) para:

- validar `store_id`;
- aceitar pedidos somente para lojas `TRIAL` ou `ACTIVE`;
- aceitar pedidos somente quando `operation_status = OPEN`;
- gravar `orders` e `order_items` em uma única transação;
- validar o `product_id` contra a loja do pedido;
- retornar o ID do pedido ao frontend;
- só depois disso o frontend abre o WhatsApp.

## Instalação

Execute `SUPABASE-PUBLIC-ORDER-FIX.sql` uma única vez no SQL Editor do NOVO projeto Supabase.

Não execute os SQL antigos do projeto anterior.
