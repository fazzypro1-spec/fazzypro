# FazzyPro — Guia passo a passo para colocar o app/backend no ar

> Siga na ordem. Cada passo é independente; use as caixas para marcar o que já fez.
> Você não precisa entender de programação — só seguir os cliques.

---

## 🔑 O que você vai precisar criar (contas gratuitas/planos grátis)
- [ ] **GitHub** (para guardar o código) — https://github.com
- [ ] **Supabase** (banco de dados + login + chat) — https://supabase.com
- [ ] **Vercel** (onde o site fica no ar) — https://vercel.com
- [ ] *(já tem)* **GoDaddy** (o domínio `fazzypro.com.br` / `fazzypro.com`)
- [ ] *(opcional, para cobrar de verdade)* **Mercado Pago** — https://www.mercadopago.com.br

> Dica: use o **mesmo e-mail** para GitHub, Supabase e Vercel, fica mais fácil.

---

## PASSO 1 — Pegar o código do backend
- [ ] Baixe o arquivo **`fazzypro-backend-projeto.zip`** (está na sua área de trabalho aqui da conversa).
- [ ] Descompacte na pasta **Documentos** do seu computador (duplo clique → "extrair tudo").
- [ ] Vai aparecer uma pasta chamada `fazzypro-backend`. **Essa é a pasta do código.** Não remova nada de dentro.

---

## PASSO 2 — Criar a conta no GitHub e subir o código
Subir o código é só "upload" da pasta para o GitHub (serviço que guarda código).

**Criar conta:**
- [ ] Acesse https://github.com → **Sign up** → siga os passos e confirme o e-mail.

**Criar um repositório (a "pasta" no GitHub):**
- [ ] No GitHub, clique no **+** (canto superior direito) → **New repository**.
- [ ] Em **Repository name** digite: `fazzypro`.
- [ ] Marque **Private** (privado) — assim só você vê o código.
- [ ] Clique em **Create repository**.

**Subir o código (o jeito mais fácil, pelo navegador):**
- [ ] Na página do repositório recém-criado, clique em **"uploading an existing file"** (o link azul).
- [ ] **Arraste a PASTA `fazzypro-backend` inteira** para a área de upload (ou clique para escolher).
  - ⚠️ Se o navegador não deixar arrastar a pasta, **abra a pasta** `fazzypro-backend` e arraste **todo o conteúdo dela** (os arquivos e subpastas) para dentro.
- [ ] Role para baixo → em **Commit changes**, digite "primeira versão" e clique em **Commit changes**.
- [ ] Pronto: seu código está guardado no GitHub e aparece na lista de arquivos.

