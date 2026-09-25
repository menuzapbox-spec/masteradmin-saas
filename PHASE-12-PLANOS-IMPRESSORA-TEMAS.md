# Phase 12 — Planos SaaS, vencimentos, impressora e temas

## O que foi incluído
- Planos SaaS configuráveis pelo Super Admin.
- Valor mensal e duração em dias definidos pelo Super Admin.
- Assinatura por loja com início e vencimento.
- Contagem regressiva por loja.
- Aviso de vencimento próximo (até 7 dias), visível somente ao Super Admin.
- Configuração de impressora por loja em ESC/POS 58 mm ou 80 mm.
- Conexão USB e Bluetooth pelo navegador quando suportada.
- Teste de impressão.
- Configuração de impressão automática armazenada por loja.
- Modo claro/escuro no painel administrativo, com preferência salva no navegador.
- O cliente já possuía suporte a claro/escuro; ele foi preservado.

## SQL
Execute uma única vez:
`SUPABASE-SAAS-PLANOS-IMPRESSORA.sql`

Não execute os SQL antigos novamente.

## Planos
O Super Admin cria um plano informando:
- nome
- valor mensal
- duração em dias

Depois, no cartão da loja, seleciona o plano e clica em **Aplicar plano**. A contagem começa no momento da aplicação.

## Segurança
As tabelas de planos e assinaturas têm RLS e ficam acessíveis somente ao `super_admin`. O administrador de uma loja não recebe esses dados pela API.

## Impressora
A configuração fica em `store_settings.printer_config` e é isolada por `store_id`.
