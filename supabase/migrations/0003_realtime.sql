-- =========================================================
-- FazzyPro · Realtime (chat em tempo real)
-- Permite que o Supabase emita inserções em `messages` para os inscritos.
-- =========================================================

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

alter table public.messages replica identity full;