> Alternativa mais fácil de acompanhar: instale o **GitHub Desktop** (https://desktop.github.com), entre com sua conta, **File → Add local repository**, escolha a pasta `fazzypro-backend`, e clique em **Publish repository**. Ele sobe tudo e acompanha as versões.

---

## PASSO 3 — Criar o banco de dados (Supabase) e montar as tabelas
O Supabase é o "banco de dados + login + chat" do app.

**Criar o projeto:**
- [ ] Acesse https://supabase.com → **Start your project** (login com GitHub ou e-mail).
- [ ] **Sign in with GitHub** (recomendado, já que você criou o GitHub).
- [ ] Clique em **New project**.
- [ ] **Organization:** deixe a padrão.
- [ ] **Project name:** `fazzypro`.
- [ ] **Database password:** clique em **Generate a password** e **GUARDE** essa senha (copie e salve num bloco de notas).
- [ ] **Region:** escolha **South America (São Paulo)** para ficar rápido no Brasil.
- [ ] Clique em **Create new project**. Aguarde 1–2 minutos o "banco de dados subir".

**Montar as tabelas (rodar as "migrações"):**
- [ ] Na barra lateral esquerda, clique em **SQL Editor**.
- [ ] Vamos colar o código das tabelas um a um. Abra no seu computador o arquivo:
  `fazzypro-backend/supabase/migrations/0001_init.sql`
- [ ] Copie **todo o conteúdo** desse arquivo.
- [ ] Cole no **SQL Editor** do Supabase e clique em **Run** (botão verde no canto inferior).
- [ ] Repita para os **outros dois arquivos**, um de cada vez (clique em **New query** antes de colar o próximo):
  - `0002_public_views.sql`
  - `0003_realtime.sql`
- [ ] Quando aparecer "Success. No rows returned" (ou sem erro), está certo.

> Se der erro: verifique se copiou o arquivo inteiro (do começo ao fim) e clique em "Run".
> Não precisa alterar nada.

**Anotar as chaves (você vai precisar no Passo 4):**
- [ ] Na barra lateral, clique em **Settings** → **API**.
- [ ] Copie:
  - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
  - **anon public** key
  - **service_role** key (⚠️ essa é secreta, não compartilhe)
- [ ] Cole as três aqui para usar depois:
  - Project URL: `_________________`
  - anon key: `_________________`
  - service_role: `_________________`

---

## PASSO 4 — Colocar as chaves no projeto
As chaves são a "senha" que liga o código ao seu banco de dados.

- [ ] Na pasta `fazzypro-backend`, abra o arquivo chamado **`.env.example`** com o Bloco de Notas.
- [ ] Salve uma cópia com o nome **`.env.local`** na mesma pasta (ou clique "Salvar como" → nome `.env.local`).
  - ⚠️ Se seu computador não mostrar o arquivo, ative "Mostrar arquivos ocultos" (no Explorer: aba **Exibir** → **Itens ocultos**).
- [ ] Abra o `.env.local` e preencha com as chaves que você anotou:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```
- [ ] Salve o arquivo (Ctrl+S).

> ⚠️ **O `.env.local` NÃO vai para o GitHub** (já está no `.gitignore` para não vazar a senha). Você vai digitá-lo de novo dentro do Vercel no Passo 6.

---

## PASSO 5 — Subir o site no Vercel
O Vercel é quem "hospeda" o site na internet.

**Criar conta e importar do GitHub:**
- [ ] Acesse https://vercel.com → **Sign Up** → **Continue with GitHub** (entra com a mesma conta do GitHub).
- [ ] Autorize o Vercel a acessar o GitHub quando ele pedir.
- [ ] Na tela inicial, clique em **Add New…** → **Project**.
- [ ] Se aparecer seu repositório `fazzypro`, clique em **Import**. Se não aparecer, clique em **Adjust GitHub App Permissions** e libere o repositório.
- [ ] Confirme que **Framework Preset** = **Next.js** (o Vercel identifica sozinho).
- [ ] **Não** altere os outros campos. Clique em **Deploy**.
- [ ] Aguarde ~1–2 minutos. Quando aparecer **"Congratulations!"** com um link `https://fazzypro.vercel.app`, o site está no ar (ainda sem banco, por isso precisamos das chaves no passo seguinte).

---

## PASSO 6 — Colocar as chaves no Vercel
- [ ] No painel do Vercel, clique na aba **Settings** → **Environment Variables**.
- [ ] Clique em **Add** (3 vezes, uma para cada) e preencha:
  - **NEXT_PUBLIC_SUPABASE_URL** = `https://xxxx.supabase.co`
  - **NEXT_PUBLIC_SUPABASE_ANON_KEY** = `SUA_ANON_KEY`
  - **SUPABASE_SERVICE_ROLE_KEY** = `SUA_SERVICE_ROLE`
  - **NEXT_PUBLIC_SITE_URL** = `https://fazzypro.vercel.app`
- [ ] Clique em **Save**.
- [ ] Vá na aba **Deployments**, clique nos **⋯** do deploy e **Redeploy** para aplicar as variáveis.
- [ ] Aguarde terminar. Teste: abra o link do site → deve mostrar a tela de **Entrar**.

---

## PASSO 7 — Ligar seu domínio (fazzypro.com.br)
- [ ] No Vercel, clique em **Settings** → **Domains**.
- [ ] Digite `fazzypro.com.br` → **Add**. (Repita para `fazzypro.com` se quiser os dois.)
- [ ] O Vercel mostra os valores de DNS para você colocar na GoDaddy. **Anote** (geralmente):
  - **A** record apontando para `76.76.21.21`
  - **CNAME** para `www` apontando para `cname.vercel-dns.com`
  - *(verifique os valores exatos que o Vercel mostrar na tela)*
- [ ] Acesse **GoDaddy → Meus Domínios → gerenciar DNS** e adicione/edite esses registros.
- [ ] Salve. O HTTPS (cadeado) é **automático** e leva alguns minutos para ativar (até ~1 hora).
- [ ] Quando o Vercel marcar a caixa verde ao lado de `fazzypro.com.br`, está pronto. 🎉

---

## PASSO 8 — Testar o app de ponta a ponta
- [ ] Abra `fazzypro.com.br` → **Criar conta grátis** → escolha **Sou Cliente** → preencha e-mail e senha → **concluir cadastro** (nome, CPF, endereço).
- [ ] Crie uma **segunda conta** pelo celular (ou outra aba anônima) escolhendo **Sou Profissional**.
- [ ] Na conta **Cliente**, publique um pedido.
- [ ] Na conta **Profissional**, aceite a solicitação e **envie uma proposta**.
- [ ] Na conta **Cliente**, **aceite** a proposta → os dois caem no **chat** e podem conversar em tempo real.

> Se algo der branco/erro, veja o **PASSO 9**.

---

## PASSO 9 — Se algo der errado
- **Tela de "Erro: URL/Key required"** → as chaves do Supabase não entraram no Vercel. Refaça o Passo 6 (e o Redeploy).
- **Cadastro diz "CPF já cadastrado" para um CPF novo** → pode ser um CPF de teste repetido; use outro CPF válido.
- **Não aparece "Profissional" na tela do profissional** → a conta foi criada como Cliente. Crie a conta profissional escolhendo "Sou Profissional".
- **Login com Google não funciona** → no Supabase, **Authentication → Providers → Google**, ative e adicione o Client ID/Secret (ver README). Sem isso, use e-mail/senha.
- **O chat/propostas não atualizam na hora** → confirme que rodou o `0003_realtime.sql` e que o `messages` está na publicação Realtime.
- **Preciso de ajuda em qualquer passo** → me chame e descreva onde travou (ex.: "apareceu um erro vermelho escrito X").

---

## ✅ Checklist final
- [ ] Código no GitHub (Passo 2)
- [ ] Banco no Supabase com 3 migrações (Passo 3)
- [ ] Chaves no Vercel + Redeploy (Passo 6)
- [ ] Domínio `fazzypro.com.br` ligado com HTTPS (Passo 7)
- [ ] Cadastro de cliente e de profissional funcionando
- [ ] Publicar pedido → proposta → aceitar → chat funcionando

> ⚠️ **Pagamento real (Mercado Pago):** para cobrar de verdade, você precisa criar uma **conta de mercado** e uma **aplicação** no Mercado Pago e colocar o `Access Token`/`Public Key` no Vercel (no Passo 6). O código já suporta Pix/cartão com a taxa da plataforma. O **repasse** ao profissional (split) depende de conta marketplace aprovada.
