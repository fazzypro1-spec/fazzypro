-- =========================================================
-- FazzyPro · Esquema de banco (PostgreSQL / Supabase)
-- Mercado: Brasil · PT-BR
-- Segurança por linha (RLS): cada usuário só vê/edita o seu.
-- =========================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- PERFIS (estende auth.users do Supabase)
-- ---------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('cliente','pro')),
  name        text not null,
  initials    text,
  phone       text,
  city        text,
  district    text,
  street      text,
  number      text,
  address     text,
  cpf         text unique,                 -- validação anti-duplicata no app + check formato
  category    text,
  experience  text,
  bio         text,
  rating      numeric(3,1) default 5,
  jobs        integer default 0,
  verified    boolean default false,
  level       text default 'basic',
  via         text default 'email',        -- 'email' | 'google'
  created_at  timestamptz default now()
);

-- CPF válido (algoritmo oficial, ambos os dígitos verificadores)
create or replace function public.is_valid_cpf(c text) returns boolean
language plpgsql immutable as $$
declare d text; s1 int; s2 int; r1 int; r2 int; d1 int; d2 int;
begin
  d := regexp_replace(coalesce(c,''),'[^0-9]','','g');
  if length(d) <> 11 then return false; end if;
  if d ~ '^(\d)\1+$' then return false; end if;  -- rejeita todos iguais
  select sum((substring(d,i,1)::int)*(11-i)) into s1 from generate_series(1,9) i;
  r1 := s1%11; d1 := case when r1<2 then 0 else 11-r1 end;
  select sum((substring(d,i,1)::int)*((12-i))) into s2 from generate_series(1,10) i;
  r2 := s2%11; d2 := case when r2<2 then 0 else 11-r2 end;
  return (substring(d,10,1)::int = d1) and (substring(d,11,1)::int = d2);
end $$;

-- Constraint de CPF (11 dígitos) no perfil
alter table public.profiles add constraint profiles_cpf_check
  check (cpf is null or cpf ~ '^[0-9]{11}$');

-- ---------------------------------------------------------
-- PEDIDOS (o cliente publica uma solicitação)
-- ---------------------------------------------------------
create table public.requests (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text not null,
  address      text,
  city         text,
  "when"       text,
  budget       numeric,
  budget_max   numeric,
  category     text,
  status       text not null default 'aguardando'
               check (status in ('aguardando','em_andamento','aceita','recusada','concluida')),
  photos       jsonb default '[]',
  ai_result    jsonb,
  accepted_pro uuid references public.profiles(id),
  pay_method   text,
  created_at   timestamptz default now()
);
create index on public.requests(client_id);
create index on public.requests(status);

-- ---------------------------------------------------------
-- PROPOSTAS (profissionais enviam orçamentos)
-- ---------------------------------------------------------
create table public.proposals (
  id          uuid primary key default uuid_generate_v4(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  pro_id      uuid not null references public.profiles(id) on delete cascade,
  amount      numeric not null,
  message     text,
  status      text not null default 'aguardando'
              check (status in ('aguardando','aceita','recusada')),
  created_at  timestamptz default now(),
  unique(request_id, pro_id)
);
create index on public.proposals(pro_id);
create index on public.proposals(request_id);

-- ---------------------------------------------------------
-- CANAIS DE CHAT + MENSAGENS (tempo real)
-- ---------------------------------------------------------
create table public.channels (
  id          uuid primary key default uuid_generate_v4(),
  request_id  uuid references public.requests(id) on delete set null,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  pro_id      uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(client_id, pro_id)
);

create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  channel_id  uuid not null references public.channels(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  text        text not null,
  read        boolean default false,
  created_at  timestamptz default now()
);
create index on public.messages(channel_id, created_at);

-- ---------------------------------------------------------
-- NOTIFICAÇÕES
-- ---------------------------------------------------------
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  text        text not null,
  icon        text default 'bell',
  read        boolean default false,
  created_at  timestamptz default now()
);
create index on public.notifications(user_id, created_at desc);

-- ---------------------------------------------------------
-- PAGAMENTOS (Mercado Pago) · taxa da plataforma
-- ---------------------------------------------------------
create table public.payments (
  id             uuid primary key default uuid_generate_v4(),
  request_id     uuid not null references public.requests(id) on delete cascade,
  amount         numeric not null,
  fee            numeric not null default 0,      -- taxa da plataforma (12%)
  total          numeric not null,
  status         text not null default 'pending'
                 check (status in ('pending','approved','rejected','refunded')),
  method         text,                            -- 'pix' | 'credit_card'
  mp_payment_id  text,
  mp_preference  jsonb,
  created_at     timestamptz default now()
);
create index on public.payments(request_id);

