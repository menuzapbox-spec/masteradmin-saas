# PHASE 14 — Pausa de catálogo, vencimentos e WhatsApp/PIX

## Alterações
- Super Admin: seção **Vencimentos** com destaque e contador para lojas com vencimento próximo.
- Catálogo: botões **Pausar/Ativar** para categorias e produtos. A vitrine pública já respeita `active`.
- Checkout: botão **Copiar chave Pix**.
- Checkout: antes de abrir o WhatsApp, o sistema consulta novamente o WhatsApp salvo na configuração da loja, evitando usar número antigo em cache.
- Mensagem Pix usa a chave e beneficiário atuais da loja.

## Banco
Esta fase não exige novo SQL: usa os campos `active` já existentes em categorias/produtos e as tabelas de planos/assinaturas já criadas na fase anterior.
