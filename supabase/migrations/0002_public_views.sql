-- =========================================================
-- FazzyPro · Views públicas (apenas campos não sensíveis)
-- As views rodam como dono (definer), ignorando a RLS das tabelas
-- de origem, mas expõem SOMENTE nome/iniciais/cidade (nunca CPF/telefone).
-- =========================================================

-- Catálogo de profissionais (para seleção em qualquer área)
create or replace view public.pros_public as
  select id, name, initials, city, category, rating, jobs, verified, bio, experience, created_at
  from public.profiles
  where role = 'pro';

-- Nome/cidade de qualquer perfil (para exibir quem pediu, em conversas, etc.)
create or replace view public.profiles_public as
  select id, name, initials, city
  from public.profiles;

-- Grants (anon e authenticated)
grant select on public.pros_public to anon, authenticated;
grant select on public.profiles_public to anon, authenticated;