-- =========================================================
-- FUNÇÕES AUXILIARES DE RLS
-- =========================================================
-- É o próprio usuário?
create or replace function public.is_self(uid uuid) returns boolean
language sql stable as $$
  select auth.uid() = uid
$$;

-- Usuário é profissional?
create or replace function public.is_pro() returns boolean
language sql stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'pro')
$$;

-- É cliente?
create or replace function public.is_cliente() returns boolean
language sql stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'cliente')
$$;

-- --------------------------------------------------------------------
-- RLS: habilita e adiciona políticas por tabela
-- --------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.requests      enable row level security;
alter table public.proposals     enable row level security;
alter table public.channels      enable row level security;
alter table public.messages      enable row level security;
alter table public.notifications enable row level security;
alter table public.payments      enable row level security;

-- ---- PROFILES ----
-- leitura: só o próprio perfil (público para o mercado via view à parte)
create policy "profiles_read_own" on public.profiles for select
  using (public.is_self(id));
-- inserção: apenas a própria linha, obrigatoriamente
create policy "profiles_insert_own" on public.profiles for insert
  with check (public.is_self(id));
-- atualização: apenas o próprio
create policy "profiles_update_own" on public.profiles for update
  using (public.is_self(id));

-- ---- REQUESTS ----
-- leitura: o dono vê; profissionais veem pedidos aguardando (mercado aberto)
create policy "requests_read" on public.requests for select
  using (client_id = auth.uid() or (status = 'aguardando' and public.is_pro()));
-- inserção: só o cliente dono
create policy "requests_insert" on public.requests for insert
  with check (public.is_cliente() and client_id = auth.uid());
-- atualização: o cliente dono, ou o profissional aceito (muda status/aceita proposta)
create policy "requests_update" on public.requests for update
  using (client_id = auth.uid() or accepted_pro = auth.uid());

-- ---- PROPOSTAS ----
-- leitura: cliente dono do pedido vê; o profissional que enviou vê a sua
create policy "proposals_select" on public.proposals for select
  using (pro_id = auth.uid() or exists(
    select 1 from public.requests r where r.id = request_id and r.client_id = auth.uid()));
-- inserção: só profissional
create policy "proposals_insert" on public.proposals for insert
  with check (public.is_pro() and pro_id = auth.uid());
-- atualização: só o cliente dono (aceitar/recusar)
create policy "proposals_update" on public.proposals for update
  using (exists(select 1 from public.requests r where r.id = request_id and r.client_id = auth.uid()));

-- ---- CHANNELS ----
create policy "channels_select" on public.channels for select
  using (client_id = auth.uid() or pro_id = auth.uid());
create policy "channels_insert" on public.channels for insert
  with check (client_id = auth.uid() or pro_id = auth.uid());

-- ---- MESSAGES ----
create policy "messages_select" on public.messages for select
  using (exists(select 1 from public.channels c
    where c.id = channel_id and (c.client_id = auth.uid() or c.pro_id = auth.uid())));
create policy "messages_insert" on public.messages for insert
  with check (sender_id = auth.uid() and exists(select 1 from public.channels c
    where c.id = channel_id and (c.client_id = auth.uid() or c.pro_id = auth.uid())));

-- ---- NOTIFICATIONS ----
create policy "notifications_select" on public.notifications for select
  using (user_id = auth.uid());
create policy "notifications_update" on public.notifications for update
  using (user_id = auth.uid());

-- ---- PAYMENTS ----
create policy "payments_select" on public.payments for select
  using (exists(select 1 from public.requests r
    where r.id = request_id and (r.client_id = auth.uid() or r.accepted_pro = auth.uid())));

-- --------------------------------------------------------------------
-- TRIGGER: cria o perfil automaticamente quando um usuário é criado
-- --------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, name, initials, via)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role'), 'cliente'),
    coalesce((new.raw_user_meta_data->>'name'), split_part(new.email,'@',1)),
    upper(substring(coalesce((new.raw_user_meta_data->>'name'), new.email) from 1 for 1)),
    coalesce((new.raw_user_meta_data->>'via'), 'email')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------
-- VIEW: catálogo público de profissionais verificado (sem dados sensíveis)
-- --------------------------------------------------------------------
create or replace view public.pros_public as
  select id, name, initials, city, category, rating, jobs, verified, bio,
         experience, created_at
  from public.profiles
  where role = 'pro';
