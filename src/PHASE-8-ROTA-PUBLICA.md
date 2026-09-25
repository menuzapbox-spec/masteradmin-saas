# FASE 8 — Rota pública /loja/{slug}

Correção pontual para o site público do SaaS.

## Problema
O React já identifica `/loja/{slug}` em `src/storeContext.js`, mas um Static Site pode responder `Not Found` antes de entregar o `index.html` quando a URL é aberta diretamente.

## Correção
O `vite.config.js` agora gera `dist/404.html` automaticamente a partir de `dist/index.html` após o build. Assim, a rota pública consegue carregar o React mesmo quando acessada diretamente.

A lógica existente de Supabase, lojas, categorias, produtos, adicionais, carrinho e checkout não foi alterada.

## Teste esperado
Após novo deploy, acessar:
`https://SEU-DOMINIO/loja/teste`

O React deve carregar a loja cujo `slug` seja `teste`.
