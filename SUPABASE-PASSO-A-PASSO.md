# Grazia White Label v2.0 — Supabase + GitHub + Render

## 1. Criar o projeto Supabase
1. Acesse https://supabase.com/dashboard.
2. Crie um novo projeto.
3. Defina uma senha forte para o banco e guarde-a em local seguro.
4. Espere o projeto terminar de provisionar.

## 2. Criar o banco, regras e Storage
1. Abra **SQL Editor**.
2. Crie uma nova query.
3. Copie todo o conteúdo de `supabase-schema.sql`.
4. Execute.
5. Confirme que as tabelas `admins`, `catalogo`, `configuracoes`, `config`, `pedidos` e `duvidas` aparecem em **Table Editor**.
6. Confirme que o bucket `cardapio` aparece em **Storage**.

## 3. Ativar login por e-mail
1. Abra **Authentication > Providers**.
2. Ative **Email**.
3. Para o primeiro administrador, use **Authentication > Users > Add user**.
4. Crie o e-mail e a senha do administrador.
5. Copie o **User UID** desse usuário.
6. Volte ao SQL Editor e execute:

```sql
insert into public.admins (id, ativo)
values ('COLE-O-UID-AQUI', true);
```

Não coloque senha no código e não coloque a `service_role key` no Render.

## 4. URL do Admin e recuperação de senha
Este projeto usa **dois serviços Render**: um para o cardápio e outro para o Admin. Por isso, o reset de senha deve voltar explicitamente para o serviço do Admin.

### No Render — serviço `grazia-sorvetes-admin`
Adicione a variável:

```text
VITE_ADMIN_URL=https://URL-DO-SEU-ADMIN.onrender.com
```

Use a URL pública do Admin, **sem** `/admin-1.html` no final. O código acrescenta `/admin-1.html` automaticamente.

### No Supabase — Authentication > URL Configuration
Em **Redirect URLs**, adicione:

```text
https://URL-DO-SEU-ADMIN.onrender.com/**
```

Também pode manter a URL do cardápio na lista se ela já for usada por confirmações ou outros fluxos. A **Site URL** deve ser a URL pública principal que você quer usar como destino padrão. Para o reset, o projeto usa `redirectTo` explícito para o Admin.

O Supabase exige que o `redirectTo` corresponda a uma URL permitida na lista de Redirect URLs. A documentação também recomenda configurar a Site URL corretamente para produção.

## 5. Pegar as chaves públicas
Abra **Project Settings > API** e copie:
- Project URL
- Publishable/anon key (use a chave pública indicada pelo painel)

Apenas essas duas variáveis entram no frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nunca use `service_role` no Vite, GitHub ou navegador.

## 6. GitHub
1. Crie um repositório novo.
2. Envie todos os arquivos deste ZIP para o repositório.
3. Não envie `.env` com chaves reais.
4. O `.env.example` é apenas um modelo.

Exemplo de comandos locais:

```bash
git init
git add .
git commit -m "Grazia White Label v2.0 Supabase"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

## 7. Render
1. Abra o Render.
2. **New > Static Site**.
3. Conecte o repositório GitHub.
4. Build Command:

```bash
npm install && npm run build
```

5. Publish Directory:

```text
dist
```

6. Em **Environment**, crie:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

7. Salve e faça o deploy.

O `render.yaml` deste projeto já contém essas duas variáveis como `sync: false`.

## 8. Teste do Admin — ordem correta
1. Abra diretamente `https://URL-DO-SEU-ADMIN.onrender.com/admin-1.html`.
2. Faça login com o e-mail e senha criados em **Authentication > Users**.
3. Se o Supabase aceitar a senha, mas o painel continuar bloqueado, confira se o **mesmo User UID** está na tabela `public.admins` com `ativo = true`.
4. Teste logout.
5. Clique em **Esqueci minha senha** e confirme que o e-mail chega.
6. Abra o link recebido. Ele deve voltar para `https://URL-DO-SEU-ADMIN.onrender.com/admin-1.html`, e não para o cardápio.
7. Defina a nova senha e faça login novamente.
8. Só depois teste criação/edição/pausa de categoria e produto, upload de imagem, pedidos e demais funções.

## 9. Como o v2.0 organiza os dados
O projeto mantém os nomes funcionais usados no v1.3 para reduzir mudanças no código:
- `catalogo` → catálogo e categorias.
- `configuracoes` → configurações da loja.
- `config` → pagamentos.
- `pedidos` → pedidos do cliente.
- `duvidas` → perguntas dos clientes.
- `admins` → autorização dos administradores.

Os dados de catálogo/configuração ficam em JSONB para preservar a estrutura atual do Admin e do cardápio sem obrigar uma reconstrução completa das telas.

## 10. White Label
Para a primeira loja, use um projeto Supabase próprio.
Para outro cliente, crie outro projeto Supabase e use o mesmo código GitHub/Render com as novas variáveis de ambiente.

Arquitetura:

GitHub → código White Label

Render → hospedagem do cliente

Supabase → Auth + PostgreSQL + Storage + Realtime

## 11. Segurança
- O frontend usa somente a chave pública do Supabase.
- A autorização do Admin é feita por `auth.users` + tabela `admins`.
- RLS bloqueia alterações públicas no catálogo/configuração.
- Cliente público pode criar pedidos e dúvidas, mas não pode lê-los.
- Imagens são públicas para exibição e somente Admin autorizado pode gravar/excluir.
- A chave `service_role` nunca deve ser colocada no navegador.

## 12. Observação sobre spam
Como o cliente precisa conseguir criar pedido e dúvida sem fazer login, essas duas inserções são públicas. Isso permite spam automatizado. A versão inicial mantém o comportamento funcional do projeto. Uma etapa futura pode adicionar proteção adicional, como Supabase CAPTCHA/App Check equivalente ou rate limiting, sem mudar o fluxo do cliente.
