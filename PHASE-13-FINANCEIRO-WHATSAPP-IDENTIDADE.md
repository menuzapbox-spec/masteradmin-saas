# PHASE 13 — Financeiro, vencimentos, WhatsApp por loja e identidade

Base: Phase 12.

## Alterações
- Dashboard financeiro exclusivo do Super Admin.
- Controle de mensalidade por loja: plano, valor, pagamento pendente/pago e vencimento.
- Botão para marcar mensalidade como paga.
- Avisos gerais para loja sem plano, pagamento pendente e vencimento próximo/vencido.
- Contagem regressiva dos planos permanece persistida em `store_subscriptions`.
- Relógio/data no cabeçalho do Super Admin.
- Checkout compatível com schemas que ainda não possuíam `delivery_type` e outros campos.
- WhatsApp do checkout passa a usar exclusivamente o WhatsApp salvo nas configurações da loja (`store_settings.whatsapp`), evitando reaproveitar telefone antigo.
- Logo da loja pode ser carregado pelo administrador e fica em `store_settings.logo_url`.
- Endereço, cidade e WhatsApp também são persistidos nas configurações da loja.
- Chave Pix e beneficiário continuam vinculados à loja e aparecem no pedido quando o cliente escolhe Pix.
- Modo claro/escuro e acessibilidade existentes foram preservados.

## SQL desta fase
Execute somente:
`SUPABASE-PHASE13-FINANCE-CHECKOUT.sql`

Ele adiciona colunas ausentes de compatibilidade, campos de pagamento/identidade, atualiza a função pública do checkout e mantém RLS dos planos exclusivo para Super Admin.

## Observação
Não foi alterado o catálogo, categorias, produtos, adicionais, rota pública ou a estrutura visual existente além dos pontos solicitados.
