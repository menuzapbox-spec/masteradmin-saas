# Menu Gorila — Painel Master SaaS V1

Painel Master para administrar o SaaS de cardápios.

## Incluído

- Login com Supabase Auth
- Verificação de administrador Master
- Dashboard
- Lista de lojas
- Lista de clientes/lojas
- Lista de planos
- Cadastro de cliente + loja
- Criação segura do usuário através de Supabase Edge Function
- Criação automática de `store_members`, assinatura e `store_settings`
- Layout responsivo para PC, tablet e celular

## 1. Banco

O banco SaaS principal deve estar criado.

Depois execute no SQL Editor:

`supabase/01-platform-master.sql`

Esse SQL cria `platform_admins` e coloca o usuário Master atual no projeto.

## 2. Configurar o frontend

Copie `.env.example` para `.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

A anon key fica em Settings > API no Supabase.

Depois:

```bash
npm install
npm run dev
```

Produção:

```bash
npm run build
```

## 3. Edge Function

A criação de clientes usa `auth.admin.createUser()`, por isso a chave privilegiada NÃO fica no navegador.

Com Supabase CLI:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy create-client
```

A função usa as variáveis seguras do ambiente do Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca coloque a service role key no frontend.

## 4. GitHub

Suba o projeto para um repositório e não publique `.env.local`.

## 5. Render

Crie um Static Site.

Build Command:

```text
npm install && npm run build
```

Publish Directory:

```text
dist
```

Variáveis de ambiente no Render:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Observação

Esta é a V1 do núcleo Master. Ela ainda não inclui cobrança automática, domínio personalizado, edição/exclusão de lojas ou o cardápio público multi-loja.
