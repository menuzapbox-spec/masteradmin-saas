# PHASE 15 — FRETE CONFIGURÁVEL POR LOJA

- Cada loja pode ativar/desativar frete grátis no Admin.
- Quando o frete grátis está desativado, o valor definido pelo lojista é acrescentado automaticamente ao carrinho e ao pedido.
- A informação aparece no topo do cardápio público, no carrinho, checkout e mensagem do WhatsApp.
- A configuração usa a coluna `payment_methods` (jsonb) já existente em `store_settings`, preservando o schema atual e evitando novo SQL.
- Valores antigos continuam funcionando: ausência de configuração significa frete grátis.
- Nenhuma configuração de catálogo, categorias, produtos, planos ou impressora foi removida.
