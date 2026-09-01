# FazzyPro — Backend (Next.js + Supabase + Mercado Pago)

Backend real do FazzyPro: marketplace de serviços (mercado Brasil). Este projeto substitui o protótipo
`só no navegador` por um app com banco de dados, login real, chat em tempo real e pagamento.

## O que já está pronto

- **Banco de dados (PostgreSQL)** com segurança por linha (RLS) em `supabase/migrations/`.
  - `profiles` (CPF único + validação), `requests`, `proposals`, `channels`, `messages`, `notifications`, `payments`.
  - Trigger que cria o perfil quando o usuário é criado.
  - View públicas `profiles_public` (nome/iniciais/cidade) e `pros_public` (sem CPF/telefone).
- **Autenticação**: e-mail/senha, **Google (OAuth)** e cadastro em 2 etapas (conta → perfil) com
  **anti-duplicata de CPF e e-mail**.
- **Chat em tempo real** (Supabase Realtime).
- **Pedidos + propostas** (cliente publica / aceita; profissional envia orçamento).
- **Mercado Pago** (criação de Pix/cartão + webhook de confirmação) — servidor.

## Como colocar no ar (passo a passo)

### 1) Criar o projeto Supabase
1. Acesse https://supabase.com e crie um projeto (região próxima ao Brasil, ex.: `South America (São Paulo)`).
2. Em **SQL Editor**, execute o conteúdo de `supabase/migrations/0001_init.sql`, depois `0002_public_views.sql`
   e `0003_realtime.sql`. (Você pode rodar 1 por vez; é seguro.)
3. Em **Auth → Providers**, ative **Email** e **Google** (para o Google, crie as credenciais no Google Cloud
   Console e cole o Client ID / Secret; no campo de URL de redirecionamento use
   `https://SEU-DOMINIO/auth/callback`).
4. Em **Authentication → URL Configuration**, adicione `https://SEU-DOMINIO` e `http://localhost:3000`
   como URLs permitidas.
5. Em **Settings → API**, copie o `URL` e a `anon key`.

### 2) Configurar o ambiente
Copie `.env.example` para `.env.local` e preencha:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # Settings > API > service_role (nunca vaze)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MP_ACCESS_TOKEN=...
MP_PUBLIC_KEY=...
```

### 3) Rodar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000 → crie a conta (2 etapas) → teste o chat em tempo real em duas abas.

### 4) Publicar no Vercel
1. Suba o projeto para um repositório no GitHub.
2. No Vercel, **Importar** o repositório → o framework **Next.js** é detectado automaticamente.
3. Em **Environment Variables**, adicione as mesmas variáveis do `.env.local`.
4. **Deploy**. O Vercel gera HTTPS automático e você aponta o domínio `fazzypro.com.br`/`fazzypro.com`
   (registrado no GoDaddy) para o Vercel (DNS → nameservers ou registro A record).

### 5) Mercado Pago (cobrança real)
1. Crie uma **aplicação** em https://www.mercadopago.com.br/developers → **Credenciais**.
2. Copie `Access Token` e `Public Key` para as variáveis.
3. O endpoint `/api/mercado-pago/create` cria o pagamento (Pix via QR / cartão), e
   `/api/mercado-pago/webhook` confirma o pagamento e marca o pedido como **concluído**.
   - Para que o webhook chegue, configure a URL de notificação na aplicação ou use o `notification_url`
     já incluído. Localmente, use um túnel (ex.: `ngrok`) apontando para `/api/mercado-pago/webhook`.
   - A taxa da plataforma (12%) é calculada automaticamente no pagamento.

> **OBS:** o fluxo de **split de pagamentos** (a plataforma recebe a taxa e repassa o restante ao
> profissional) exige uma conta **marketplace** aprovada pelo Mercado Pago. A v1 cria o pagamento
> do cliente com a taxa embutida; o repasse pode ser habilitado depois.

## Estrutura
```
app/
  auth/            login, cadastro (2 etapas), Google
  api/             signout, google oauth, mercado-pago
  (app)/           dashboard, publish, requests, proposals, chat
lib/
  supabase/        client, server, admin (service role)
  auth.ts          helpers de sessão/perfil
  validators.ts    CPF valid, máscara, e-mail
  ai.ts            sugestão de categoria por texto
  mercado-pago.ts  integração com o Mercado Pago
supabase/migrations/  schema SQL (0001, 0002, 0003)
```
