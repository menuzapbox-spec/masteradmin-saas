# Grazia Sorvetes — versão com navegação aprimorada

Esta versão preserva a arquitetura e as integrações existentes e adiciona melhorias de interface no cardápio.

## Melhorias incluídas

- Menu lateral de categorias no desktop.
- Gaveta de categorias no celular/tablet.
- Categorias dinâmicas vindas do catálogo.
- Destaque da categoria ativa.
- Carrinho redesenhado com imagens, controles maiores e indicador do pedido mínimo.
- Pedido mínimo configurável no Admin.
- Fotos opcionais para categorias.
- Fotos opcionais para produtos.
- Fotos aparecem também no carrinho.
- Fallback para as imagens atuais quando nenhuma imagem é cadastrada.
- Compatibilidade com produtos/categorias antigos sem `imageUrl`.
- Mantidos Supabase, autenticação, checkout, pedidos, API e regras de negócio existentes.

## Configuração única necessária no Supabase

1. No Supabase Console, abra o projeto `cardapioentregas01-f`.
2. Ative o **Storage** caso ainda não esteja ativado.
3. Em Storage > Rules, use uma regra que permita leitura pública dos arquivos e gravação apenas para usuários autenticados. Exemplo:

```text
As políticas completas do Storage já estão em `supabase-schema.sql`. Execute esse arquivo no SQL Editor; use as políticas do Supabase Storage.
```

Se o projeto já tiver regras de Storage próprias, preserve-as e apenas adapte a permissão da pasta `cardapio/`.

4. O pedido mínimo é salvo automaticamente em:
`configuracoes/loja` → campo `minimumOrder`.

Se esse documento não existir, o cardápio continua usando **R$ 25,00**.

## Como usar no Admin

- Configurações → Pedido mínimo: altere e salve o valor.
- Categorias → Nova Categoria: selecione uma foto opcional.
- Categorias existentes: botão `🖼️ Foto` permite trocar a foto.
- Produtos → adicionar produto: campo `Foto do produto`.
- Produtos → editar produto: campo `Foto` permite substituir a imagem.

As imagens são enviadas para Supabase Storage em:
- `cardapio/categorias/...`
- `cardapio/produtos/...`

## Observação

O ZIP contém o código-fonte atualizado. Não foi incluída uma pasta `node_modules` nem arquivos de build, para manter o pacote leve. No computador/Render/GitHub, execute:

```bash
npm install
npm run build
```

Depois publique normalmente como o projeto anterior.
