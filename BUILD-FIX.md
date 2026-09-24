CORREÇÃO DE BUILD - 19/08/2026

O erro do deploy foi tratado removendo o uso do ícone IceCreamBowl do lucide-react
na LandingHero.jsx. Esse ícone não é garantido pela versão do lucide-react declarada
no package.json (^0.344.0) e pode provocar falha de resolução/export durante o Rollup.

A landing agora usa ShoppingBag, que já é compatível com a versão declarada.

Validação local realizada:
- todos os arquivos JS/JSX foram analisados pelo TypeScript e não apresentaram erros de sintaxe;
- package.json e vite.config.js permanecem válidos;
- não foram removidas as funcionalidades do carrinho, observação, checkout, Supabase,
  WhatsApp ou botão de dúvidas.

No Render:
1. Substitua os arquivos pelo conteúdo deste ZIP.
2. Faça um novo deploy.
3. O build deve executar `npm install && npm run build` conforme render.yaml.
