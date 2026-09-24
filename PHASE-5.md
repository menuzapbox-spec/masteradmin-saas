# Phase 5 — Adicionais e gestão operacional multi-loja

Esta versão parte da Phase 4 e acrescenta:

- gerenciamento de adicionais por produto e por loja;
- criação, edição, ativação/inativação e exclusão de adicionais;
- seleção da loja atual antes das operações administrativas;
- configurações de status da plataforma (`TRIAL`, `ACTIVE`, `PAUSED`, `DISABLED`);
- status operacional (`OPEN`, `CLOSED`, `PAUSED`);
- vinculação de um usuário Supabase já existente a uma loja pelo UUID, alterando seu perfil para `owner`;
- preservação do isolamento por `store_id` e das políticas RLS existentes.

Não é necessário executar SQL novo para esta Phase. A conta do administrador deve existir previamente no Supabase Auth.
