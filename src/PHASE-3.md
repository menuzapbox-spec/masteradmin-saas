# Phase 3 — Carrinho e Pedidos Multi-Loja

Esta versão adapta o fluxo de checkout para o novo modelo SaaS.

- Carrinho e observações ficam isolados por slug da loja no localStorage.
- O checkout identifica o `store_id` da loja atual.
- Pedidos são gravados em `orders`.
- Itens são gravados em `order_items`.
- O pedido só é enviado ao WhatsApp depois que a gravação no banco é concluída.
- Produtos carregam `productId` para vinculação futura no painel.

Não executar os arquivos SQL antigos `supabase-schema.sql` ou `SUPABASE-ADMIN-SETUP.sql` desta pasta no novo projeto. A estrutura multi-tenant já foi criada no Supabase.
