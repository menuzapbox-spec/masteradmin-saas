# Phase 6 — Integração e isolamento final do fluxo público

Esta fase parte integralmente da Phase 5 e não exige novo SQL.

## Objetivos

- manter o fluxo multi-loja baseado em `store_id`;
- respeitar o status global da loja no site público;
- respeitar `operation_status` no bloqueio de novos pedidos;
- remover do cliente as leituras restantes das tabelas legadas de configuração;
- manter pagamentos disponíveis com o comportamento padrão atual até existir uma configuração multi-loja própria;
- evitar que nome/endereço do cliente de uma loja apareçam em outra loja no mesmo navegador;
- manter categorias, produtos, adicionais, carrinho, pedido e WhatsApp no mesmo tenant.

## Fluxo validado estruturalmente

`SUPER ADMIN → LOJA DEMO → ADMIN → CATEGORIA → PRODUTO → ADICIONAL → SITE → CARRINHO → PEDIDO`

## Regras públicas

- `TRIAL` e `ACTIVE`: site público disponível.
- `PAUSED`: site informa que a loja está temporariamente pausada.
- `DISABLED`: site informa que a loja está indisponível.
- `operation_status != OPEN`: o carrinho impede a continuação para checkout.

## Importante

Não executar SQL novo nesta fase. O banco continua sendo o projeto Supabase novo criado para o SaaS. Os projetos antigos permanecem separados.
