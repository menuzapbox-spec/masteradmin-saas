# Fase 7 — Integração e validação do fluxo multi-loja

A Fase 7 consolida os fluxos das Fases 1–6 sem alterar a arquitetura do banco e sem exigir novo SQL.

## Ajuste aplicado

- O checkout agora bloqueia a criação/envio de novos pedidos quando a loja está fechada, respeitando `operation_status` e o horário configurado em `store_settings`.
- A gravação do pedido continua usando `store_id` da loja identificada pelo slug.
- O catálogo continua limitado ao `store_id` atual.
- Carrinho, nome, endereço e referência do cliente continuam separados por loja no `localStorage`.
- Admin continua usando Supabase Auth + `profiles` + `store_id`.

## Checklist de validação no Supabase

1. Entrar no Admin como `super_admin`.
2. Confirmar a Loja Demo e selecionar uma loja.
3. Criar/editar categoria, produto e adicional.
4. Alterar status da loja entre `TRIAL`, `ACTIVE`, `PAUSED` e `DISABLED` conforme o teste.
5. Alterar `operation_status` entre `OPEN`, `CLOSED` e `PAUSED`.
6. Abrir `/loja/{slug}` da loja ativa e conferir categorias, produtos e adicionais.
7. Adicionar produtos ao carrinho e confirmar quantidades.
8. Com a loja fechada, confirmar que o checkout não permite registrar/enviar pedido.
9. Reabrir a loja, testar checkout e conferir `orders` e `order_items` com o `store_id` correto.
10. Criar uma segunda loja e repetir o teste, confirmando que os catálogos ficam isolados por `store_id`.
11. Criar um usuário no Supabase Auth, fazer login uma vez e vinculá-lo como `owner` à segunda loja.
12. Entrar com o `owner` e confirmar que ele não consegue acessar dados de outra loja.

## Observação

O build local depende da instalação das dependências do projeto (`npm install`). Nesta validação do ambiente de trabalho, a instalação excedeu o tempo disponível; por isso o build não foi declarado como aprovado. O código alterado foi mantido pequeno e isolado.
