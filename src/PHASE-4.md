# Phase 4 — Painel administrativo multi-loja

Esta fase substitui o antigo painel baseado em `admins`, `catalogo` e `configuracoes` por uma base administrativa direta no novo schema Supabase.

Inclui:
- login via Supabase Auth;
- leitura do perfil/role atual;
- Super Admin com visão de todas as lojas;
- owner/staff limitados à própria loja pelo RLS;
- criação de novas lojas pelo Super Admin;
- seleção de loja;
- dashboard básico;
- CRUD inicial de categorias;
- CRUD inicial de produtos;
- edição de nome, telefone e cor principal da loja;
- sem uso das tabelas legadas `admins`, `catalogo`, `configuracoes`, `pedidos` ou `duvidas`.

Ainda ficam para fases posteriores: pedidos no painel, adicionais avançados, horários/frete/Pix, relatórios, impressão e gerenciamento completo de usuários/owners.
