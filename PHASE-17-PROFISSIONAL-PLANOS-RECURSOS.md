# PHASE 17 — PROFISSIONALIZAÇÃO DO SAAS / PLANOS E RECURSOS POR LOJA

Base: ZIP 16.

## Regra dos planos
- Todos os planos possuem a mesma base de funcionalidades.
- O Super Admin continua podendo editar nome, valor mensal, duração e disponibilidade de cada plano.
- A assinatura da loja continua persistida em `store_subscriptions`.
- Um plano inativo deixa de aparecer para novas atribuições, mas continua preservado nas assinaturas existentes.
- A ativação/desativação de recursos é feita individualmente por loja pelo Super Admin, sem depender do plano.

## Recursos por loja
Foi criada uma área exclusiva do Super Admin chamada **Recursos**.

Recursos controláveis por loja:
- Pedidos
- Catálogo
- Adicionais
- Impressora térmica
- Formas de pagamento
- Entrega e frete
- Aparência e identidade
- Relatórios e dashboard

As opções são persistidas dentro do JSON `payment_methods.features` da configuração da loja, aproveitando a estrutura já existente e evitando nova migração SQL nesta fase.

## Admin do lojista
- O lojista continua com as opções administrativas completas quando os módulos correspondentes estão habilitados.
- O lojista não recebe acesso às telas de Super Admin, planos, financeiro SaaS ou recursos globais.
- A tela de configuração continua reunindo identidade, WhatsApp, logo, endereço, Pix, pagamentos, frete, status e impressora.

## Dashboard
Foi adicionado um checklist de configuração da loja para indicar itens pendentes antes da operação.

## Pedidos
Foi adicionada uma visão administrativa dos últimos pedidos da loja, isolada por `store_id`.

## Tema e acessibilidade
- Mantidos modo claro/escuro.
- Mantidos alto contraste e letras grandes.
- Mantido relógio do Super Admin.

## Público
- Mantida a rota `/loja/{slug}`.
- Mantida identidade/logo da loja.
- Mantidos WhatsApp, Pix, frete e formas de pagamento da loja.

## Banco de dados
Esta fase não exige novo SQL. Nenhuma tabela existente foi substituída.

## Observação de segurança
Os recursos são armazenados na configuração da loja para esta fase, aproveitando a RLS existente de `store_settings`. Para uma versão comercial definitiva, recomenda-se posteriormente uma coluna/estrutura de feature flags protegida por política específica para impedir alteração desses flags por qualquer administrador da loja mesmo via API direta.
